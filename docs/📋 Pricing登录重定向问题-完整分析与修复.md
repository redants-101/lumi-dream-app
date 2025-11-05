# 📋 Pricing 登录重定向问题 - 完整分析与修复

## 🎯 问题概述

**用户反馈**：在 `/pricing` 页面登录后，GitHub/Google 登录会重定向到首页 `/` 而不是 `/pricing`

## 🔍 深度分析结果

### 发现：系统中存在 3 套独立的登录对话框

| # | 位置 | 文件 | 重定向路径 | 触发场景 | 状态 |
|---|------|------|-----------|---------|------|
| 1 | Navigation 组件 | `components/navigation.tsx:202-234` | `/dashboard` | 点击 Dashboard 链接 | ⚠️ 硬编码 |
| 2 | Pricing 页面 | `app/pricing/page.tsx:301-349` | `/pricing` | 点击订阅按钮 | ✅ 正确 |
| 3 | UserButton 组件 | `components/user-button.tsx:62-100` | `currentPath` | 点击 Sign In 按钮 | ✅ 已修复 |

### 问题分析

#### 1. UserButton 组件（已修复）

**修复前**：
```typescript
// ❌ 没有传递 redirectPath
function SignInDialog({ 
  signInWithGithub, 
  signInWithGoogle 
}: { 
  signInWithGithub: () => void  // ❌ 无参数
  signInWithGoogle: () => void 
}) {
  const handleSignIn = (provider: () => void) => {
    setOpen(false)
    provider()  // ❌ 没有传递路径
  }
}
```

**修复后**：
```typescript
// ✅ 正确传递 currentPath
function SignInDialog({ 
  signInWithGithub, 
  signInWithGoogle,
  currentPath
}: { 
  signInWithGithub: (redirectPath?: string) => void  // ✅ 支持参数
  signInWithGoogle: (redirectPath?: string) => void
  currentPath?: string
}) {
  const handleSignIn = (provider: (redirectPath?: string) => void) => {
    setOpen(false)
    provider(currentPath)  // ✅ 传递当前路径
  }
}
```

**调用方式**：
```typescript
<SignInDialog 
  signInWithGithub={signInWithGithub} 
  signInWithGoogle={signInWithGoogle}
  currentPath={pathname}  // ✅ 传递当前路径
/>
```

#### 2. Navigation 组件（设计如此）

**当前实现**：
```typescript
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setShowLoginDialog(false)
  provider("/dashboard")  // ⚠️ 硬编码，但这是设计意图
}
```

**分析**：
- 这个对话框**仅在点击 Dashboard 链接时触发**
- 登录后跳转到 `/dashboard` 是**符合预期的行为**
- ✅ 无需修改

#### 3. Pricing 页面（已经正确）

**当前实现**：
```typescript
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setShowLoginDialog(false)
  provider("/pricing")  // ✅ 正确传递 /pricing
}
```

**分析**：
- 实现正确，无需修改
- ✅ 已经正确传递 `/pricing`

### 默认行为分析

**回调路由的默认行为**：
```typescript
// app/api/auth/callback/route.ts:12
const next = searchParams.get("next") ?? "/"
```

**关键点**：
- 如果 `next` 参数存在 → 跳转到指定页面 ✅
- 如果 `next` 参数缺失 → **默认跳转到 `/`（首页）** ❌

**可能导致 next 参数丢失的原因**：
1. 前端调用时没有传递 `redirectPath`
2. API 没有正确构建 callback URL
3. OAuth 提供商在回调时丢失了 query 参数
4. Supabase Redirect URLs 配置不正确

## 🔧 已实施的修复

### 修复 1：UserButton 组件传递 currentPath

**修改文件**：
- `components/user-button.tsx`

**修改内容**：
1. 修改 `SignInDialog` 函数签名，添加 `currentPath` 参数
2. 修改登录函数类型，支持 `redirectPath` 参数
3. 在 `handleSignIn` 中传递 `currentPath`
4. 在 `UserButton` 中传递 `pathname`

**影响范围**：
- ✅ 修复了从导航栏 "Sign In" 按钮登录的重定向问题
- ✅ 现在会正确回到当前页面

### 修复 2：添加调试日志

**修改文件**：
- `app/api/auth/login/route.ts`
- `app/api/auth/callback/route.ts`
- `components/user-button.tsx`
- `app/pricing/page.tsx`
- `components/navigation.tsx`

**添加的日志**：
```typescript
// 登录 API
console.log("=== [OAuth Login] ===")
console.log("Provider:", provider)
console.log("Redirect Path:", redirectPath || "(default: /)")
console.log("Callback URL:", callbackUrl)

// 回调 API
console.log("=== [OAuth Callback] ===")
console.log("Full URL:", request.url)
console.log("Next param:", next)
console.log("All params:", Object.fromEntries(searchParams))

// 前端组件
console.log("=== [UserButton SignIn] ===")
console.log("Current Path:", currentPath)
```

**用途**：
- 🔍 帮助追踪登录流程
- 🔍 定位 `next` 参数丢失的环节
- 🔍 确认哪个登录对话框被触发

## 📊 完整的登录流程

### 正常流程（应该发生的）

