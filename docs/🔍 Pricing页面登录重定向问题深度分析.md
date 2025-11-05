# 🔍 Pricing 页面登录重定向问题深度分析

## 🐛 问题描述

**现象**：在 `/pricing` 页面登录成功后，GitHub/Google 登录会重定向到首页 `/` 而不是 `/pricing`

## 📊 系统中的三套登录对话框

### 1. Navigation 组件 - Dashboard 拦截登录
**文件**：`components/navigation.tsx:202-234`  
**触发场景**：未登录用户点击 Dashboard 链接  
**重定向逻辑**：
```typescript
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setShowLoginDialog(false)
  provider("/dashboard")  // ❌ 硬编码跳转到 /dashboard
}
```

### 2. Pricing 页面 - 订阅登录
**文件**：`app/pricing/page.tsx:301-349`  
**触发场景**：点击订阅按钮时（Free/Basic/Pro）  
**重定向逻辑**：
```typescript
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setShowLoginDialog(false)
  console.log("[Pricing] Initiating login...")
  provider("/pricing")  // ✅ 正确传递 /pricing
}
```

### 3. UserButton 组件 - 导航栏登录
**文件**：`components/user-button.tsx:62-100`  
**触发场景**：点击导航栏右上角的 "Sign In" 按钮  
**重定向逻辑**：
```typescript
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setOpen(false)
  provider(currentPath)  // ✅ 已修复，传递当前路径
}
```

## 🎯 登录流程追踪

### 完整调用链

```
用户在 /pricing 页面
    ↓
点击登录按钮（可能是以下三种之一）
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. 导航栏 "Sign In" 按钮 (UserButton)                        │
│    → UserButton.SignInDialog                                 │
│    → handleSignIn(provider)                                  │
│    → provider(currentPath)  // currentPath = "/pricing" ✅   │
│    → signInWithGithub("/pricing")                           │
│                                                              │
│ 2. Pricing 页面订阅按钮                                      │
│    → PricingPage.handleSubscribe                            │
│    → setShowLoginDialog(true)                               │
│    → PricingPage.handleSignIn(provider)                     │
│    → provider("/pricing")  // 明确传递 /pricing ✅          │
│    → signInWithGithub("/pricing")                           │
│                                                              │
│ 3. 点击 Dashboard 链接（拦截）                               │
│    → Navigation.handleNavClick                              │
│    → setShowLoginDialog(true)                               │
│    → Navigation.handleSignIn(provider)                      │
│    → provider("/dashboard")  // 硬编码 /dashboard ❌        │
│    → signInWithGithub("/dashboard")                         │
└─────────────────────────────────────────────────────────────┘
    ↓
hooks/use-auth.ts: signInWithGithub(redirectPath)
    ↓
signInWithOAuth("github", redirectPath)
    ↓
POST /api/auth/login
    body: { provider: "github", redirectPath: "/pricing" }
    ↓
app/api/auth/login/route.ts
    ↓
构建回调 URL:
    redirectPath ? 
        `${origin}/api/auth/callback?next=${encodeURIComponent(redirectPath)}`
      : `${origin}/api/auth/callback`
    
    结果: /api/auth/callback?next=%2Fpricing  ✅
    ↓
Supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
        redirectTo: callbackUrl  // /api/auth/callback?next=%2Fpricing
    }
})
    ↓
返回 OAuth URL → 前端重定向到 GitHub/Google
    ↓
用户授权
    ↓
GitHub/Google 回调到: /api/auth/callback?code=xxx&next=%2Fpricing
    ↓
app/api/auth/callback/route.ts
    ↓
const next = searchParams.get("next") ?? "/"
    结果: "/pricing" ✅
    ↓
NextResponse.redirect(`${origin}${next}`)
    ↓
最终跳转: /pricing ✅
```

## 🔍 可能的问题点

### 问题点 1：next 参数丢失

**位置**：`app/api/auth/callback/route.ts:12`

```typescript
const next = searchParams.get("next") ?? "/"
```

**分析**：
- ✅ 如果有 `next` 参数，会正确读取
- ❌ 如果没有 `next` 参数，**默认跳转到 `/`（首页）**

**可能原因**：
1. OAuth 提供商在回调时丢失了 `next` 参数
2. URL 编码问题导致参数解析失败
3. Supabase redirectTo 配置问题

### 问题点 2：URL 编码问题

**当前编码**：
```typescript
// app/api/auth/login/route.ts:26
const callbackUrl = redirectPath 
  ? `${origin}/api/auth/callback?next=${encodeURIComponent(redirectPath)}`
  : `${origin}/api/auth/callback`
```

**结果**：
- `/pricing` → `%2Fpricing` ✅ 正确编码

**解码**：
```typescript
// app/api/auth/callback/route.ts:12
const next = searchParams.get("next") ?? "/"
```

**分析**：`searchParams.get()` 会自动解码，应该没有问题 ✅

### 问题点 3：Supabase OAuth 配置

**检查项**：
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL 是否正确？
3. Redirect URLs 是否包含回调地址？

**必需配置**：
```
Site URL: http://localhost:3000 (开发环境)
         https://yourdomain.com (生产环境)

Redirect URLs:
  - http://localhost:3000/api/auth/callback
  - http://localhost:3000/api/auth/callback?next=*
  - https://yourdomain.com/api/auth/callback
  - https://yourdomain.com/api/auth/callback?next=*
```

