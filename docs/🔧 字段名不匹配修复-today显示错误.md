# 🔧 字段名不匹配修复 - today 显示错误

## 🐛 问题描述

**现象**：
```
配置：anonymous 用户 daily:2, monthly:4
实际使用：今天已使用 1 次
预期显示：1 today • 3 this month ✓
实际显示：2 today • 3 this month ✗
```

**问题**：
- `monthly` 显示正确（3 = 4 - 1）
- `daily` 显示错误（显示 2，应该是 1）

---

## 🔍 根本原因

### 字段名不匹配

**API/Service 层返回的字段**：
```typescript
// lib/services/usage-service.ts
interface AnonymousUsageInfo {
  dailyCount: number
  monthlyCount: number
  lastUpdated: string
  day: string        // ← 注意这里是 day
  month: string
}
```

**Context 层期望的字段**：
```typescript
// contexts/usage-limit-context.tsx
interface UsageData {
  dailyCount: number
  date: string       // ← 注意这里是 date
  monthlyCount: number
  month: string
}
```

### 数据流分析

```
1. 后端返回数据
   ↓
   { dailyCount: 1, monthlyCount: 1, day: "2025-11-03", month: "2025-11" }
   
2. use-auth.ts 同步到 localStorage（修复前）
   ↓
   localStorage: { dailyCount: 1, monthlyCount: 1, day: "2025-11-03", month: "2025-11" }
   
3. Context 读取 localStorage
   ↓
   ❌ 找不到 date 字段！
   ↓
   Context 认为这是"新的一天"（date 字段缺失）
   ↓
   重置 dailyCount = 0
   
4. 显示计算
   ↓
   remainingDaily = limit.daily - dailyCount = 2 - 0 = 2 ✗
```

---

## ✅ 修复方案

### 关键修改

**修复前（有问题）**：
```typescript
// hooks/use-auth.ts - syncAnonymousUsageOnSignOut()
const syncedData = {
  dailyCount: usageData.dailyCount,
  monthlyCount: usageData.monthlyCount,
  lastUpdated: usageData.lastUpdated,
  day: usageData.day,        // ❌ 字段名错误
  month: usageData.month,
}
```

**修复后（正确）**：
```typescript
// hooks/use-auth.ts - syncAnonymousUsageOnSignOut()
const syncedData = {
  dailyCount: usageData.dailyCount,
  date: usageData.day,        // ✅ 修复：day → date
  monthlyCount: usageData.monthlyCount,
  month: usageData.month,
}
```

### 完整修复

**修复了 3 处**：

1. **有使用记录时**：
```typescript
const syncedData = {
  dailyCount: usageData.dailyCount,
  date: usageData.day,  // ✅ 修复
  monthlyCount: usageData.monthlyCount,
  month: usageData.month,
}
```

2. **无使用记录时**：
```typescript
const initialData = {
  dailyCount: 0,
  date: new Date().toISOString().slice(0, 10),  // ✅ 修复
  monthlyCount: 0,
  month: new Date().toISOString().slice(0, 7),
}
```

3. **错误处理时**：
```typescript
const initialData = {
  dailyCount: 0,
  date: new Date().toISOString().slice(0, 10),  // ✅ 修复
  monthlyCount: 0,
  month: new Date().toISOString().slice(0, 7),
}
```

---

## 🎯 修复效果

### 修复前（错误）

**数据流**：
```
后端: { dailyCount: 1, day: "2025-11-03" }
  ↓
localStorage: { dailyCount: 1, day: "2025-11-03" }  ← day 字段
  ↓
Context 读取: date 字段缺失！
  ↓
Context 重置: dailyCount = 0
  ↓
显示: remainingDaily = 2 - 0 = 2 ✗
```

### 修复后（正确）

**数据流**：
```
后端: { dailyCount: 1, day: "2025-11-03" }
  ↓
localStorage: { dailyCount: 1, date: "2025-11-03" }  ← date 字段
  ↓
Context 读取: date 字段存在！
  ↓
Context 保留: dailyCount = 1
  ↓
显示: remainingDaily = 2 - 1 = 1 ✓
```

---

## 🧪 测试验证

### 测试步骤

1. **准备环境**
   ```javascript
   // 清除所有缓存
   localStorage.clear()
   ```

