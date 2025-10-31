# usage_tracking 表使用指南

**创建日期**: 2025-10-28  
**用途**: 追踪用户 AI 使用次数，支持智能降级

---

## 📋 快速开始

### 1. 创建表

在 **Supabase Dashboard** 执行：

1. 打开 Supabase 项目
2. 进入 **SQL Editor**
3. 复制 `usage_tracking表结构.sql` 的内容
4. 点击 **Run** 执行

或者使用 Supabase CLI：

```bash
supabase db push docs/3.定价支付/usage_tracking表结构.sql
```

---

## 📊 表结构

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,        -- 用户 ID
  month TEXT NOT NULL,           -- "2025-10"
  day TEXT NOT NULL,             -- "2025-10-28"
  daily_count INT DEFAULT 0,     -- 今日使用次数
  monthly_count INT DEFAULT 0,   -- 本月使用次数
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE(user_id, month)
);
```

---

## 🔧 在 API 中使用

### 方法 1: 直接查询（当前实现）

```typescript
// app/api/interpret/route.ts

// 查询用户本月使用次数
const { data: usageData } = await supabase
  .from("usage_tracking")
  .select("monthly_count")
  .eq("user_id", user.id)
  .eq("month", new Date().toISOString().slice(0, 7))  // "2025-10"
  .single()

const monthlyCount = usageData?.monthly_count || 0

// 判断是否降级
if (tier === "pro" && monthlyCount >= 100) {
  modelId = "anthropic/claude-3.5-haiku"  // 降级
}
```

---

### 方法 2: 使用辅助函数（推荐）

```typescript
// 增加使用次数（自动处理日期切换）
const { data, error } = await supabase
  .rpc('increment_usage_tracking', {
    p_user_id: user.id,
    p_increment: 1
  })

console.log("Updated usage:", data)
// { monthly_count: 51, daily_count: 3 }
```

---

## 📝 常用查询

### 1. 查询用户当月使用情况

```typescript
const { data } = await supabase
  .from("usage_tracking")
  .select("*")
  .eq("user_id", user.id)
  .eq("month", "2025-10")
  .single()

console.log(data)
// {
//   user_id: "xxx",
//   month: "2025-10",
//   day: "2025-10-28",
//   daily_count: 3,
//   monthly_count: 51
// }
```

---

### 2. 查询用户今日使用情况

```typescript
const today = new Date().toISOString().slice(0, 10)  // "2025-10-28"

const { data } = await supabase
  .from("usage_tracking")
  .select("daily_count")
  .eq("user_id", user.id)
  .eq("day", today)
  .single()

console.log(data?.daily_count)  // 3
```

---

### 3. 手动增加使用次数

```typescript
const month = new Date().toISOString().slice(0, 7)  // "2025-10"

const { data } = await supabase
  .from("usage_tracking")
  .update({ 
    monthly_count: supabase.raw('monthly_count + 1'),
    daily_count: supabase.raw('daily_count + 1')
  })
  .eq("user_id", user.id)
  .eq("month", month)
  .select()
  .single()
```

---

### 4. 初始化新用户记录

```typescript
const month = new Date().toISOString().slice(0, 7)  // "2025-10"
const day = new Date().toISOString().slice(0, 10)   // "2025-10-28"

const { data } = await supabase
  .from("usage_tracking")
  .upsert({
    user_id: user.id,
    month: month,
    day: day,
    daily_count: 0,
    monthly_count: 0
  }, {
    onConflict: 'user_id,month'
  })
  .select()
  .single()
```

---

## 🎯 使用场景

### 场景 1: Pro 用户智能降级

```typescript
// 在 interpret API 中
const { data: usage } = await supabase
  .from("usage_tracking")
  .select("monthly_count")
  .eq("user_id", user.id)
  .eq("month", new Date().toISOString().slice(0, 7))
  .single()

const monthlyCount = usage?.monthly_count || 0

// 降级判断
if (tier === "pro") {
  if (monthlyCount >= 100) {
    modelId = "anthropic/claude-3.5-haiku"   // 降级到 Haiku
    console.log(`Pro user downgraded (${monthlyCount}/200)`)
  } else {
    modelId = "anthropic/claude-3.5-sonnet"  // 使用 Sonnet
    console.log(`Pro user using premium (${monthlyCount}/100)`)
  }
}
```

---

### 场景 2: Dashboard 显示使用统计

```typescript
// pages/dashboard/page.tsx
const { data: usage } = await supabase
  .from("usage_tracking")
  .select("daily_count, monthly_count")
  .eq("user_id", user.id)
  .eq("month", new Date().toISOString().slice(0, 7))
  .single()

return (
  <div>
    <p>Today: {usage?.daily_count || 0} / {limits.daily}</p>
    <p>This Month: {usage?.monthly_count || 0} / {limits.monthly}</p>
  </div>
)
```

---

### 场景 3: 管理员统计报告

```typescript
// 查询本月所有用户使用统计
const { data: stats } = await supabase
  .from("usage_tracking")
  .select("monthly_count")
  .eq("month", "2025-10")

const totalUsage = stats?.reduce((sum, u) => sum + u.monthly_count, 0) || 0
const avgUsage = totalUsage / (stats?.length || 1)

