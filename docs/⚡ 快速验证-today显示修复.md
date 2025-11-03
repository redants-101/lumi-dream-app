# ⚡ 快速验证 - today 显示修复

## 🎯 1 分钟快速测试

### 准备工作

```javascript
// 1. 打开 Chrome DevTools (F12)
// 2. 在 Console 中运行：
localStorage.clear()
```

---

### 测试步骤

#### 1. 匿名状态使用 1 次

- 访问 `http://localhost:3000`（确保未登录）
- 使用梦境解析功能 **1 次**
- 等待完成

#### 2. 检查 localStorage

```javascript
// 在 Console 中运行
const data = JSON.parse(localStorage.getItem('lumi_usage_data_v2'))
console.log('Usage Data:', data)
```

**应该显示**：
```json
{
  "dailyCount": 1,
  "date": "2025-11-03",
  "monthlyCount": 1,
  "month": "2025-11"
}
```

#### 3. 登录账号

- 点击 "Sign In"
- 使用 Google 或 GitHub 登录
- 等待登录完成

#### 4. 立即登出

- 点击用户头像
- 点击 "Sign out"
- **观察 Console 日志**

**应该看到**：
```
[Auth] ✅ Anonymous usage synced to localStorage: 
  { dailyCount: 1, date: "2025-11-03", monthlyCount: 1, month: "2025-11" }
```

#### 5. 检查首页显示

**右上角应该显示**：
```
1 today • 3 this month ✓
```

**计算逻辑**：
- today: `2 - 1 = 1`（limit.daily - dailyCount）
- this month: `4 - 1 = 3`（limit.monthly - monthlyCount）

---

## ✅ 验证通过标准

### 必须满足（全部）：

- [x] localStorage 有 `date` 字段（不是 `day`）
- [x] `dailyCount` 显示为 1
- [x] `monthlyCount` 显示为 1
- [x] 首页显示 `1 today`（不是 `2 today`）
- [x] 首页显示 `3 this month`
- [x] Console 没有错误

---

## ❌ 如果失败

### 问题 1：显示仍然是 `2 today`

**检查 localStorage**：
```javascript
const data = JSON.parse(localStorage.getItem('lumi_usage_data_v2'))
console.log('Date field:', data.date)  // 应该存在
console.log('Day field:', data.day)    // 应该不存在（undefined）
```

**如果 `data.day` 存在**：
- 说明代码未更新
- 需要硬刷新：`Ctrl + Shift + R`
- 或重启服务器：`npm run dev`

---

### 问题 2：localStorage 数据结构错误

**正确的结构**：
```json
{
  "dailyCount": 1,
  "date": "2025-11-03",     ✓
  "monthlyCount": 1,
  "month": "2025-11"        ✓
}
```

**错误的结构**：
```json
{
  "dailyCount": 1,
  "day": "2025-11-03",      ✗ 应该是 date
  "monthlyCount": 1,
  "month": "2025-11",
  "lastUpdated": "..."      ✗ 不需要这个字段
}
```

---

### 问题 3：Console 显示字段名错误

**错误的日志**：
```
[Auth] ✅ Anonymous usage synced to localStorage: 
  { dailyCount: 1, day: "2025-11-03", ... }  ✗
```

**正确的日志**：
```
[Auth] ✅ Anonymous usage synced to localStorage: 
  { dailyCount: 1, date: "2025-11-03", ... }  ✓
```

---

## 🔍 详细检查

### 检查代码是否更新

打开 `hooks/use-auth.ts`，搜索 `syncAnonymousUsageOnSignOut`：

```typescript
// 应该看到这个（正确）：
const syncedData = {
  dailyCount: usageData.dailyCount,
  date: usageData.day,  // ✓ day → date
  monthlyCount: usageData.monthlyCount,
  month: usageData.month,
}

// 不应该看到这个（错误）：
const syncedData = {
  dailyCount: usageData.dailyCount,
  day: usageData.day,   // ✗ 字段名错误
  monthlyCount: usageData.monthlyCount,
  month: usageData.month,
}
```

---

## 📊 完整测试场景

### 场景 1：新用户（0 次使用）

```
1. 清除缓存
2. 登录 → 登出
3. 预期：0 today • 4 this month ✓
```

### 场景 2：使用 1 次

```
1. 清除缓存
2. 匿名使用 1 次
3. 登录 → 登出
4. 预期：1 today • 3 this month ✓
```

### 场景 3：使用 2 次（达到日限制）

```
1. 清除缓存
2. 匿名使用 2 次
3. 登录 → 登出
4. 预期：0 today • 2 this month ✓
5. 尝试再次使用 → 应该被限制
```

---

## 🚀 快速命令

```javascript
// === 测试用命令集 ===

// 1. 清除所有缓存
localStorage.clear()

// 2. 查看当前使用数据
console.log(JSON.parse(localStorage.getItem('lumi_usage_data_v2')))

// 3. 查看 date 字段是否存在
const data = JSON.parse(localStorage.getItem('lumi_usage_data_v2'))
console.log('Has date field:', 'date' in data)
console.log('Has day field:', 'day' in data)

// 4. 手动设置测试数据
localStorage.setItem('lumi_usage_data_v2', JSON.stringify({
  dailyCount: 1,
  date: new Date().toISOString().slice(0, 10),
  monthlyCount: 1,
  month: new Date().toISOString().slice(0, 7)
}))
```

---

## ✅ 验证完成确认

**测试人**：___________  
**测试时间**：___________

### 测试结果：

- [ ] ✅ localStorage 字段名正确（date 不是 day）
- [ ] ✅ today 显示正确（1 today）
- [ ] ✅ this month 显示正确（3 this month）
- [ ] ✅ Console 日志正确
- [ ] ✅ 无错误提示

**状态**：✅ 通过 / ❌ 失败

**备注**：
___________________________________________

---

## 📚 相关文档

- [详细修复说明](./🔧%20字段名不匹配修复-today显示错误.md)
- [匿名用户数据同步测试](./🧪%20匿名用户数据同步测试指南.md)