```
1. 用户在 /pricing 页面
   ↓
2. 点击导航栏 "Sign In" 按钮
   ↓
3. UserButton.SignInDialog 打开
   控制台输出：[UserButton SignIn] Current Path: /pricing
   ↓
4. 用户选择 GitHub 登录
   ↓
5. 调用 signInWithGithub("/pricing")
   ↓
6. POST /api/auth/login
   body: { provider: "github", redirectPath: "/pricing" }
   控制台输出：[OAuth Login] Redirect Path: /pricing
   ↓
7. 构建 callback URL:
   /api/auth/callback?next=%2Fpricing
   ↓
8. Supabase OAuth 跳转
   redirectTo: /api/auth/callback?next=%2Fpricing
   ↓
9. GitHub 授权页面
   ↓
10. GitHub 回调到：
    /api/auth/callback?code=xxx&next=%2Fpricing
    控制台输出：[OAuth Callback] Next param: /pricing
    ↓
11. 解析 next 参数："/pricing"
    ↓
12. 重定向到 /pricing ✅
```

### 异常流程（可能发生的问题）

#### 场景 A：next 参数在回调时丢失

```
...
8. Supabase OAuth 跳转
   redirectTo: /api/auth/callback?next=%2Fpricing
   ↓
9. GitHub 授权
   ↓
10. GitHub 回调到：
    /api/auth/callback?code=xxx
    ❌ next 参数丢失！
    控制台输出：[OAuth Callback] Next param: /
    ↓
11. 使用默认值：next = "/"
    ↓
12. 重定向到 / ❌
```

**原因**：OAuth 提供商或 Supabase 配置问题

#### 场景 B：redirectPath 未传递

```
...
4. 用户选择 GitHub 登录
   ↓
5. 调用 signInWithGithub()  ❌ 没有参数
   ↓
6. POST /api/auth/login
   body: { provider: "github", redirectPath: undefined }
   控制台输出：[OAuth Login] Redirect Path: (default: /)
   ↓
7. 构建 callback URL:
   /api/auth/callback  ❌ 没有 next 参数
   ↓
...
12. 重定向到 / ❌
```

**原因**：前端调用问题（已修复）

## 🧪 测试验证

### 测试清单

请按照 `docs/🧪 Pricing登录重定向问题测试指南.md` 进行测试：

- [ ] **场景 1**：导航栏 Sign In 按钮
  - 在 `/pricing` 页面点击 "Sign In"
  - 预期：登录后回到 `/pricing`

- [ ] **场景 2**：Pricing 订阅按钮
  - 在 `/pricing` 页面点击订阅按钮
  - 预期：登录后回到 `/pricing` 并继续订阅

- [ ] **场景 3**：Dashboard 拦截
  - 在 `/pricing` 页面点击 "Dashboard"
  - 预期：登录后跳转到 `/dashboard`

### 预期日志输出

**场景 1（UserButton）**：
```
=== [UserButton SignIn] ===
Current Path: /pricing
===========================

=== [OAuth Login] ===
Provider: github
Redirect Path: /pricing
Callback URL: http://localhost:3000/api/auth/callback?next=%2Fpricing
====================

=== [OAuth Callback] ===
Full URL: http://localhost:3000/api/auth/callback?code=xxx&next=%2Fpricing
Next param: /pricing
========================
```

## 🔧 如果问题仍然存在

### 可能的额外原因

#### 1. Supabase Redirect URLs 配置

**检查位置**：Supabase Dashboard → Authentication → URL Configuration

**必需配置**：
```
Site URL:
  http://localhost:3000

Redirect URLs:
  http://localhost:3000/api/auth/callback
  http://localhost:3000/api/auth/callback?next=*
  http://localhost:3000/**
```

#### 2. OAuth 提供商配置

**GitHub**：
- Authorization callback URL 应该包含：
  - `http://localhost:3000/api/auth/callback`

**Google**：
- Authorized redirect URIs 应该包含：
  - `http://localhost:3000/api/auth/callback`

#### 3. 环境变量检查

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 备用解决方案：使用 localStorage

如果 URL 参数方案持续失败，可以使用 localStorage 存储重定向路径：

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { provider, redirectPath } = await request.json()
  
  // 在响应中返回一个标识符
  const redirectId = Math.random().toString(36).substring(7)
  
  return successResponse({
    url: data.url,
    redirectId  // 返回给前端
  })
}
```

```typescript
// hooks/use-auth.ts
const signInWithOAuth = async (provider, redirectPath) => {
  // 存储到 localStorage
  if (redirectPath) {
    localStorage.setItem("oauth_redirect", redirectPath)
  }
  
  const response = await fetch("/api/auth/login", ...)
  // ...
}
```

```typescript
// app/api/auth/callback/route.ts
export async function GET(request: Request) {
  // 尝试从多个来源获取重定向路径
  let next = searchParams.get("next")
  
  if (!next || next === "/") {
    // 从 localStorage 恢复（客户端跳转时处理）
    console.log("[Callback] Using localStorage fallback")
  }
  
  // ...
}
```

## 📝 总结

### 已完成的工作

✅ 修复了 UserButton 组件的 redirectPath 传递  
✅ 添加了完整的调试日志  
✅ 分析了三套登录对话框的差异  
✅ 创建了详细的测试指南  
✅ 创建了问题分析文档  

### 待确认的问题

🔍 用户具体从哪个入口登录？  
🔍 控制台日志显示了什么？  
🔍 next 参数是否在回调时存在？  
🔍 Supabase Redirect URLs 配置是否正确？  

### 下一步

1. 用户按照测试指南进行测试
2. 收集完整的日志输出
3. 根据日志定位具体问题环节
4. 应用针对性的修复方案

---

**创建时间**：2025-11-05  
**修复版本**：v2.2.0  
**状态**：🔍 待用户测试验证

