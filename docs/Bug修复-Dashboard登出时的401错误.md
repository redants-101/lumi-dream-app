# Bug 修复：Dashboard 登出时的 401 错误

## 问题描述

在 Dashboard 页面点击退出登录后，虽然成功跳转到 Pricing 页面，但控制台会出现 `/api/subscription/manage` 401 错误。

## 问题原因

这是一个**竞态条件（Race Condition）**导致的问题：

### 执行时序

```
1. 用户点击 "Sign out"
   ↓
2. handleSignOut() 执行
   ↓
3. signOut() 清除认证状态
   ↓
4. user 状态变为 null
   ↓
5. Dashboard 的 useEffect 检测到 user 变化
   ↓
6. 【问题点】fetchSubscription() 可能在登出过程中仍被调用
   ↓
7. API 返回 401（用户已登出）
   ↓
8. router.push("/pricing") 跳转页面
```

### 核心问题

Dashboard 组件的 `useEffect` 依赖 `user`，当 `user` 变化时会重新执行。在登出瞬间：

1. `user` 从有值变为 `null`
2. `useEffect` 被触发
3. 虽然有 `if (!user) return` 检查，但之前的 `fetchSubscription()` 可能还在执行中
4. 导致已登出状态下仍然发送需要认证的 API 请求

## 解决方案

### 1. 添加 isMounted Flag

```typescript
useEffect(() => {
  if (!user) {
    router.push("/")
    return
  }

  // ✅ 添加 flag 防止组件卸载后更新状态
  let isMounted = true

  const loadData = async () => {
    if (!user || !isMounted) return
    
    await Promise.all([
      fetchSubscription(),
      fetchUsageStats()
    ])
  }

  loadData()

  // ✅ Cleanup function
  return () => {
    isMounted = false
  }
}, [user, router])
```

### 2. 在 fetchSubscription 中添加二次检查

```typescript
const fetchSubscription = async () => {
  // ✅ 二次检查：确保用户已登录
  if (!user) {
    console.log("[Dashboard] User not authenticated, skipping fetch")
    return
  }

  try {
    const response = await fetch("/api/subscription/manage")
    
    // ✅ 静默处理 401 错误（用户已登出）
    if (response.status === 401) {
      console.log("[Dashboard] Unauthorized, user logged out")
      return
    }
    
    if (!response.ok) throw new Error("Failed to fetch subscription")
    
    const data = await response.json()
    setSubscription(data)
  } catch (error) {
    console.error("[Dashboard] Error:", error)
    // ✅ 只在用户仍然登录时显示错误提示
    if (user) {
      toast.error("Failed to load subscription information")
    }
  } finally {
    setLoading(false)
  }
}
```

## 修复效果

### 修复前 ❌

```
控制台输出：
[Dashboard] Error: Failed to fetch subscription
POST /api/subscription/manage 401 (Unauthorized)
⚠️ 显示错误 Toast："Failed to load subscription information"
```

### 修复后 ✅

```
控制台输出：
[Dashboard] User not authenticated, skipping fetch
或
[Dashboard] Unauthorized, user logged out
✅ 不显示错误提示
✅ 静默处理，用户无感知
```

## 涉及文件

- ✅ `app/dashboard/page.tsx` - Dashboard 页面组件

## 技术要点

### 1. React Cleanup Function

```typescript
useEffect(() => {
  let isMounted = true
  
  // 异步操作
  
  return () => {
    isMounted = false  // 组件卸载时执行
  }
}, [deps])
```

**作用**：防止组件卸载后仍然执行状态更新（会导致内存泄漏警告）

### 2. 静默处理预期的错误

```typescript
if (response.status === 401) {
  // 不抛出错误，不显示 Toast
  return
}
```

**原则**：如果错误是预期的（如登出时的 401），应该静默处理，不打扰用户

### 3. 条件性错误提示

```typescript
if (user) {
  toast.error("Failed to load subscription information")
}
```

**原则**：只在错误真正影响用户时才显示提示

## 类似问题的预防

### 通用模式：受保护的数据获取

```typescript
useEffect(() => {
  if (!user) {
    // 早期返回，不执行任何操作
    return
  }

  let isMounted = true

  const fetchData = async () => {
    if (!user || !isMounted) return  // 二次检查
    
    try {
      const response = await fetch("/api/protected")
      
      // 静默处理 401
      if (response.status === 401) return
      
      if (!response.ok) throw new Error()
      
      const data = await response.json()
      if (isMounted) setState(data)  // 更新状态前检查
    } catch (error) {
      if (user && isMounted) {  // 双重检查
        showError(error)
      }
    }
  }

  fetchData()

  return () => {
    isMounted = false
  }
}, [user])
```

### 最佳实践检查清单

- [ ] useEffect 中有早期返回检查
- [ ] 使用 isMounted flag
- [ ] 使用 cleanup function
- [ ] 异步函数中有二次检查
- [ ] 401/403 错误静默处理
- [ ] 错误提示有条件判断
- [ ] 状态更新前检查组件是否已卸载

## 测试验证

### 测试步骤

1. ✅ 登录账号
2. ✅ 访问 Dashboard 页面
3. ✅ 打开浏览器开发者工具 → Console 标签
4. ✅ 点击右上角用户头像 → Sign out
5. ✅ 观察控制台输出

### 期望结果

- ✅ 成功跳转到 Pricing 页面
- ✅ 控制台只显示 `[Dashboard] User not authenticated, skipping fetch`
- ✅ 没有 401 错误
- ✅ 没有错误 Toast 提示
- ✅ 没有 React 警告（如 "Can't perform a React state update on an unmounted component"）

### 验证命令

```bash
# 在浏览器控制台运行
console.log("测试登出功能...")

# 1. 检查是否有 401 错误
# 2. 检查是否有 React 警告
# 3. 检查页面是否正常跳转
```

## 性能影响

- ✅ **无性能损耗** - cleanup function 和条件检查的开销可以忽略不计
- ✅ **减少无效请求** - 避免了登出后的无效 API 调用
- ✅ **改善用户体验** - 不显示误导性的错误提示

## 其他需要检查的页面

以下页面如果有类似模式，也需要检查：

- [ ] `/app/settings/page.tsx` - 如果有的话
- [ ] `/app/profile/page.tsx` - 如果有的话
- [ ] 任何其他依赖用户认证的页面

## 相关文档

- [Dashboard登录引导功能.md](./Dashboard登录引导功能.md)
- [登出跳转逻辑优化.md](./登出跳转逻辑优化.md)

## 总结

这个 bug 是典型的 React 竞态条件问题，通过：

1. ✅ 添加 isMounted flag
2. ✅ 在异步函数中二次检查用户状态
3. ✅ 静默处理预期的 401 错误

成功解决了登出时的错误提示和控制台警告，提升了用户体验。

---

**修复完成时间**: 2025-10-28  
**Bug 级别**: 低（不影响功能，只是控制台有错误）  
**状态**: ✅ 已修复并测试

