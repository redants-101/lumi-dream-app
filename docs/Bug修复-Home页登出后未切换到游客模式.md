# Bug 修复：Home 页登出后未切换到游客模式

## 问题描述

在 Home 页面登录账号后点击退出登录，页面刷新后仍然显示登录状态，没有切换到游客模式。

## 问题原因

这是由两个因素共同导致的：

### 1. sessionStorage 缓存未清除

**问题代码** (`hooks/use-auth.ts`):
```typescript
const signOut = async () => {
  await fetch("/api/auth/logout", { method: "POST" })
  setUser(null)  // ❌ 只清除了内存状态，没有清除缓存
}
```

`useAuth` hook 使用 sessionStorage 缓存用户状态以优化性能：

```typescript
const [user, setUser] = useState<User | null>(() => {
  // 从缓存加载初始状态
  const cached = sessionStorage.getItem(AUTH_CACHE_KEY)
  if (cached) {
    const { user: cachedUser, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) {
      return cachedUser  // ❌ 登出后仍然从缓存恢复
    }
  }
  return null
})
```

**流程分析**：
1. 用户登出时，`setUser(null)` 清除了内存中的状态
2. 但 sessionStorage 中仍保存着用户数据
3. 页面刷新后，`useState` 初始化时从缓存恢复用户状态
4. 导致用户看起来仍然是登录状态

### 2. router.refresh() 对客户端组件无效

**问题代码** (`components/user-button.tsx`):
```typescript
if (pathname === "/") {
  router.refresh()  // ❌ 对客户端组件效果有限
}
```

Home 页面 (`app/page.tsx`) 是客户端组件（`"use client"`），它的状态管理完全在客户端：

```typescript
"use client"

export default function Home() {
  const { isAuthenticated, user } = useAuth()  // 客户端 hook
  // ...
}
```

**问题**：
- `router.refresh()` 主要用于刷新服务端组件
- 对于客户端组件，它不会完全重置客户端状态
- 需要强制整页刷新来确保客户端状态完全重置

## 解决方案

### 修复 1: 在 signOut 中清除缓存

**文件**: `hooks/use-auth.ts`

```typescript
const signOut = async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    })
    
    // 清除用户状态
    setUser(null)
    
    // ✅ 清除 sessionStorage 缓存
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(AUTH_CACHE_KEY)
        console.log("[Auth] Cache cleared on sign out")
      } catch (error) {
        console.error("[Auth Cache Clear Error]:", error)
      }
    }
  } catch (error) {
    console.error("[Sign Out Error]:", error)
    throw error
  }
}
```

### 修复 2: 使用 window.location.reload() 强制刷新

**文件**: `components/user-button.tsx`

```typescript
const handleSignOut = async () => {
  await signOut()
  
  if (pathname.startsWith("/dashboard")) {
    // Dashboard 页面 → 跳转到 Pricing 页
    router.push("/pricing")
  } else if (pathname === "/" || pathname.startsWith("/pricing")) {
    // Home 页或 Pricing 页 → 强制整页刷新（确保客户端状态重置）
    window.location.reload()  // ✅ 强制整页刷新
  } else {
    // 其他页面 → 刷新服务端组件
    router.refresh()
  }
}
```

## 修复效果

### 修复前 ❌

```
用户操作：
1. 在 Home 页登录
2. 点击退出登录
3. 页面刷新

结果：
❌ 仍然显示登录状态
❌ 导航栏显示用户头像
❌ 页面显示已登录用户的使用限制
```

### 修复后 ✅

```
用户操作：
1. 在 Home 页登录
2. 点击退出登录
3. 页面强制刷新

结果：
✅ 切换到游客模式
✅ 导航栏显示 "Sign In" 按钮
✅ 页面显示未登录用户的使用限制
✅ sessionStorage 缓存被清除
```

## 涉及文件

- ✅ `hooks/use-auth.ts` - 清除 sessionStorage 缓存
- ✅ `components/user-button.tsx` - 使用强制刷新

## 技术要点

### 1. sessionStorage 缓存管理

**原则**：
- ✅ 读取时检查缓存有效期
- ✅ 写入时保存时间戳
- ✅ 登出时清除缓存

**完整流程**：
```typescript
// 读取缓存
const cached = sessionStorage.getItem(AUTH_CACHE_KEY)
if (cached && Date.now() - timestamp < CACHE_DURATION) {
  return cachedUser
}

// 保存缓存
sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
  user: userData,
  timestamp: Date.now()
}))

// 清除缓存
sessionStorage.removeItem(AUTH_CACHE_KEY)
```

### 2. 客户端组件 vs 服务端组件的刷新策略

| 组件类型 | 刷新方法 | 说明 |
|---------|---------|-----|
| 服务端组件 | `router.refresh()` | 只刷新服务端数据，不重载客户端代码 |
| 客户端组件 | `window.location.reload()` | 强制整页刷新，重置所有客户端状态 |
| 混合页面 | 根据需要选择 | 如果有重要的客户端状态，使用 reload |

### 3. window.location.reload() 的考虑

**优点**：
- ✅ 完全重置客户端状态
- ✅ 清除所有内存中的数据
- ✅ 确保 UI 与后端状态一致

**缺点**：
- ⚠️ 稍慢（需要重新加载资源）
- ⚠️ 失去 SPA 的流畅性

**权衡**：
- 对于登出这种低频操作，完全重置状态比保持流畅性更重要
- 用户期望登出后看到全新的未登录状态

## 测试验证

### 测试步骤

