-- ===================================
-- usage_tracking 表结构
-- 用于追踪用户的 AI 使用次数（支持智能降级）
-- ===================================

-- 创建表
CREATE TABLE IF NOT EXISTS usage_tracking (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户关联
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 时间维度
  month TEXT NOT NULL,                    -- "2025-10" 格式的月份
  day TEXT NOT NULL,                      -- "2025-10-28" 格式的日期
  
  -- 使用计数
  daily_count INT DEFAULT 0,              -- 当日已使用次数
  monthly_count INT DEFAULT 0,            -- 本月已使用次数
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 唯一约束（每个用户每月一条记录）
  UNIQUE(user_id, month)
);

-- ===================================
-- 索引
-- ===================================

-- 主查询索引（按用户和月份）
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month 
  ON usage_tracking(user_id, month);

-- 日期查询索引
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_day 
  ON usage_tracking(user_id, day);

-- 月份查询索引（用于统计）
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month 
  ON usage_tracking(month);

-- ===================================
-- 触发器：自动更新 updated_at
-- ===================================

CREATE OR REPLACE FUNCTION update_usage_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_tracking_timestamp();

-- ===================================
-- Row Level Security (RLS) 策略
-- ===================================

-- 启用 RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- 策略 1: 用户只能查看自己的记录
CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- 策略 2: 用户可以插入自己的记录
CREATE POLICY "Users can insert own usage"
  ON usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 策略 3: 用户可以更新自己的记录
CREATE POLICY "Users can update own usage"
  ON usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 策略 4: 服务角色可以完全访问（用于后端 API）
CREATE POLICY "Service role has full access"
  ON usage_tracking
  FOR ALL
  USING (auth.role() = 'service_role');

-- ===================================
-- 辅助函数：获取或创建当月记录
-- ===================================

CREATE OR REPLACE FUNCTION get_or_create_usage_tracking(
  p_user_id UUID,
  p_month TEXT DEFAULT NULL,
  p_day TEXT DEFAULT NULL
)
RETURNS usage_tracking AS $$
DECLARE
  v_month TEXT;
  v_day TEXT;
  v_record usage_tracking;
BEGIN
  -- 如果没有提供月份，使用当前月份
  v_month := COALESCE(p_month, to_char(CURRENT_DATE, 'YYYY-MM'));
  v_day := COALESCE(p_day, to_char(CURRENT_DATE, 'YYYY-MM-DD'));
  
  -- 尝试获取现有记录
  SELECT * INTO v_record
  FROM usage_tracking
  WHERE user_id = p_user_id AND month = v_month;
  
  -- 如果不存在，创建新记录
  IF NOT FOUND THEN
    INSERT INTO usage_tracking (user_id, month, day, daily_count, monthly_count)
    VALUES (p_user_id, v_month, v_day, 0, 0)
    RETURNING * INTO v_record;
  ELSE
    -- 如果是新的一天，重置日计数
    IF v_record.day != v_day THEN
      UPDATE usage_tracking
      SET day = v_day,
          daily_count = 0,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month = v_month
      RETURNING * INTO v_record;
    END IF;
  END IF;
  
  RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 辅助函数：增加使用次数
-- ===================================

CREATE OR REPLACE FUNCTION increment_usage_tracking(
  p_user_id UUID,
  p_increment INT DEFAULT 1
)
RETURNS usage_tracking AS $$
DECLARE
  v_month TEXT;
  v_day TEXT;
  v_record usage_tracking;
BEGIN
  v_month := to_char(CURRENT_DATE, 'YYYY-MM');
  v_day := to_char(CURRENT_DATE, 'YYYY-MM-DD');
  
  -- 获取或创建记录
  v_record := get_or_create_usage_tracking(p_user_id, v_month, v_day);
  
  -- 增加计数
  UPDATE usage_tracking
  SET daily_count = daily_count + p_increment,
      monthly_count = monthly_count + p_increment,
      updated_at = NOW()
  WHERE user_id = p_user_id AND month = v_month
  RETURNING * INTO v_record;
  
  RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 数据清理：删除 3 个月前的旧数据
-- ===================================

CREATE OR REPLACE FUNCTION cleanup_old_usage_tracking()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- 删除 3 个月前的记录
  DELETE FROM usage_tracking
  WHERE month < to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 可以设置定期任务调用此函数（需要 pg_cron 扩展）
-- SELECT cron.schedule('cleanup-usage-tracking', '0 0 1 * *', 'SELECT cleanup_old_usage_tracking()');

-- ===================================
-- 示例查询
-- ===================================

-- 查询用户当月使用情况
-- SELECT * FROM usage_tracking 
-- WHERE user_id = 'xxx' AND month = '2025-10';

-- 查询用户今日使用情况
-- SELECT daily_count FROM usage_tracking 
-- WHERE user_id = 'xxx' AND day = '2025-10-28';

-- 增加用户使用次数（通过函数）
-- SELECT increment_usage_tracking('xxx', 1);

-- 获取本月所有用户的使用统计
-- SELECT 
--   COUNT(*) as total_users,
--   SUM(monthly_count) as total_usage,
--   AVG(monthly_count) as avg_usage_per_user,
--   MAX(monthly_count) as max_usage
-- FROM usage_tracking 
-- WHERE month = '2025-10';

-- ===================================
-- 说明
-- ===================================

/*
表结构说明：
1. user_id: 关联 auth.users 表
2. month: 月份标识（YYYY-MM 格式）
3. day: 日期标识（YYYY-MM-DD 格式）
4. daily_count: 当日使用次数（每天 0:00 重置）
5. monthly_count: 本月使用次数（每月 1 号重置）

使用方式：
1. 直接 SQL 查询：适用于简单查询
2. 辅助函数：推荐使用，自动处理日期切换

RLS 策略：
1. 用户只能访问自己的记录
2. 服务角色可以访问所有记录（用于 API）

性能优化：
1. 使用索引加速查询
2. 使用 UNIQUE 约束防止重复
3. 定期清理旧数据（保留 3 个月）
*/

