# ⚠️ API 调用优化分析

## 📊 问题现状

### 登录后的 API 调用日志

```
GET /api/subscription/manage 200 in 732ms   ← 第 1 次
GET /api/usage              200 in 1301ms  ← 第 1 次
GET /                       200 in 164ms
GET /api/subscription/manage 200 in 600ms   ← 第 2 次 ❌ 重复
GET /api/usage              200 in 892ms   ← 第 2 次 ❌ 重复
GET /api/usage              200 in 892ms   ← 第 3 次 ❌ 重复
GET /api/usage              200 in 892ms   ← 第 4 次 ❌ 重复
GET /api/usage              200 in 900ms   ← 第 5 次 ❌ 重复
```

**问题**：
- `/api/subscription/manage` 被调用 **2 次**
- `/api/usage` 被调用 **5 次** 🚨

---

## 🔍 接口功能分析

### 1. `/api/subscription/manage` - 订阅管理

**功能**：
- 获取用户订阅层级（free/basic/pro）
- 查询 `user_subscriptions` 表
- 返回订阅状态和过期时间

**调用位置**：
1. `hooks/use-usage-limit-v2.ts` - `fetchUserSubscription()`
2. `app/dashboard/page.tsx` - Dashboard 页面
3. `app/pricing/success/page.tsx` - 支付成功页面

**响应时间**：600-732ms

---

### 2. `/api/usage` - 使用次数查询

**功能**：
- 获取用户使用次数（日/月）
- 查询 `usage_tracking` 表
- 查询 `user_subscriptions` 表（获取 tier）
- 返回剩余次数

**调用位置**：
1. `hooks/use-usage-limit-v2.ts` - `syncUsageFromDatabase()`

**响应时间**：892-1301ms

---

## 🚨 重复调用原因分析

### `/api/usage` 被调用 5 次的原因

#### 1. useEffect 依赖问题

```typescript
// hooks/use-usage-limit-v2.ts
useEffect(() => {
  if (isAuthenticated && user) {
    fetchUserSubscription()
    syncUsageFromDatabase()  // ← 每次 isAuthenticated 或 user 变化都会调用
  } else {
    setSubscription(null)
  }
}, [isAuthenticated, user])  // ❌ 依赖项变化导致重复执行
```

**问题**：
- `isAuthenticated` 和 `user` 在登录过程中可能多次变化
- 每次变化都会触发接口调用

#### 2. 组件重新渲染

```typescript
// app/page.tsx 使用了 useUsageLimitV2
const { 
  canUse, 
  incrementUsage, 
  // ...
} = useUsageLimitV2()  // ← 组件每次渲染都会执行 hook
```

**可能的重渲染原因**：
- 父组件状态变化
- 路由变化
- 认证状态更新

---

## 💡 优化方案

### 方案 1：添加请求缓存（推荐 ⭐⭐⭐）

**目标**：避免短时间内重复请求同一接口

#### 实施步骤

**创建缓存 Hook**：

```typescript
// hooks/use-request-cache.ts
import { useRef } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export function useRequestCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5000  // 默认 5 秒缓存
) {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  
  const getCachedOrFetch = async (): Promise<T> => {
    const now = Date.now()
    const cached = cacheRef.current.get(key)
    
    // 检查缓存是否有效
    if (cached && (now - cached.timestamp) < ttl) {
      console.log(`[Cache] Using cached ${key}`)
      return cached.data
    }
    
    // 缓存失效或不存在，重新请求
    console.log(`[Cache] Fetching fresh ${key}`)
    const data = await fetchFn()
    
    cacheRef.current.set(key, {
      data,
      timestamp: now
    })
    
    return data
  }
  
  return { getCachedOrFetch }
}
```

**修改 useUsageLimitV2**：

