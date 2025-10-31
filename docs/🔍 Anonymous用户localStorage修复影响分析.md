# 🔍 Anonymous 用户 localStorage 修复影响分析

**改动文件**: `contexts/usage-limit-context.tsx` 第 406-426 行  
**改动类型**: 逻辑优化  
**风险等级**: 🟢 低风险

---

## 📊 改动对比

### 修改前

```typescript
// ❌ 旧逻辑：未登录用户每次都强制清除 localStorage
useEffect(() => {
  if (!isAuthenticated) {
    // 强制清除 localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TIER_STORAGE_KEY)
    }
    
    // 强制重置为 0
    const anonymousData: UsageData = {
      dailyCount: 0,
      date: getTodayDate(),
      monthlyCount: 0,
      month: getCurrentMonth(),
    }
    setUsageData(anonymousData)
    updateLimitStatus(anonymousData, "anonymous")
  } else {
    const data = getUsageData()
    setUsageData(data)
  }
}, [isAuthenticated, getTodayDate, getCurrentMonth])
```

### 修改后

```typescript
// ✅ 新逻辑：未登录用户从 localStorage 读取数据
useEffect(() => {
  if (!isAuthenticated) {
    // 从 localStorage 读取数据（保留后端同步的使用情况）
    const data = getUsageData()  // 会自动处理日期重置
    setUsageData(data)
    updateLimitStatus(data, "anonymous")
  } else {
    const data = getUsageData()
    setUsageData(data)
  }
}, [isAuthenticated, getTodayDate, getCurrentMonth, getUsageData, updateLimitStatus])
```

---

## 🧪 全场景影响分析

### 场景 1: 未登录用户首次访问 ✅

**修改前**:
```
1. localStorage 为空
2. 强制清除 localStorage（无影响）
3. 设置为 { dailyCount: 0, monthlyCount: 0 }
4. 显示 "0/2 today, 0/4 this month"
```

**修改后**:
```
1. localStorage 为空
2. getUsageData() 返回 { dailyCount: 0, monthlyCount: 0 }
3. 设置为 { dailyCount: 0, monthlyCount: 0 }
4. 显示 "0/2 today, 0/4 this month"
```

**结论**: ✅ **无影响**，行为完全一致

---

### 场景 2: 未登录用户正常使用（核心改进）✅

**修改前**:
```
1. 提交梦境成功
2. API 返回 currentUsage: { daily: 1, monthly: 1 }
3. syncFromResponse 保存到 localStorage
4. ❌ useEffect 触发，强制清除 localStorage
5. ❌ 重置为 { dailyCount: 0, monthlyCount: 0 }
6. ❌ 显示 "0/2 today, 0/4 this month"（错误）
```

**修改后**:
```
1. 提交梦境成功
2. API 返回 currentUsage: { daily: 1, monthly: 1 }
3. syncFromResponse 保存到 localStorage
4. ✅ useEffect 触发，从 localStorage 读取
5. ✅ 读取到 { dailyCount: 1, monthlyCount: 1 }
6. ✅ 显示 "1/2 today, 1/4 this month"（正确）
```

**结论**: ✅ **改进**，修复了数据被清除的 bug

---

### 场景 3: 未登录用户刷新页面 ✅

**修改前**:
```
1. localStorage 中有 { dailyCount: 1, monthlyCount: 1 }
2. 刷新页面，useEffect 触发
3. ❌ 强制清除 localStorage
4. ❌ 重置为 { dailyCount: 0, monthlyCount: 0 }
5. ❌ 显示 "0/2 today, 0/4 this month"（错误）
```

**修改后**:
```
1. localStorage 中有 { dailyCount: 1, monthlyCount: 1 }
2. 刷新页面，useEffect 触发
3. ✅ getUsageData() 读取 localStorage
4. ✅ 返回 { dailyCount: 1, monthlyCount: 1 }
5. ✅ 显示 "1/2 today, 1/4 this month"（正确）
```

**结论**: ✅ **改进**，修复了刷新后数据丢失的 bug

---

### 场景 4: 未登录用户跨天/跨月访问 ✅

**修改前**:
```
1. localStorage 中有昨天的数据：{ dailyCount: 2, date: "2025-10-29" }
2. 今天打开页面（2025-10-30）
3. 强制清除 localStorage
4. 设置为 { dailyCount: 0, date: "2025-10-30" }
```

**修改后**:
```
1. localStorage 中有昨天的数据：{ dailyCount: 2, date: "2025-10-29" }
2. 今天打开页面（2025-10-30）
3. getUsageData() 检测日期不同
4. ✅ 自动重置 dailyCount = 0
5. 返回 { dailyCount: 0, date: "2025-10-30", monthlyCount: 2 }
```

