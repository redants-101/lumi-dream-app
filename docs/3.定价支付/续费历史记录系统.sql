-- ===================================
-- 续费历史记录系统数据库 Schema
-- ===================================
-- 功能：记录所有订阅和支付事件，提供完整的账单历史
-- ===================================

-- 1. 创建订阅历史记录表
CREATE TABLE IF NOT EXISTS subscription_history (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联订阅
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- 关联用户
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 事件类型
  event_type TEXT NOT NULL CHECK (event_type IN (
    'subscription_created',    -- 订阅创建
    'subscription_renewed',    -- 订阅续费成功
    'subscription_upgraded',   -- 订阅升级
    'subscription_downgraded', -- 订阅降级
    'subscription_canceled',   -- 订阅取消
    'subscription_expired',    -- 订阅过期
    'payment_succeeded',       -- 支付成功
    'payment_failed',          -- 支付失败
    'refund_issued'           -- 退款
  )),
  
  -- 订阅层级
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro')),
  
  -- 计费周期
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- 金额信息
  amount DECIMAL(10, 2),        -- 交易金额
  currency TEXT DEFAULT 'USD',  -- 货币类型
  
  -- Creem 相关信息
  creem_subscription_id TEXT,
  creem_payment_id TEXT,        -- 支付 ID
  creem_invoice_id TEXT,        -- 发票 ID
  
  -- 周期信息
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- 事件详情
  description TEXT,             -- 事件描述
  metadata JSONB DEFAULT '{}'::jsonb, -- 额外元数据
  
  -- 状态
  status TEXT CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  
  -- 时间戳
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_subscription_history_user 
  ON subscription_history(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription 
  ON subscription_history(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type 
  ON subscription_history(event_type);

CREATE INDEX IF NOT EXISTS idx_subscription_history_event_date 
  ON subscription_history(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_history_status 
  ON subscription_history(status);

-- 复合索引：用户 + 日期（最常用的查询）
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_date 
  ON subscription_history(user_id, event_date DESC);

-- 3. 启用 RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略

-- 用户可以查看自己的历史记录
CREATE POLICY "Users can view their own history"
  ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- 服务端可以插入历史记录
CREATE POLICY "Service can insert history"
  ON subscription_history
  FOR INSERT
  WITH CHECK (true);

-- 服务端可以更新历史记录状态
CREATE POLICY "Service can update history"
  ON subscription_history
  FOR UPDATE
  USING (true);

-- 5. 辅助函数

-- 获取用户的订阅历史（分页）
CREATE OR REPLACE FUNCTION get_user_subscription_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  tier TEXT,
  billing_cycle TEXT,
  amount DECIMAL(10, 2),
  currency TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  description TEXT,
  status TEXT,
  event_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.event_type,
    sh.tier,
    sh.billing_cycle,
    sh.amount,
    sh.currency,
    sh.period_start,
    sh.period_end,
    sh.description,
    sh.status,
    sh.event_date
  FROM subscription_history sh
  WHERE sh.user_id = p_user_id
  ORDER BY sh.event_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 获取用户的总支付金额
CREATE OR REPLACE FUNCTION get_user_total_spent(p_user_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM subscription_history
  WHERE user_id = p_user_id
    AND event_type IN ('payment_succeeded', 'subscription_renewed')
    AND status = 'completed';
  
  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 获取用户的续费次数
CREATE OR REPLACE FUNCTION get_user_renewal_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM subscription_history
  WHERE user_id = p_user_id
    AND event_type IN ('subscription_renewed', 'payment_succeeded')
    AND status = 'completed';
  
  RETURN count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 获取最近的 N 笔交易
CREATE OR REPLACE FUNCTION get_recent_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  amount DECIMAL(10, 2),
  currency TEXT,
  description TEXT,
  status TEXT,
  event_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.event_type,
    sh.amount,
    sh.currency,
    sh.description,
    sh.status,
    sh.event_date
  FROM subscription_history sh
  WHERE sh.user_id = p_user_id
    AND sh.event_type IN ('payment_succeeded', 'payment_failed', 'refund_issued')
  ORDER BY sh.event_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. 触发器：自动记录订阅变更

-- 当订阅状态变更时自动记录
CREATE OR REPLACE FUNCTION record_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 仅在状态或层级变更时记录
  IF (TG_OP = 'UPDATE' AND (
    OLD.status != NEW.status OR 
    OLD.tier != NEW.tier
  )) THEN
    -- 根据变更类型决定事件类型
    DECLARE
      event_type_value TEXT;
      description_value TEXT;
    BEGIN
      -- 确定事件类型
      IF NEW.status = 'canceled' AND OLD.status = 'active' THEN
        event_type_value := 'subscription_canceled';
        description_value := 'Subscription canceled by user';
      ELSIF NEW.status = 'expired' AND OLD.status = 'active' THEN
        event_type_value := 'subscription_expired';
        description_value := 'Subscription expired due to payment failure';
      ELSIF NEW.tier != OLD.tier THEN
        IF NEW.tier > OLD.tier THEN
          event_type_value := 'subscription_upgraded';
          description_value := 'Subscription upgraded from ' || OLD.tier || ' to ' || NEW.tier;
        ELSE
          event_type_value := 'subscription_downgraded';
          description_value := 'Subscription downgraded from ' || OLD.tier || ' to ' || NEW.tier;
        END IF;
      ELSE
        -- 默认记录状态变更
        event_type_value := 'subscription_renewed';
        description_value := 'Subscription status changed from ' || OLD.status || ' to ' || NEW.status;
      END IF;
      
      -- 插入历史记录
      INSERT INTO subscription_history (
        subscription_id,
        user_id,
        event_type,
        tier,
        billing_cycle,
        creem_subscription_id,
        period_start,
        period_end,
        description,
        status,
        event_date
      ) VALUES (
        NEW.id,
        NEW.user_id,
        event_type_value,
        NEW.tier,
        NEW.billing_cycle,
        NEW.creem_subscription_id,
        NEW.current_period_start,
        NEW.current_period_end,
        description_value,
        'completed',
        NOW()
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_record_subscription_change ON user_subscriptions;
CREATE TRIGGER trigger_record_subscription_change
  AFTER UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION record_subscription_change();

-- ===================================
-- 使用示例
-- ===================================

-- 1. 手动记录支付成功事件
/*
INSERT INTO subscription_history (
  subscription_id,
  user_id,
  event_type,
  tier,
  billing_cycle,
  amount,
  currency,
  creem_subscription_id,
  creem_payment_id,
  period_start,
  period_end,
  description,
  status
) VALUES (
  'subscription-uuid',
  'user-uuid',
  'payment_succeeded',
  'basic',
  'monthly',
  4.99,
  'USD',
  'sub_creem_xxx',
  'pay_creem_xxx',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Monthly subscription payment',
  'completed'
);
*/

-- 2. 查询用户的订阅历史
/*
SELECT * FROM get_user_subscription_history('user-uuid', 20, 0);
*/

-- 3. 查询用户的总支付金额
/*
SELECT get_user_total_spent('user-uuid');
*/

-- 4. 查询用户的续费次数
/*
SELECT get_user_renewal_count('user-uuid');
*/

-- 5. 查询最近的交易
/*
SELECT * FROM get_recent_transactions('user-uuid', 5);
*/

-- 6. 按月统计收入
/*
SELECT 
  DATE_TRUNC('month', event_date) as month,
  tier,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue
FROM subscription_history
WHERE event_type IN ('payment_succeeded', 'subscription_renewed')
  AND status = 'completed'
GROUP BY DATE_TRUNC('month', event_date), tier
ORDER BY month DESC;
*/

-- 7. 查询失败的支付
/*
SELECT 
  user_id,
  tier,
  amount,
  description,
  event_date
FROM subscription_history
WHERE event_type = 'payment_failed'
  AND event_date >= NOW() - INTERVAL '30 days'
ORDER BY event_date DESC;
*/

-- ===================================
-- 数据迁移（可选）
-- ===================================

-- 如果需要从现有订阅创建初始历史记录
/*
INSERT INTO subscription_history (
  subscription_id,
  user_id,
  event_type,
  tier,
  billing_cycle,
  creem_subscription_id,
  period_start,
  period_end,
  description,
  status,
  event_date
)
SELECT 
  id as subscription_id,
  user_id,
  'subscription_created' as event_type,
  tier,
  billing_cycle,
  creem_subscription_id,
  current_period_start as period_start,
  current_period_end as period_end,
  'Initial subscription' as description,
  'completed' as status,
  created_at as event_date
FROM user_subscriptions
WHERE status = 'active';
*/

-- ===================================
-- 完成！
-- ===================================