```typescript
// hooks/use-usage-limit-v2.ts
import { useRequestCache } from "./use-request-cache"

export function useUsageLimitV2() {
  // ... 现有代码
  
  // ✅ 添加缓存
  const subscriptionCache = useRequestCache(
    "user-subscription",
    async () => {
      const response = await fetch("/api/subscription/manage")
      return response.json()
    },
    10000  // 10 秒缓存
  )
  
  const usageCache = useRequestCache(
    "user-usage",
    async () => {
      const response = await fetch("/api/usage")
      return response.json()
    },
    5000  // 5 秒缓存
  )
  
  // 修改 fetchUserSubscription
  const fetchUserSubscription = async () => {
    if (subscriptionLoading) return
    
    setSubscriptionLoading(true)
    try {
      const result = await subscriptionCache.getCachedOrFetch()
      // ... 处理结果
    } finally {
      setSubscriptionLoading(false)
    }
  }
  
  // 修改 syncUsageFromDatabase
  const syncUsageFromDatabase = async () => {
    try {
      const result = await usageCache.getCachedOrFetch()
      // ... 处理结果
    } catch (error) {
      // ...
    }
  }
  
  // ... 其他代码
}
```

**效果**：
- ✅ 10 秒内重复调用 `/api/subscription/manage` → 使用缓存
- ✅ 5 秒内重复调用 `/api/usage` → 使用缓存
- ✅ 大幅减少数据库查询
- ✅ 提升响应速度

---

### 方案 2：优化 useEffect 依赖（推荐 ⭐⭐）

**目标**：避免不必要的重新执行

```typescript
// hooks/use-usage-limit-v2.ts
export function useUsageLimitV2() {
  const { isAuthenticated, user } = useAuth()
  const [initialized, setInitialized] = useState(false)  // ✅ 添加初始化标志
  
  // ✅ 只在首次认证成功时执行一次
  useEffect(() => {
    if (isAuthenticated && user && !initialized) {
      fetchUserSubscription()
      syncUsageFromDatabase()
      setInitialized(true)  // 标记为已初始化
    } else if (!isAuthenticated) {
      setSubscription(null)
      setInitialized(false)  // 登出时重置
    }
  }, [isAuthenticated, user, initialized])
  
  // ... 其他代码
}
```

**效果**：
- ✅ 登录后只执行一次初始化
- ✅ 避免认证状态变化导致的重复调用
- ⚠️ 需要手动刷新数据（通过 `refreshSubscription` 等方法）

---

### 方案 3：合并接口（推荐 ⭐）

**目标**：减少请求数量，一次获取所有需要的数据

#### 创建合并接口

```typescript
// app/api/user-info/route.ts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return errorResponse("Unauthorized", 401)
  }
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  // 并行查询订阅和使用情况
  const [subscriptionData, usageData] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("usage_tracking")
      .select("daily_count, monthly_count, day")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single()
  ])
  
  // 处理数据并返回
  return successResponse({
    subscription: { ... },
    usage: { ... },
    limits: { ... }
  })
}
```

**效果**：
- ✅ 2 次请求 → 1 次请求
- ✅ 减少 50% 的网络往返
- ✅ 数据一致性更好

---

### 方案 4：添加防抖处理（推荐 ⭐⭐）

**目标**：防止快速连续调用

```typescript
// hooks/use-debounce.ts
import { useRef, useCallback } from "react"

export function useDebouncedFetch<T>(
  fetchFn: () => Promise<T>,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const pendingRef = useRef<Promise<T> | null>(null)
  
  const debouncedFetch = useCallback(async (): Promise<T> => {
    // 如果有正在进行的请求，返回它
    if (pendingRef.current) {
      console.log("[Debounce] Reusing pending request")
      return pendingRef.current
    }
    
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // 创建新的请求
    const promise = new Promise<T>((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchFn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          pendingRef.current = null
        }
      }, delay)
    })
    
    pendingRef.current = promise
    return promise
  }, [fetchFn, delay])
  
  return debouncedFetch
}
```

---

## 📊 优化效果对比

### 优化前（当前状态）