**结论**: ✅ **无影响**，`getUsageData()` 内置日期重置逻辑

**关键代码** (`getUsageData` 函数 103-140 行):
```typescript
const data: UsageData = JSON.parse(stored)
const today = getTodayDate()
const thisMonth = getCurrentMonth()

const needsDailyReset = data.date !== today
const needsMonthlyReset = data.month !== thisMonth

return {
  dailyCount: needsDailyReset ? 0 : data.dailyCount,  // ✅ 自动重置
  date: today,
  monthlyCount: needsMonthlyReset ? 0 : data.monthlyCount,  // ✅ 自动重置
  month: thisMonth,
}
```

---

### 场景 5: 登出操作 ✅

**修改前**:
```
1. 用户点击登出
2. Logout detection useEffect (367-404行) 触发
   ├─ 清除 localStorage ✅
   ├─ 重置所有状态 ✅
   └─ globalPrevAuth = null ✅
3. Data initialization useEffect 触发
   ├─ 检测到 !isAuthenticated
   ├─ 再次清除 localStorage（已经清空）
   └─ 设置为 { dailyCount: 0, monthlyCount: 0 }
4. 显示 "0/2 today, 0/4 this month"
```

**修改后**:
```
1. 用户点击登出
2. Logout detection useEffect (367-404行) 触发
   ├─ 清除 localStorage ✅
   ├─ 重置所有状态 ✅
   └─ globalPrevAuth = null ✅
3. Data initialization useEffect 触发
   ├─ 检测到 !isAuthenticated
   ├─ getUsageData() 读取 localStorage（已清空）
   └─ 返回 { dailyCount: 0, monthlyCount: 0 }
4. 显示 "0/2 today, 0/4 this month"
```

**结论**: ✅ **无影响**，最终结果完全一致

---

### 场景 6: 已登录用户 ✅

**修改前**:
```
useEffect(() => {
  if (!isAuthenticated) {
    // ...
  } else {
    // ✅ 已登录用户走这里
    const data = getUsageData()
    setUsageData(data)
  }
}, [isAuthenticated])
```

**修改后**:
```
useEffect(() => {
  if (!isAuthenticated) {
    // ...
  } else {
    // ✅ 已登录用户走这里（完全相同）
    const data = getUsageData()
    setUsageData(data)
  }
}, [isAuthenticated, getTodayDate, getCurrentMonth, getUsageData, updateLimitStatus])
```

**结论**: ✅ **无影响**，已登录用户的逻辑完全不变

---

### 场景 7: 登录操作（未登录 → 已登录）✅

**修改前**:
```
1. 未登录状态，localStorage 有数据
2. 用户登录成功
3. Data initialization useEffect 触发
   ├─ isAuthenticated = true
   ├─ 走 else 分支
   └─ 从 localStorage 读取数据
4. Init useEffect 触发 (352-364行)
   ├─ 调用 fetchUserInfo()
   └─ 从数据库同步真实数据
```

**修改后**:
```
1. 未登录状态，localStorage 有数据
2. 用户登录成功
3. Data initialization useEffect 触发
   ├─ isAuthenticated = true
   ├─ 走 else 分支
   └─ 从 localStorage 读取数据（相同）
4. Init useEffect 触发 (352-364行)
   ├─ 调用 fetchUserInfo()
   └─ 从数据库同步真实数据（相同）
```

**结论**: ✅ **无影响**，登录后都会从数据库同步真实数据

---

### 场景 8: 未登录用户删除 localStorage 后被限制（核心修复）✅

**修改前**:
```
1. 用户手动删除 localStorage
2. 刷新页面，显示 "0/2 today, 0/4 this month"
3. 提交梦境（第 3 次）
4. 后端返回 429 错误 + currentUsage: { daily: 2, monthly: 4 }
5. 前端调用 syncFromResponse，保存到 localStorage ✅
6. ❌ useEffect 触发，强制清除 localStorage
7. ❌ 显示 "0/2 today, 0/4 this month"（错误）
```

**修改后**:
```
1. 用户手动删除 localStorage
2. 刷新页面，显示 "0/2 today, 0/4 this month"
3. 提交梦境（第 3 次）
4. 后端返回 429 错误 + currentUsage: { daily: 2, monthly: 4 }
5. 前端调用 syncFromResponse，保存到 localStorage ✅
6. ✅ useEffect 触发，从 localStorage 读取
7. ✅ 显示 "2/2 today, 4/4 this month"（正确）
```

**结论**: ✅ **改进**，修复了核心 bug

---

## 📋 改动检查清单

