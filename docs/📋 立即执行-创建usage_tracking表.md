# 📋 立即执行：创建 usage_tracking 表

**执行时间**: 现在  
**预计耗时**: 5 分钟

---

## 🚀 执行步骤

### 步骤 1: 打开 Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**

---

### 步骤 2: 执行 SQL 脚本

1. 点击 **New Query** 创建新查询
2. 复制以下完整 SQL（从下面的代码块）
3. 粘贴到编辑器
4. 点击 **Run** 或按 `Ctrl+Enter`

---

### 步骤 3: SQL 脚本（完整版）

```sql
-- ===================================
-- usage_tracking 表（生产环境精简版）
-- ===================================

-- 1. 创建表
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  day TEXT NOT NULL,
  daily_count INT DEFAULT 0,
  monthly_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, month)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month 
  ON usage_tracking(user_id, month);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_month 
  ON usage_tracking(month);

-- 3. 自动更新时间戳触发器
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

-- 4. RLS 策略
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
  ON usage_tracking FOR ALL
  USING (auth.role() = 'service_role');

-- 完成！
SELECT 'usage_tracking table created successfully!' as status;
```

---

### 步骤 4: 验证创建成功

执行以下查询验证：

```sql
-- 检查表是否存在
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'usage_tracking';
-- 应返回 1

-- 检查表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usage_tracking'
ORDER BY ordinal_position;

-- 检查索引
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'usage_tracking';
-- 应看到 2 个索引

-- 检查 RLS 策略
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'usage_tracking';
-- 应看到 2 个策略
```

---

### 步骤 5: 测试插入数据

```sql
-- 插入测试数据（可选）
INSERT INTO usage_tracking (user_id, month, day, daily_count, monthly_count)
VALUES (
  auth.uid(),  -- 当前用户
  to_char(CURRENT_DATE, 'YYYY-MM'),
  to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  1,
  1
);

-- 查询测试数据
SELECT * FROM usage_tracking WHERE user_id = auth.uid();

-- 删除测试数据
DELETE FROM usage_tracking WHERE user_id = auth.uid();
```

---

## ✅ 完成标志

执行成功后，你应该看到：

```
✅ Table "usage_tracking" created
✅ 2 indexes created
✅ 1 trigger created
✅ 2 RLS policies created
✅ Query returned: "usage_tracking table created successfully!"
```

---

**完成后请告诉我，我继续修复下一个问题！** 🚀

