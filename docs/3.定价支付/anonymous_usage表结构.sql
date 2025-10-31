-- ===================================
-- anonymous_usage 表结构
-- 用于 Anonymous 用户的 IP 限流
-- ===================================

-- 创建表
CREATE TABLE IF NOT EXISTS anonymous_usage (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- IP 地址
  ip_address TEXT NOT NULL,
  
  -- 时间维度
  date TEXT NOT NULL,                    -- "2025-10-28" 格式的日期
  hour INT NOT NULL,                     -- 小时 (0-23)
  
  -- 使用计数
  count INT DEFAULT 0,                   -- 该时间窗口的使用次数
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 唯一约束（每个 IP 每小时一条记录）
  UNIQUE(ip_address, date, hour)
);

-- ===================================
-- 索引
-- ===================================

CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip_date 
  ON anonymous_usage(ip_address, date);

CREATE INDEX IF NOT EXISTS idx_anonymous_usage_date 
  ON anonymous_usage(date);

-- ===================================
-- 触发器：自动更新 updated_at
-- ===================================

CREATE OR REPLACE FUNCTION update_anonymous_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anonymous_usage_updated_at
  BEFORE UPDATE ON anonymous_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_usage_timestamp();

-- ===================================
-- 数据清理：删除 7 天前的旧数据
-- ===================================

CREATE OR REPLACE FUNCTION cleanup_anonymous_usage()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- 删除 7 天前的记录
  DELETE FROM anonymous_usage
  WHERE date < to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYY-MM-DD');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 说明
-- ===================================

/*
表结构说明：
1. ip_address: 用户的 IP 地址
2. date: 日期（YYYY-MM-DD）
3. hour: 小时（0-23）
4. count: 该小时内的使用次数

限流策略：
1. 每小时最多 5 次（防止短时间内大量请求）
2. 每天最多 10 次（比 USAGE_LIMITS.anonymous.monthly 更宽松）

为什么用小时级别：
1. 防止恶意用户在短时间内大量请求
2. 正常用户一天内分散使用不会受影响
3. 降低存储成本（按小时聚合）

数据清理：
- 保留 7 天数据（用于分析）
- 7 天后自动删除（节省存储）
*/

-- 完成！
SELECT 'anonymous_usage table created successfully!' as status;

