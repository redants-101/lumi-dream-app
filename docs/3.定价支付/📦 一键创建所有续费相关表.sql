-- =====================================================================
-- Lumi Dream App - 订阅续费管理系统完整数据库 Schema
-- =====================================================================
-- 功能：一次性创建所有续费管理相关的表
-- 包含：续费历史、提醒记录、同步日志
-- 创建日期：2025-10-31
-- =====================================================================

-- =====================================================================
-- 第一部分：订阅历史记录表
-- =====================================================================

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

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_date 
  ON subscription_history(user_id, event_date DESC);

-- 3. 启用 RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view their own history"
  ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert history"
  ON subscription_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update history"
  ON subscription_history
  FOR UPDATE
  USING (true);

-- 5. 辅助函数
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

-- =====================================================================
-- 第二部分：续费提醒记录表
-- =====================================================================

-- 1. 创建续费提醒记录表
CREATE TABLE IF NOT EXISTS renewal_reminders (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联订阅
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- 关联用户
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 提醒类型（7天前、3天前、1天前）
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('7_days', '3_days', '1_day')),
  
  -- 发送时间
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 收件人邮箱（记录发送到哪个邮箱）
  email_to TEXT NOT NULL,
  
  -- 邮件发送状态
  email_sent BOOLEAN DEFAULT true,
  
  -- 邮件服务商返回的 ID（Resend 返回的 email ID）
  email_id TEXT,
  
  -- 创建时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束：每个订阅的每种提醒类型只能发送一次
  UNIQUE(subscription_id, reminder_type)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_subscription 
  ON renewal_reminders(subscription_id);

CREATE INDEX IF NOT EXISTS idx_renewal_reminders_user 
  ON renewal_reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_renewal_reminders_sent_at 
  ON renewal_reminders(sent_at);

CREATE INDEX IF NOT EXISTS idx_renewal_reminders_type 
  ON renewal_reminders(reminder_type);

-- 3. 启用 RLS
ALTER TABLE renewal_reminders ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view their own reminders"
  ON renewal_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert reminders"
  ON renewal_reminders
  FOR INSERT
  WITH CHECK (true);

-- =====================================================================
-- 第三部分：同步日志表
-- =====================================================================

-- 1. 创建同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 同步类型
  sync_type TEXT NOT NULL CHECK (sync_type IN ('subscriptions', 'payments', 'full')),
  
  -- 统计信息
  total_checked INTEGER DEFAULT 0,    -- 检查的总数
  synced INTEGER DEFAULT 0,           -- 成功同步的数量
  updated INTEGER DEFAULT 0,          -- 更新的数量
  errors INTEGER DEFAULT 0,           -- 错误数量
  
  -- 详细更新信息
  updates JSONB,                      -- 更新详情
  
  -- 错误信息
  error_details JSONB,                -- 错误详情
  
  -- 时间信息
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,           -- 执行时长（秒）
  
  -- 元数据
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_logs_type 
  ON sync_logs(sync_type);

CREATE INDEX IF NOT EXISTS idx_sync_logs_completed 
  ON sync_logs(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created 
  ON sync_logs(created_at DESC);

-- 3. 启用 RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage sync logs"
  ON sync_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. 辅助函数
CREATE OR REPLACE FUNCTION get_recent_sync_logs(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  sync_type TEXT,
  total_checked INTEGER,
  synced INTEGER,
  updated INTEGER,
  errors INTEGER,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id,
    sl.sync_type,
    sl.total_checked,
    sl.synced,
    sl.updated,
    sl.errors,
    sl.completed_at,
    sl.duration_seconds
  FROM sync_logs sl
  WHERE sl.completed_at IS NOT NULL
  ORDER BY sl.completed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION should_sync(
  p_sync_type TEXT,
  p_hours_threshold INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  last_sync TIMESTAMPTZ;
BEGIN
  SELECT MAX(completed_at) INTO last_sync
  FROM sync_logs
  WHERE sync_type = p_sync_type
    AND completed_at IS NOT NULL;
  
  IF last_sync IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN (NOW() - last_sync) > (p_hours_threshold || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. 触发器：自动计算执行时长
CREATE OR REPLACE FUNCTION calculate_sync_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_sync_duration ON sync_logs;
CREATE TRIGGER trigger_calculate_sync_duration
  BEFORE INSERT OR UPDATE ON sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sync_duration();

-- =====================================================================
-- 验证创建结果
-- =====================================================================

DO $$
DECLARE
  tables_created TEXT[];
  missing_tables TEXT[];
BEGIN
  -- 检查所有表是否创建成功
  tables_created := ARRAY(
    SELECT table_name::TEXT
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('subscription_history', 'renewal_reminders', 'sync_logs')
  );
  
  -- 找出缺失的表
  missing_tables := ARRAY(
    SELECT unnest(ARRAY['subscription_history', 'renewal_reminders', 'sync_logs'])
    EXCEPT
    SELECT unnest(tables_created)
  );
  
  -- 输出结果
  RAISE NOTICE '✅ 已创建的表: %', array_to_string(tables_created, ', ');
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE WARNING '❌ 未创建的表: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '🎉 所有表创建成功！';
  END IF;
END $$;

-- =====================================================================
-- 使用说明
-- =====================================================================

-- 查询示例：
-- 1. 查询用户的订阅历史
-- SELECT * FROM subscription_history WHERE user_id = 'your-user-id' ORDER BY event_date DESC LIMIT 10;

-- 2. 查询用户总支出
-- SELECT get_user_total_spent('your-user-id');

-- 3. 查询用户续费次数
-- SELECT get_user_renewal_count('your-user-id');

-- 4. 查询续费提醒记录
-- SELECT * FROM renewal_reminders ORDER BY sent_at DESC LIMIT 10;

-- 5. 查询同步日志
-- SELECT * FROM get_recent_sync_logs(10);

-- 6. 检查是否需要同步
-- SELECT should_sync('subscriptions', 6);

-- =====================================================================
-- 完成！
-- =====================================================================
-- 执行此文件后，所有续费管理功能所需的数据库表都已创建完成
-- =====================================================================

