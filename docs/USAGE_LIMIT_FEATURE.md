# 📊 使用次数限制功能文档

本文档说明 Lumi Dream App 的使用次数限制功能实现。

---

## 🎯 功能概述

### 限制规则

| 用户状态 | 每日限制 | 限制说明 |
|---------|---------|---------|
| **未登录** | 5 次 | 达到限制后提示登录 |
| **已登录** | 10 次 | 达到限制后需等待第二天 |

### 重置规则

- ✅ 每天 00:00（本地时间）自动重置计数
- ✅ 基于日期（YYYY-MM-DD）判断
- ✅ 跨天自动清零

---

## 🎨 用户界面

### 1. 剩余次数显示

```
┌────────────────────────────────────┐
│ I'm Listening... Tell Me More      │
│                        3 left today│  ← 剩余次数
│                                    │
│ [文本输入框]                        │
└────────────────────────────────────┘
```

### 2. 提醒警告（剩余 ≤ 2 次）

```
┌────────────────────────────────────┐
│ ⚠️ You have 2 of 5 free           │
│    interpretations left today.     │
└────────────────────────────────────┘
```

### 3. 未登录用户达到限制

```
┌────────────────────────────────────┐
│ ❌ You've used all 5 free          │
│    interpretations. Please sign    │
│    in to get 5 more interpretations│
│    today!                          │
└────────────────────────────────────┘
```

### 4. 已登录用户达到限制

```
┌────────────────────────────────────┐
│ ❌ You've reached your daily limit │
│    of 10 interpretations. Please   │
│    try again tomorrow.             │
└────────────────────────────────────┘
```

---

## 💻 技术实现

### 核心 Hook：`useUsageLimit`

```typescript
export function useUsageLimit() {
  const { isAuthenticated } = useAuth()
  
  return {
    usageCount,        // 当前使用次数
    remainingCount,    // 剩余次数
    isLimitReached,    // 是否达到限制
    canUse,           // 检查是否可以使用
    incrementUsage,   // 增加使用次数
    getLimit,         // 获取当前限制
    getLimitMessage,  // 获取限制提示信息
  }
}
```

### 数据存储

**存储位置**：`localStorage`

**存储键**：`lumi_usage_data`

**数据结构**：
```typescript
interface UsageData {
  count: number    // 使用次数
  date: string     // 日期（YYYY-MM-DD）
}
```

**示例数据**：
```json
{
  "count": 3,
  "date": "2025-10-18"
}
```

### 限制检查流程

```
用户点击"解梦"按钮
  ↓
检查输入是否为空
  ↓
调用 canUse() 检查限制
  ↓
未达到限制 → 继续解析
  ↓
解析成功 → incrementUsage()
  ↓
更新显示的剩余次数
```

### 日期重置逻辑

```typescript
// 获取存储的数据
const data = getUsageData()

// 检查日期
if (data.date !== getTodayDate()) {
  // 新的一天，重置计数
  return { count: 0, date: getTodayDate() }
}

// 同一天，返回现有数据
return data
```

---

## 🎯 用户体验流程

### 未登录用户流程

```
1. 首次访问
   ├─> 显示：5 left today
   └─> 可以使用

2. 使用 1-3 次
   ├─> 正常使用
   └─> 显示剩余次数

3. 使用 4 次（剩余 1 次）
   ├─> 显示警告提醒
   └─> "You have 1 of 5 free interpretations left today"

4. 使用 5 次（达到限制）
   ├─> 输入框禁用
   ├─> 按钮禁用
   ├─> 显示错误提示
   └─> "Please sign in to get 5 more interpretations today!"

5. 用户登录
   ├─> 限制提升到 10 次
   ├─> 已使用 5 次
   └─> 剩余 5 次可用
```

### 已登录用户流程

```
1. 登录后访问
   ├─> 显示：10 left today
   └─> 可以使用

2. 使用 1-8 次
   ├─> 正常使用
   └─> 显示剩余次数

3. 使用 9 次（剩余 1 次）
   ├─> 显示警告提醒
   └─> "You have 1 of 10 interpretations left today"

4. 使用 10 次（达到限制）
   ├─> 输入框禁用
   ├─> 按钮禁用
   ├─> 显示错误提示
   └─> "You've reached your daily limit. Please try again tomorrow."
```

---

## 🔧 配置选项

### 方法 1：通过环境变量配置（推荐）

在 `.env.local` 文件中添加或修改：

```bash
# 未登录用户每日限制（默认：5）
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=5

# 已登录用户每日限制（默认：10）
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

**示例配置**：

```bash
# 更宽松的限制
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=10
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=20

# 更严格的限制
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=3
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=5