| 检查项 | 修改前 | 修改后 | 影响 |
|-------|--------|--------|------|
| **未登录用户首次访问** | 0/2, 0/4 | 0/2, 0/4 | ✅ 无影响 |
| **未登录用户正常使用** | ❌ 显示 0/2 | ✅ 显示真实数据 | ✅ 改进 |
| **未登录用户刷新页面** | ❌ 数据丢失 | ✅ 数据保留 | ✅ 改进 |
| **未登录用户跨天访问** | 自动重置 | 自动重置 | ✅ 无影响 |
| **未登录用户跨月访问** | 自动重置 | 自动重置 | ✅ 无影响 |
| **登出操作** | localStorage 清空 | localStorage 清空 | ✅ 无影响 |
| **登录操作** | 从数据库同步 | 从数据库同步 | ✅ 无影响 |
| **已登录用户** | 正常 | 正常 | ✅ 无影响 |
| **已登录用户刷新** | 正常 | 正常 | ✅ 无影响 |
| **删除 localStorage 后被限制** | ❌ 数据不同步 | ✅ 数据同步 | ✅ 修复核心 bug |

---

## 🔑 关键保护机制

### 1. `getUsageData()` 自动重置逻辑

**文件**: `contexts/usage-limit-context.tsx` 103-140 行

```typescript
const getUsageData = useCallback((): UsageData => {
  // ...
  const data: UsageData = JSON.parse(stored)
  const today = getTodayDate()
  const thisMonth = getCurrentMonth()
  
  // ✅ 自动检测日期变化，重置计数
  const needsDailyReset = data.date !== today
  const needsMonthlyReset = data.month !== thisMonth
  
  return {
    dailyCount: needsDailyReset ? 0 : data.dailyCount,
    date: today,
    monthlyCount: needsMonthlyReset ? 0 : data.monthlyCount,
    month: thisMonth,
  }
}, [getTodayDate, getCurrentMonth])
```

**保护作用**: 即使不清除 localStorage，跨天/跨月访问也会自动重置计数

---

### 2. 登出检测清除机制

**文件**: `contexts/usage-limit-context.tsx` 367-404 行

```typescript
useEffect(() => {
  const prevAuth = globalPrevAuth
  
  // ✅ 检测从登录变为未登录
  if (prevAuth && !isAuthenticated) {
    // 清除 localStorage
    localStorage.removeItem(TIER_STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    
    // 重置所有状态
    setSubscription(null)
    setUsageData(null)
    setIsLimitReached(false)
    setSubscriptionLoading(false)
    setInitialized(false)
    
    globalPrevAuth = null
  } else {
    globalPrevAuth = isAuthenticated
  }
}, [isAuthenticated])
```

**保护作用**: 登出时仍然会清除 localStorage，确保不会残留上一个用户的数据

---

### 3. 后端 IP 限流机制

**文件**: `lib/services/usage-service.ts` 38-140 行

```typescript
export async function validateAnonymousUsage(ip: string) {
  // ✅ 查询数据库中的真实使用记录
  const { data: dailyUsage } = await supabase
    .from("anonymous_usage")
    .select("count")
    .eq("ip_address", ip)
    .eq("date", currentDay)
  
  // ✅ 即使前端数据被删除，后端仍然会检查数据库
  if (dailyTotal >= limits.daily) {
    return {
      allowed: false,
      error: {
        message: "Daily limit reached",
        details: {
          currentUsage: { daily: dailyTotal, monthly: monthlyTotal }  // ✅ 返回真实数据
        }
      }
    }
  }
}
```

**保护作用**: 前端 localStorage 被删除后，后端仍然会正确限制并返回真实使用数据

---

## ✅ 总结

### 改动影响

| 类型 | 场景数 | 无影响 | 改进 | 破坏 |
|------|--------|--------|------|------|
| **未登录用户** | 5 | 2 | 3 | 0 |
| **已登录用户** | 3 | 3 | 0 | 0 |
| **状态转换** | 2 | 2 | 0 | 0 |
| **总计** | 10 | 7 | 3 | 0 |

### 风险评估

- **破坏性风险**: 🟢 **无**
- **功能退化**: 🟢 **无**
- **性能影响**: 🟢 **无**
- **安全风险**: 🟢 **无**

### 改进效果

1. ✅ 修复了未登录用户 localStorage 被清除的 bug
2. ✅ 修复了刷新页面数据丢失的问题
3. ✅ 修复了删除 localStorage 后无法同步后端数据的问题
4. ✅ 保留了所有现有功能（登出清除、自动重置等）

### 最终结论

✅ **改动安全，建议部署**

- 没有破坏任何现有功能
- 修复了 3 个已知 bug
- 代码逻辑更清晰（不再重复清除 localStorage）
- 保留了所有保护机制（日期重置、登出清除、后端验证）

