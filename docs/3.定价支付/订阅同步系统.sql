-- ===================================
-- 订阅同步日志表
-- ===================================
-- 功能：记录定期同步任务的执行情况
-- ===================================

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

-- 3. 启用 RLS（仅管理员可访问）
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 管理员策略（需要配置 service_role）
CREATE POLICY "Service can manage sync logs"
  ON sync_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. 辅助函数

-- 获取最近的同步记录
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

-- 获取同步统计
CREATE OR REPLACE FUNCTION get_sync_statistics(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  sync_type TEXT,
  total_runs INTEGER,
  successful_runs INTEGER,
  failed_runs INTEGER,
  total_updated INTEGER,
  total_errors INTEGER,
  avg_duration_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.sync_type,
    COUNT(*)::INTEGER as total_runs,
    COUNT(CASE WHEN sl.errors = 0 THEN 1 END)::INTEGER as successful_runs,
    COUNT(CASE WHEN sl.errors > 0 THEN 1 END)::INTEGER as failed_runs,
    SUM(sl.updated)::INTEGER as total_updated,
    SUM(sl.errors)::INTEGER as total_errors,
    AVG(sl.duration_seconds)::NUMERIC(10,2) as avg_duration_seconds
  FROM sync_logs sl
  WHERE sl.started_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY sl.sync_type;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 检查是否需要同步（上次同步超过 N 小时）
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
  
  -- 如果从未同步过，返回 true
  IF last_sync IS NULL THEN
    RETURN true;
  END IF;
  
  -- 检查是否超过阈值
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

-- 6. 清理旧日志的函数（保留 90 天）
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sync_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 使用示例
-- ===================================

-- 1. 记录同步任务
/*
INSERT INTO sync_logs (
  sync_type,
  total_checked,
  synced,
  updated,
  errors,
  updates,
  completed_at
) VALUES (
  'subscriptions',
  50,
  50,
  3,
  0,
  '[{"subscriptionId": "xxx", "oldStatus": "active", "newStatus": "canceled"}]'::jsonb,
  NOW()
);
*/

-- 2. 查询最近的同步记录
/*
SELECT * FROM get_recent_sync_logs(10);
*/

-- 3. 查询同步统计
/*
SELECT * FROM get_sync_statistics(30);
*/

-- 4. 检查是否需要同步
/*
SELECT should_sync('subscriptions', 24);
*/

-- 5. 查询失败的同步任务
/*
SELECT 
  id,
  sync_type,
  total_checked,
  errors,
  error_details,
  completed_at
FROM sync_logs
WHERE errors > 0
ORDER BY completed_at DESC
LIMIT 10;
*/

-- 6. 清理 90 天前的日志
/*
SELECT cleanup_old_sync_logs();
*/

-- ===================================
-- 监控查询
-- ===================================

-- 查看今天的同步情况
/*
SELECT 
  sync_type,
  COUNT(*) as runs,
  SUM(updated) as total_updates,
  SUM(errors) as total_errors,
  AVG(duration_seconds) as avg_duration
FROM sync_logs
WHERE DATE(completed_at) = CURRENT_DATE
GROUP BY sync_type;
*/

-- 查看同步成功率
/*
SELECT 
  sync_type,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN errors = 0 THEN 1 END) as successful,
  (COUNT(CASE WHEN errors = 0 THEN 1 END)::float / COUNT(*) * 100)::numeric(5,2) as success_rate
FROM sync_logs
WHERE completed_at >= NOW() - INTERVAL '7 days'
GROUP BY sync_type;
*/

-- ===================================
-- 完成！
-- ===================================