1. ✅ 访问 Home 页面（未登录状态）
2. ✅ 点击 "Sign In" 登录
3. ✅ 登录成功后，验证：
   - 导航栏显示用户头像
   - 页面显示已登录用户的使用限制
4. ✅ 点击用户头像 → "Sign out"
5. ✅ 页面刷新后，验证：
   - 导航栏显示 "Sign In" 按钮
   - 页面显示游客模式的使用限制
   - sessionStorage 中无缓存数据

### 验证命令

在浏览器控制台运行：

```javascript
// 检查 sessionStorage 是否被清除
console.log("Auth Cache:", sessionStorage.getItem("lumi_auth_cache"))
// 应该返回 null

// 检查用户状态
console.log("User authenticated:", document.querySelector("[data-testid=user-button]") !== null)
// 登出后应该返回 false
```

### 自动化测试

```typescript
// E2E 测试示例
test("logout on home page clears user state", async ({ page }) => {
  // 登录
  await login(page)
  await page.goto("/")
  
  // 验证登录状态
  await expect(page.locator("[data-testid=user-avatar]")).toBeVisible()
  
  // 登出
  await page.click("[data-testid=user-avatar]")
  await page.click("[data-testid=sign-out]")
  
  // 等待页面刷新
  await page.waitForLoadState("networkidle")
  
  // 验证游客状态
  await expect(page.locator("[data-testid=sign-in-button]")).toBeVisible()
  await expect(page.locator("[data-testid=user-avatar]")).not.toBeVisible()
  
  // 验证缓存被清除
  const cache = await page.evaluate(() => 
    sessionStorage.getItem("lumi_auth_cache")
  )
  expect(cache).toBeNull()
})
```

## 边界情况

### 1. 多标签页同步

**问题**：用户在多个标签页打开 Home 页，在一个标签页登出

**当前行为**：
- 登出的标签页正确刷新
- 其他标签页仍显示登录状态（因为没有跨标签通信）

**未来改进**：
```typescript
// 监听 storage 事件实现跨标签同步
window.addEventListener("storage", (e) => {
  if (e.key === AUTH_CACHE_KEY && e.newValue === null) {
    // 其他标签页检测到登出，自动刷新
    window.location.reload()
  }
})
```

### 2. 网络错误时的登出

**场景**：登出 API 调用失败

**当前行为**：
- 抛出错误，不执行后续操作
- 用户状态未清除

**建议改进**：
```typescript
const signOut = async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch (error) {
    console.error("[Sign Out Error]:", error)
    // ⚠️ 即使 API 失败，也要清除本地状态
  } finally {
    setUser(null)
    sessionStorage.removeItem(AUTH_CACHE_KEY)
  }
}
```

### 3. 登出后立即登录

**场景**：用户登出后立即点击登录

**当前行为**：
- 页面开始刷新
- 用户可能看不到登录按钮（因为页面正在重载）

**体验优化**：
- 可以延迟刷新，先显示 loading 状态
- 或者提示用户"正在登出..."

## 性能影响

### 刷新方式对比

| 方式 | 时间 | 网络请求 | 用户体验 |
|-----|------|---------|---------|
| `router.refresh()` | ~100ms | 只请求数据 | ⭐⭐⭐⭐⭐ 流畅 |
| `window.location.reload()` | ~500ms | 重新加载所有资源 | ⭐⭐⭐ 可接受 |
| 手动重定向 | ~300ms | 跳转到新页面 | ⭐⭐⭐⭐ 较好 |

**评估**：
- Home 页加载时间约 500ms（包含图片、样式等）
- 登出是低频操作（用户可能几小时才登出一次）
- **结论**：性能影响可以接受

## 相关问题

### 类似的缓存清除场景

以下场景也需要清除缓存：

1. **账号切换**
   - 清除旧用户的缓存
   - 加载新用户的数据

2. **会话过期**
   - 检测到 401 错误
   - 自动清除缓存并跳转登录

3. **隐私模式退出**
   - 用户关闭浏览器时
   - sessionStorage 自动清除

## 未来优化方向

### 1. 使用 React Context + Provider 模式

```typescript
// AuthProvider.tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  
  const signOut = useCallback(async () => {
    await api.signOut()
    setUser(null)
    sessionStorage.clear()
    // 所有使用 AuthContext 的组件自动更新
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 2. 使用 SWR 或 React Query 管理状态

```typescript
import useSWR, { mutate } from 'swr'

export function useAuth() {
  const { data: user } = useSWR('/api/auth/user', fetcher)
  
  const signOut = async () => {
    await api.signOut()
    mutate('/api/auth/user', null)  // 自动更新所有订阅者
    sessionStorage.clear()
  }
  
  return { user, signOut }
}
```

### 3. 优雅的登出动画

```typescript
const handleSignOut = async () => {
  // 显示登出动画
  setIsSigningOut(true)
  
  await signOut()
  
  // 延迟刷新，让用户看到完整动画
  setTimeout(() => {
    window.location.reload()
  }, 500)
}
```

## 总结

这个 bug 由两个因素导致：

1. **sessionStorage 缓存未清除** - 导致刷新后状态恢复
2. **router.refresh() 对客户端组件无效** - 无法完全重置状态

通过两个修复：

1. ✅ 在 `signOut()` 中清除 sessionStorage
2. ✅ 使用 `window.location.reload()` 强制刷新客户端组件

成功解决了 Home 页登出后未切换到游客模式的问题。

---

**修复完成时间**: 2025-10-28  
**Bug 级别**: 中（影响用户体验）  
**状态**: ✅ 已修复并测试  
**相关 Bug**: Dashboard登出时的401错误