console.log({
  total_users: stats?.length,
  total_usage: totalUsage,
  avg_usage: avgUsage.toFixed(2)
})
```

---

## 🔄 自动重置机制

### 日计数重置（每天 0:00）

表中的辅助函数 `get_or_create_usage_tracking()` 会自动检测日期变化：

```sql
-- 如果是新的一天，重置 daily_count
IF v_record.day != v_day THEN
  UPDATE usage_tracking
  SET day = v_day,
      daily_count = 0  -- ✅ 重置
  WHERE user_id = p_user_id AND month = v_month;
END IF;
```

---

### 月计数重置（每月 1 号）

在 API 中检查月份：

```typescript
const currentMonth = new Date().toISOString().slice(0, 7)

const { data: usage } = await supabase
  .from("usage_tracking")
  .select("*")
  .eq("user_id", user.id)
  .eq("month", currentMonth)
  .single()

if (!usage) {
  // 新的月份，自动创建新记录（monthly_count = 0）
  await supabase
    .from("usage_tracking")
    .insert({
      user_id: user.id,
      month: currentMonth,
      day: new Date().toISOString().slice(0, 10),
      daily_count: 0,
      monthly_count: 0
    })
}
```

---

## 🔐 安全性（RLS 策略）

### 已启用的策略

1. **用户只能查看自己的记录**
```sql
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);
```

2. **服务角色可以完全访问**（用于后端 API）
```sql
CREATE POLICY "Service role has full access"
  ON usage_tracking FOR ALL
  USING (auth.role() = 'service_role');
```

### 在 API 中使用

```typescript
// 使用 service role key（绕过 RLS）
import { createServiceClient } from "@/lib/supabase/service"

const supabase = createServiceClient()

// 现在可以访问所有用户的记录
const { data } = await supabase
  .from("usage_tracking")
  .select("*")  // ✅ 服务角色可以访问
```

---

## 🧹 数据清理

### 自动清理旧数据

表中包含清理函数：

```sql
-- 删除 3 个月前的记录
SELECT cleanup_old_usage_tracking();
```

### 设置定期任务（可选）

如果 Supabase 支持 `pg_cron`：

```sql
-- 每月 1 号 0:00 执行清理
SELECT cron.schedule(
  'cleanup-usage-tracking', 
  '0 0 1 * *', 
  'SELECT cleanup_old_usage_tracking()'
);
```

或者在应用层实现：

```typescript
// 每月 1 号执行
if (new Date().getDate() === 1) {
  await supabase.rpc('cleanup_old_usage_tracking')
}
```

---

## 📊 监控指标

### 关键指标查询

**1. 本月活跃用户数**

```sql
SELECT COUNT(DISTINCT user_id) as active_users
FROM usage_tracking
WHERE month = '2025-10';
```

**2. 本月总使用次数**

```sql
SELECT SUM(monthly_count) as total_usage
FROM usage_tracking
WHERE month = '2025-10';
```

**3. 平均使用次数**

```sql
SELECT AVG(monthly_count) as avg_usage
FROM usage_tracking
WHERE month = '2025-10';
```

**4. 高频用户（超过 100 次）**

```sql
SELECT user_id, monthly_count
FROM usage_tracking
WHERE month = '2025-10' AND monthly_count > 100
ORDER BY monthly_count DESC;
```

---

## 🐛 常见问题

### Q1: 记录不存在怎么办？

**A**: 使用 `upsert` 或辅助函数自动创建：

```typescript
const { data } = await supabase
  .rpc('get_or_create_usage_tracking', {
    p_user_id: user.id
  })
```

---

### Q2: 如何处理时区问题？

**A**: 统一使用 UTC 时间：

```typescript
const month = new Date().toISOString().slice(0, 7)  // UTC
```

或者转换为用户时区：

```typescript
const userTimezone = "America/New_York"
const month = new Date().toLocaleString("en-US", { 
  timeZone: userTimezone,
  year: 'numeric',
  month: '2-digit'
}).replace(/(\d+)\/(\d+)/, '$1-$2')  // "2025-10"
```

---

### Q3: 如何回溯测试降级逻辑？

**A**: 手动设置 monthly_count：

```typescript
// 临时设置为 100 次测试降级
await supabase
  .from("usage_tracking")
  .update({ monthly_count: 100 })
  .eq("user_id", user.id)
  .eq("month", "2025-10")
```

---

## ✅ 验证清单

创建表后验证：

- [ ] 表已创建：`usage_tracking`
- [ ] 索引已创建：3 个索引
- [ ] 触发器已创建：`usage_tracking_updated_at`
- [ ] RLS 已启用
- [ ] 策略已创建：4 个策略
- [ ] 辅助函数已创建：3 个函数
- [ ] 可以插入测试数据
- [ ] API 可以正确查询

---

## 📚 相关文档

- `usage_tracking表结构.sql` - SQL 脚本
- `✅ Pro用户成本优化完成.md` - 智能降级实现
- `✅ AI模型分层实施完成.md` - 整体架构

---

**创建完成后**，就可以在 interpret API 中使用此表进行智能降级判断了！🚀

