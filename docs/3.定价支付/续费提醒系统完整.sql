-- ===================================
-- 续费提醒系统数据库 Schema
-- ===================================
-- 功能：记录已发送的续费提醒，防止重复发送
-- ===================================

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

-- 用户可以查看自己的提醒记录
CREATE POLICY "Users can view their own reminders"
  ON renewal_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- 服务端可以插入提醒记录
CREATE POLICY "Service can insert reminders"
  ON renewal_reminders
  FOR INSERT
  WITH CHECK (true);

-- 5. 辅助函数

-- 检查是否已发送过某类型的提醒
CREATE OR REPLACE FUNCTION has_sent_reminder(
  p_subscription_id UUID,
  p_reminder_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM renewal_reminders
    WHERE subscription_id = p_subscription_id
      AND reminder_type = p_reminder_type
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 获取订阅的所有提醒记录
CREATE OR REPLACE FUNCTION get_subscription_reminders(p_subscription_id UUID)
RETURNS TABLE (
  reminder_type TEXT,
  sent_at TIMESTAMPTZ,
  email_to TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.reminder_type,
    r.sent_at,
    r.email_to
  FROM renewal_reminders r
  WHERE r.subscription_id = p_subscription_id
  ORDER BY r.sent_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. 清理旧记录的函数（可选）

-- 删除 90 天前的提醒记录
CREATE OR REPLACE FUNCTION cleanup_old_reminders()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM renewal_reminders
  WHERE sent_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 使用示例
-- ===================================

-- 查询即将到期的订阅（7天后到期）
/*
SELECT 
  us.id,
  us.user_id,
  us.tier,
  us.billing_cycle,
  us.current_period_end,
  u.email
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE us.status = 'active'
  AND us.current_period_end >= NOW() + INTERVAL '6 days 23 hours'
  AND us.current_period_end <= NOW() + INTERVAL '7 days 1 hour'
  AND NOT has_sent_reminder(us.id, '7_days');
*/

-- 记录已发送的提醒
/*
INSERT INTO renewal_reminders (
  subscription_id,
  user_id,
  reminder_type,
  email_to,
  email_id
) VALUES (
  'subscription-uuid-here',
  'user-uuid-here',
  '7_days',
  'user@example.com',
  'resend-email-id'
);
*/

-- 查看某个订阅的所有提醒记录
/*
SELECT * FROM get_subscription_reminders('subscription-uuid-here');
*/

-- 清理 90 天前的旧记录
/*
SELECT cleanup_old_reminders();
*/

-- ===================================
-- 完成！
-- ===================================

