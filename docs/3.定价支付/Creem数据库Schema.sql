-- ===================================
-- Lumi Dream App - Creem 支付集成数据库 Schema
-- ===================================
-- 创建日期: 2025-10-21
-- 用途: 存储用户订阅信息
-- ===================================

-- 1. 创建用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 关联用户（外键）
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 订阅层级
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro')),
  
  -- 计费周期
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- 订阅状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  
  -- Creem 相关信息
  creem_subscription_id TEXT UNIQUE,
  creem_customer_email TEXT,
  creem_product_id TEXT,
  
  -- 订阅周期时间
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- 取消时间
  canceled_at TIMESTAMPTZ,
  
  -- 元数据（JSON 格式，用于存储额外信息）
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束：每个用户只能有一个订阅
  UNIQUE(user_id)
);

-- 2. 创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creem_id 
  ON user_subscriptions(creem_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
  ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier 
  ON user_subscriptions(tier);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 启用行级安全策略 (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略

-- 策略 1: 用户可以查看自己的订阅
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 策略 2: 用户可以更新自己的订阅（通过 API）
CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 策略 3: 服务端可以插入订阅记录（通过 service role）
-- 注意：这个策略需要使用 service_role key
CREATE POLICY "Service can insert subscriptions"
  ON user_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- 策略 4: 服务端可以更新订阅记录（Webhook 使用）
CREATE POLICY "Service can update subscriptions"
  ON user_subscriptions
  FOR UPDATE
  USING (true);

-- 6. 创建辅助函数

-- 获取用户当前订阅层级
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
  
  -- 如果没有订阅或订阅不活跃，返回 'free'
  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 检查用户是否有活跃订阅
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. 创建示例数据（仅用于开发测试）
-- 生产环境请删除此部分

-- INSERT INTO user_subscriptions (user_id, tier, billing_cycle, status)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'basic', 'monthly', 'active'),
--   ('00000000-0000-0000-0000-000000000002', 'pro', 'yearly', 'active');

-- 8. 授予权限（如果需要）
-- GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
-- GRANT ALL ON user_subscriptions TO service_role;

-- ===================================
-- 完成！
-- ===================================
-- 运行此脚本后，user_subscriptions 表已创建完成
-- 
-- 下一步:
-- 1. 在 Creem 后台配置 Webhook
-- 2. 配置环境变量
-- 3. 测试支付流程
-- ===================================