2. **匿名状态使用 1 次**
   - 访问 `http://localhost:3000`（未登录）
   - 使用梦境解析功能 **1 次**

3. **登录账号**
   - 点击 "Sign In" → 登录

4. **立即登出**
   - 点击用户头像 → "Sign out"

5. **检查首页显示**
   - 观察右上角使用限制

### ✅ 预期结果

**首页显示**：
```
1 today • 3 this month ✓
```

**localStorage 检查**：
```javascript
JSON.parse(localStorage.getItem('lumi_usage_data_v2'))

// 应该显示：
{
  "dailyCount": 1,
  "date": "2025-11-03",       // ✅ 字段名正确
  "monthlyCount": 1,
  "month": "2025-11"
}
```

**Console 日志**：
```
[Auth] ✅ Anonymous usage synced to localStorage: 
  { dailyCount: 1, date: "2025-11-03", monthlyCount: 1, month: "2025-11" }
```

---

## 📊 数据结构对比

### API/Service 层（输入）

```typescript
// lib/services/usage-service.ts
{
  dailyCount: 1,
  monthlyCount: 1,
  lastUpdated: "2025-11-03T10:30:00.000Z",
  day: "2025-11-03",    // ← API 使用 day
  month: "2025-11"
}
```

### localStorage（存储）

**修复前（错误）**：
```typescript
{
  dailyCount: 1,
  monthlyCount: 1,
  lastUpdated: "...",
  day: "2025-11-03",    // ✗ 字段名错误
  month: "2025-11"
}
```

**修复后（正确）**：
```typescript
{
  dailyCount: 1,
  date: "2025-11-03",   // ✓ 字段名正确
  monthlyCount: 1,
  month: "2025-11"
}
```

### Context 层（读取）

```typescript
// contexts/usage-limit-context.tsx
interface UsageData {
  dailyCount: number
  date: string          // ← Context 期望 date
  monthlyCount: number
  month: string
}
```

---

## 🎨 代码质量

### 改进点

1. **字段名映射**
   - ✅ API 层的 `day` 映射到 Context 的 `date`
   - ✅ 确保数据结构一致性

2. **注释说明**
   - ✅ 添加注释说明字段名转换
   - ✅ 标注关键修复点

3. **完整性**
   - ✅ 修复所有 3 处（正常、初始化、错误处理）
   - ✅ 确保所有代码路径都正确

---

## 🔍 为什么会出现这个问题？

### 历史原因

1. **API 层设计**
   - `AnonymousUsageInfo` 接口使用 `day` 字段（符合数据库字段名）

2. **Context 层设计**
   - `UsageData` 接口使用 `date` 字段（更通用的命名）

3. **同步逻辑疏忽**
   - 在 `use-auth.ts` 中同步数据时，直接复制了 API 返回的字段
   - 没有做字段名转换

### 教训

- ✅ 不同层之间的数据结构需要明确映射
- ✅ 添加类型检查可以避免这类错误
- ✅ 测试时需要检查 localStorage 的实际数据

---

## 📋 检查清单

- [x] ✅ 修复 `syncedData` 中的字段名（day → date）
- [x] ✅ 修复 `initialData` 中的字段名（day → date）
- [x] ✅ 修复错误处理中的字段名（day → date）
- [x] ✅ 移除不需要的 `lastUpdated` 字段
- [x] ✅ 无 Linter 错误
- [x] ✅ 添加注释说明

---

## 🎯 总结

### 问题根源
```
API 返回 day → localStorage 保存 day → Context 读取 date → 字段缺失 → 数据重置
```

### 修复方案
```
API 返回 day → 映射为 date → localStorage 保存 date → Context 读取 date → 数据正确
```

### 关键改进

1. **数据一致性**
   - ✅ 确保 localStorage 字段名与 Context 期望一致

2. **显示准确性**
   - ✅ daily 显示正确（1 today）
   - ✅ monthly 显示正确（3 this month）

3. **代码质量**
   - ✅ 添加注释说明字段转换
   - ✅ 提高代码可维护性

---

**修复完成时间**：2025-11-03  
**文件**：`hooks/use-auth.ts`  
**状态**：✅ 已修复，可测试