# 仅限已登录用户
NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT=0
NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT=10
```

**修改后需要**：
```bash
# 重启开发服务器
npm run dev
```

### 方法 2：直接修改代码（不推荐）

如果你不想使用环境变量，也可以直接编辑 `hooks/use-usage-limit.ts`：

```typescript
const ANONYMOUS_LIMIT = parseInt(process.env.NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT || "5", 10)
const AUTHENTICATED_LIMIT = parseInt(process.env.NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT || "10", 10)
```

修改引号内的默认值即可。

### 修改存储键

```typescript
const STORAGE_KEY = "lumi_usage_data"  // 修改存储键名
```

### 修改提示信息

编辑 `getLimitMessage()` 函数中的文字。

---

## 📱 响应式设计

### 桌面端

```
┌──────────────────────────────────────────┐
│ I'm Listening... Tell Me More  5 left today│
│                                           │
│ [大型文本输入框]                           │
└──────────────────────────────────────────┘
```

### 移动端

```
┌─────────────────────┐
│ I'm Listening...    │
│         3 left today│
│                     │
│ [文本输入框]         │
└─────────────────────┘
```

---

## 🎨 UI 组件

### 警告提示（Alert）

**颜色方案**：
- 边框：`border-primary/50`（金色半透明）
- 背景：`bg-primary/5`（金色淡背景）
- 图标：`text-primary`（金色）

**触发条件**：
- 未达到限制
- 剩余次数 ≤ 2
- 剩余次数 > 0

### 错误提示（Alert Destructive）

**颜色方案**：
- 边框：红色
- 背景：红色淡背景
- 图标：红色

**触发条件**：
- 达到使用限制
- 其他错误（网络错误等）

### 剩余次数标签

**样式**：
```typescript
<span className="text-xs text-muted-foreground">
  {remainingCount} left today
</span>
```

**位置**：标题右侧

---

## 🔒 安全考虑

### 1. 本地存储

**优点**：
- ✅ 实现简单
- ✅ 无需服务器
- ✅ 响应快速

**限制**：
- ⚠️ 用户可以清除 localStorage 绕过限制
- ⚠️ 不同浏览器/设备不共享计数

### 2. 未来改进方向

**服务器端跟踪**：
```typescript
// 在 Supabase 创建使用记录表
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMP,
  ...
)

// 服务器端检查
SELECT COUNT(*) FROM usage_logs
WHERE user_id = $1 
  AND DATE(created_at) = CURRENT_DATE
```

**IP 地址限制**：
- 为未登录用户基于 IP 地址限制
- 需要服务器端实现

**设备指纹**：
- 使用设备指纹识别
- 更难绕过但更复杂

---

## 📊 统计数据

### 代码量

- 新增文件：1 个（`hooks/use-usage-limit.ts`）
- 修改文件：1 个（`app/page.tsx`）
- 新增代码：约 150 行
- Hook 代码：约 120 行
- 页面集成：约 30 行

### 功能覆盖

- ✅ 未登录用户限制（5 次）
- ✅ 已登录用户限制（10 次）
- ✅ 每日自动重置
- ✅ 剩余次数显示
- ✅ 警告提醒
- ✅ 限制达到后禁用
- ✅ 友好的错误提示

---

## 🧪 测试建议

### 测试场景

1. **未登录用户测试**
   - [ ] 首次访问显示 5 次剩余
   - [ ] 使用 1 次后显示 4 次剩余
   - [ ] 使用 4 次后显示警告
   - [ ] 使用 5 次后禁用输入
   - [ ] 提示登录获取更多次数

2. **登录用户测试**
   - [ ] 登录后显示 10 次剩余
   - [ ] 正常使用和计数
   - [ ] 使用 9 次后显示警告
   - [ ] 使用 10 次后禁用
   - [ ] 提示明天再来

3. **日期重置测试**
   - [ ] 修改系统日期到第二天
   - [ ] 刷新页面
   - [ ] 验证计数重置为 0

4. **登录状态切换测试**
   - [ ] 未登录使用 3 次
   - [ ] 登录后剩余 7 次（10-3）
   - [ ] 登出后剩余 2 次（5-3）

5. **localStorage 清除测试**
   - [ ] 使用几次后清除 localStorage
   - [ ] 刷新页面
   - [ ] 验证计数重置

---

## 💡 用户提示文案

### 中文版本（可选）

如需修改为中文提示，编辑以下文字：

```typescript
// 未登录用户
"您今天还剩 {count} 次免费解梦机会"
"您已用完今日 5 次免费解梦，请登录获取更多机会！"

// 已登录用户
"您今天还剩 {count} 次解梦机会"
"您已达到今日 10 次解梦限制，请明天再来！"

// 剩余次数标签
"{count} 次剩余"
```

---

## 🎉 总结

使用次数限制功能已成功实现！

### 关键特性

- ✅ **双层限制**：未登录 5 次，登录后 10 次
- ✅ **友好提示**：剩余次数实时显示
- ✅ **渐进引导**：鼓励用户登录
- ✅ **自动重置**：每天零点自动清零
- ✅ **UI 适配**：禁用状态清晰可见

### 用户价值

1. **激励登录**：未登录用户达到限制后引导登录
2. **公平使用**：防止滥用资源
3. **清晰反馈**：用户始终知道剩余次数
4. **每日刷新**：第二天可以继续使用

**立即体验新的使用限制功能！✨**

---

**实现日期**：2025-10-18  
**版本**：v2.2.0  
**状态**：✅ 完成