## 🧪 测试场景

### 场景 1：UserButton 登录（导航栏右上角）
```
步骤：
1. 未登录状态访问 /pricing
2. 点击导航栏 "Sign In" 按钮
3. 选择 GitHub 登录
4. 授权后观察跳转

预期：跳转到 /pricing ✅
实际：？
```

### 场景 2：Pricing 页面订阅登录
```
步骤：
1. 未登录状态访问 /pricing
2. 点击任意套餐的订阅按钮（如 Basic）
3. 在弹出的对话框中选择 GitHub 登录
4. 授权后观察跳转

预期：跳转到 /pricing ✅
实际：？
```

### 场景 3：Dashboard 拦截登录
```
步骤：
1. 未登录状态访问 /pricing
2. 点击导航栏 "Dashboard" 链接
3. 在弹出的对话框中选择 GitHub 登录
4. 授权后观察跳转

预期：跳转到 /dashboard ✅（设计如此）
实际：？
```

## 🔧 调试方法

### 方法 1：添加日志追踪

**在 API 路由中添加日志**：

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { provider, redirectPath } = await request.json()
  
  console.log("=== OAuth Login ===")
  console.log("Provider:", provider)
  console.log("Redirect Path:", redirectPath)
  console.log("Callback URL:", callbackUrl)
  console.log("==================")
  
  // ... 其他代码
}
```

```typescript
// app/api/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  console.log("=== OAuth Callback ===")
  console.log("Full URL:", request.url)
  console.log("Query Params:", Object.fromEntries(searchParams))
  console.log("Next Param:", searchParams.get("next"))
  console.log("======================")
  
  // ... 其他代码
}
```

**在前端添加日志**：

```typescript
// components/user-button.tsx
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  console.log("=== UserButton SignIn ===")
  console.log("Current Path:", currentPath)
  console.log("========================")
  
  setOpen(false)
  provider(currentPath)
}
```

### 方法 2：检查网络请求

1. 打开浏览器 DevTools
2. 切换到 Network 标签
3. 执行登录操作
4. 检查以下请求：
   - `POST /api/auth/login` - 查看 Request Payload 中的 redirectPath
   - OAuth 回调 - 查看 URL 中的 next 参数

### 方法 3：检查 Supabase 配置

**检查 Redirect URLs**：
```bash
# 在 Supabase Dashboard 中检查
Authentication → URL Configuration → Redirect URLs
```

确保包含：
- `http://localhost:3000/api/auth/callback`（开发环境）
- `https://yourdomain.com/api/auth/callback`（生产环境）

## 💡 可能的解决方案

### 解决方案 1：修复 Navigation 组件的硬编码

**问题**：Navigation 的 handleSignIn 硬编码跳转到 `/dashboard`

**修复**：
```typescript
// components/navigation.tsx
const handleSignIn = (provider: (redirectPath?: string) => void) => {
  setShowLoginDialog(false)
  // ✅ 修复：跳转到 Dashboard（这是设计意图）
  provider("/dashboard")
}
```

**分析**：这个实际上是正确的，因为这个对话框**只在点击 Dashboard 时触发**。

### 解决方案 2：确保 Supabase 配置正确

**添加通配符 Redirect URL**：
```
http://localhost:3000/api/auth/callback*
https://yourdomain.com/api/auth/callback*
```

### 解决方案 3：使用 state 参数代替 query 参数

**问题**：OAuth 提供商可能不保留自定义 query 参数

**修复**：使用 Supabase 的 state 参数
```typescript
// app/api/auth/login/route.ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: provider as "github" | "google",
  options: {
    redirectTo: `${origin}/api/auth/callback`,
    // ✅ 使用 state 传递重定向路径
    queryParams: {
      state: Buffer.from(JSON.stringify({ next: redirectPath })).toString('base64')
    }
  },
})
```

```typescript
// app/api/auth/callback/route.ts
const stateParam = searchParams.get("state")
let next = "/"

if (stateParam) {
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString())
    next = decoded.next || "/"
  } catch (e) {
    console.error("Failed to decode state:", e)
  }
}
```

## 📋 检查清单

请用户确认以下信息：

- [ ] 具体是从哪个入口登录的？
  - [ ] 导航栏右上角 "Sign In" 按钮
  - [ ] Pricing 页面的订阅按钮（Free/Basic/Pro）
  - [ ] 点击 Dashboard 链接触发的登录
  
- [ ] 登录后跳转到了哪里？
  - [ ] `/`（首页）
  - [ ] `/dashboard`
  - [ ] 其他页面

- [ ] 浏览器控制台是否有日志输出？
  - [ ] `[Pricing] Initiating login...`
  - [ ] `[UserButton SignIn]`
  - [ ] 其他错误信息

- [ ] 在 Network 标签中检查：
  - [ ] `/api/auth/login` 的请求体中 `redirectPath` 的值
  - [ ] OAuth 回调 URL 中是否包含 `next` 参数

## 🎯 下一步行动

1. **立即添加调试日志**：在 API 路由和前端组件中添加 console.log
2. **测试并收集信息**：执行登录操作，记录完整日志
3. **根据日志分析**：确定 next 参数在哪个环节丢失
4. **应用修复方案**：根据具体问题选择合适的解决方案

---

**创建时间**：2025-11-05  
**状态**：🔍 待测试验证