```
登录后 API 调用：
- /api/subscription/manage: 2 次
- /api/usage: 5 次
- 总请求数: 7 次
- 总耗时: ~5000ms
```

### 优化后（方案 1 + 方案 2）

```
登录后 API 调用：
- /api/subscription/manage: 1 次（缓存）
- /api/usage: 1 次（缓存）
- 总请求数: 2 次 ✅ 减少 71%
- 总耗时: ~1500ms ✅ 减少 70%
```

### 优化后（方案 3）

```
登录后 API 调用：
- /api/user-info: 1 次（合并）
- 总请求数: 1 次 ✅ 减少 86%
- 总耗时: ~800ms ✅ 减少 84%
```

---

## 🎯 推荐实施顺序

### 阶段 1：快速优化（立即实施）

1. ✅ **添加初始化标志**（方案 2）
   - 修改难度：低
   - 效果：中等
   - 时间：10 分钟

2. ✅ **添加 loading 防护**
   - 避免重复点击/快速切换导致的重复请求
   - 修改难度：低
   - 效果：中等
   - 时间：5 分钟

### 阶段 2：中期优化（本周实施）

3. ✅ **添加请求缓存**（方案 1）
   - 修改难度：中等
   - 效果：高
   - 时间：30 分钟

4. ✅ **添加防抖处理**（方案 4）
   - 修改难度：中等
   - 效果：中等
   - 时间：20 分钟

### 阶段 3：长期优化（下周考虑）

5. ✅ **合并接口**（方案 3）
   - 修改难度：高
   - 效果：最高
   - 时间：1 小时
   - 注意：需要修改前端多处调用

---

## 🔧 立即可用的快速修复

### 快速修复：添加初始化标志

```typescript
// hooks/use-usage-limit-v2.ts
export function useUsageLimitV2() {
  const { isAuthenticated, user } = useAuth()
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)  // ✅ 新增

  // ✅ 只在首次认证成功时执行
  useEffect(() => {
    if (isAuthenticated && user && !initialized) {
      console.log("[Usage Limit V2] 🔄 Initializing user data...")
      fetchUserSubscription()
      syncUsageFromDatabase()
      setInitialized(true)
    } else if (!isAuthenticated) {
      setSubscription(null)
      setInitialized(false)
    }
  }, [isAuthenticated, user, initialized])

  // ... 其他代码保持不变
}
```

**效果**：
- ✅ 立即减少 60-70% 的重复请求
- ✅ 无破坏性变更
- ✅ 5 分钟完成

---

## 📝 监控建议

### 添加性能监控

```typescript
// 在每个接口中添加
console.time(`[API] ${routeName}`)
// ... 业务逻辑
console.timeEnd(`[API] ${routeName}`)

// 在 Hook 中添加
console.log(`[Usage Limit V2] API calls count: ${apiCallsCount}`)
```

### 添加调用统计

```typescript
// 创建一个简单的统计 Hook
const apiCallsRef = useRef({
  subscription: 0,
  usage: 0
})

const trackApiCall = (type: 'subscription' | 'usage') => {
  apiCallsRef.current[type]++
  console.log(`[API Stats] ${type}: ${apiCallsRef.current[type]} calls`)
}
```

---

## ✅ 总结

### 当前问题

- ❌ `/api/subscription/manage` 重复调用 2 次
- ❌ `/api/usage` 重复调用 5 次
- ❌ 总耗时 ~5000ms
- ❌ 用户体验：登录后略有延迟

### 优化后

- ✅ 每个接口只调用 1 次
- ✅ 总耗时 ~1500ms（减少 70%）
- ✅ 用户体验：登录流畅

### 建议

**立即实施**：
1. 添加初始化标志（方案 2）
2. 添加请求缓存（方案 1）

**长期考虑**：
3. 合并接口（方案 3）

---

**创建时间**：2025-10-30  
**优先级**：P1（高优先级）  
**预计收益**：减少 70% API 调用，提升 70% 加载速度

