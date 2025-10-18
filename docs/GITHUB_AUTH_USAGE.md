# 🔐 GitHub 登录使用指南

本文档说明如何在 Lumi Dream App 中使用 GitHub 登录功能。

---

## 🎯 功能概述

GitHub 登录功能让用户可以使用他们的 GitHub 账号快速登录 Lumi Dream App，无需创建新账号或记住额外密码。

### 主要优势

- ✅ **快速登录**：一键使用 GitHub 账号登录
- ✅ **安全可靠**：使用 GitHub OAuth 2.0 标准协议
- ✅ **无需密码**：无需创建和记住新密码
- ✅ **自动同步**：用户信息自动从 GitHub 获取
- ✅ **跨设备使用**：登录状态在所有设备间同步

---

## 👤 用户视角：如何使用

### 1. 登录流程

1. 访问 Lumi Dream App 首页
2. 点击右上角的 **"Sign in with GitHub"** 按钮
3. 浏览器会重定向到 GitHub 授权页面
4. 在 GitHub 授权页面，点击 **"Authorize"** 按钮
5. 授权成功后，自动返回 Lumi Dream App
6. 现在你已登录，右上角会显示你的 GitHub 头像

### 2. 查看个人信息

1. 点击右上角的用户头像
2. 下拉菜单会显示：
   - 你的 GitHub 用户名
   - 你的 GitHub 邮箱
   - 登出选项

### 3. 登出

1. 点击右上角的用户头像
2. 在下拉菜单中点击 **"Sign out"**
3. 登出成功，页面会刷新
4. 右上角会重新显示 **"Sign in with GitHub"** 按钮

---

## 💻 开发者视角：技术实现

### 架构概述

```
用户点击登录
    ↓
前端调用 /api/auth/login
    ↓
后端生成 GitHub OAuth URL
    ↓
重定向到 GitHub 授权页面
    ↓
用户授权
    ↓
GitHub 回调到 /api/auth/callback
    ↓
后端交换 code 获取 session
    ↓
设置认证 cookie
    ↓
重定向回首页
    ↓
用户已登录 ✅
```

### 核心组件说明

#### 1. `useAuth` Hook
```typescript
// hooks/use-auth.ts
const { user, isLoading, isAuthenticated, signInWithGithub, signOut } = useAuth()
```

**返回值：**
- `user`: 当前用户对象（含 GitHub 信息）
- `isLoading`: 认证状态加载中
- `isAuthenticated`: 是否已登录
- `signInWithGithub()`: 启动 GitHub 登录
- `signOut()`: 登出当前用户

#### 2. `UserButton` 组件
```typescript
// components/user-button.tsx
<UserButton />
```

**功能：**
- 未登录时显示 "Sign in with GitHub" 按钮
- 已登录时显示用户头像和下拉菜单
- 加载时显示加载动画

#### 3. Supabase 客户端
```typescript
// lib/supabase/client.ts - 客户端使用
import { createClient } from "@/lib/supabase/client"

// lib/supabase/server.ts - 服务器端使用
import { createClient } from "@/lib/supabase/server"
```

#### 4. API 路由

- **`/api/auth/login`**: 启动 GitHub OAuth 登录
- **`/api/auth/callback`**: 处理 GitHub OAuth 回调
- **`/api/auth/logout`**: 处理用户登出
- **`/api/auth/user`**: 获取当前用户信息

#### 5. 中间件
```typescript
// middleware.ts
// 自动刷新认证 token，确保会话有效
```

---

## 🔧 扩展功能示例

### 示例 1：保护路由（仅登录用户可访问）

```typescript
// app/dashboard/page.tsx
"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/") // 未登录，重定向到首页
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null // 正在重定向
  }

  return <div>Welcome to Dashboard!</div>
}
```

### 示例 2：显示用户特定内容

```typescript
// app/profile/page.tsx
"use client"

import { useAuth } from "@/hooks/use-auth"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to view your profile</div>
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {user.user_metadata?.full_name}</p>
      <p>Username: {user.user_metadata?.user_name}</p>
      <p>Email: {user.email}</p>
      <img src={user.user_metadata?.avatar_url} alt="Avatar" />
    </div>
  )
}
```

### 示例 3：服务器端获取用户信息

```typescript
// app/server-page/page.tsx
import { createClient } from "@/lib/supabase/server"

export default async function ServerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <div>
      <h1>Server-side Auth</h1>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

### 示例 4：API 路由中验证用户

```typescript
// app/api/protected/route.ts
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // 用户已认证，继续处理
  return Response.json({
    message: "Protected data",
    userId: user.id
  })
}
```

---

## 🔒 安全考虑

### 1. 环境变量保护

- ✅ 使用 `NEXT_PUBLIC_` 前缀的变量是公开的（在客户端可见）
- ✅ 不要在 `NEXT_PUBLIC_` 变量中存储敏感信息
- ✅ Supabase 的 `anon key` 是公开的，设计为在客户端使用
- ✅ Supabase 的 `service_role key` 是私密的，永远不要暴露

### 2. Row Level Security (RLS)

在 Supabase 中使用 RLS 保护用户数据：

```sql
-- 在 Supabase SQL Editor 中执行
-- 示例：创建用户梦境记录表
CREATE TABLE dreams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  dream_text TEXT NOT NULL,
  interpretation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的梦境
CREATE POLICY "Users can view own dreams"
  ON dreams
  FOR SELECT
  USING (auth.uid() = user_id);

-- 策略：用户只能插入自己的梦境
CREATE POLICY "Users can insert own dreams"
  ON dreams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3. 中间件保护

使用中间件自动保护路由：

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // 保护特定路由
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
```

---

## 📊 用户数据结构

### GitHub 用户信息

登录成功后，`user` 对象包含以下信息：

```typescript
{
  id: "uuid",                    // Supabase 用户 ID
  email: "user@example.com",     // GitHub 邮箱
  user_metadata: {
    avatar_url: "https://...",   // GitHub 头像
    full_name: "John Doe",       // GitHub 姓名
    user_name: "johndoe",        // GitHub 用户名
    preferred_username: "johndoe"
  },
  app_metadata: {
    provider: "github",          // OAuth 提供商
    providers: ["github"]
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

---

## 🧪 测试建议

### 手动测试清单

- [ ] 未登录状态显示 "Sign in with GitHub" 按钮
- [ ] 点击登录按钮成功跳转到 GitHub
- [ ] GitHub 授权后成功返回应用
- [ ] 登录后显示用户头像
- [ ] 用户菜单显示正确的用户名和邮箱
- [ ] 点击登出成功退出
- [ ] 退出后重新显示登录按钮
- [ ] 刷新页面后登录状态保持
- [ ] 在不同标签页中登录状态同步

### 常见问题排查

**问题：点击登录按钮无反应**
- 检查浏览器控制台是否有错误
- 确认环境变量配置正确
- 确认 Supabase 项目正常运行

**问题：授权后返回错误页面**
- 检查 GitHub OAuth App 的回调 URL
- 检查 Supabase 的 Redirect URLs 配置
- 查看 Supabase Logs 获取详细错误

**问题：用户信息未显示**
- 打开浏览器开发工具 → Network
- 检查 `/api/auth/user` 请求是否成功
- 检查响应是否包含用户数据

---

## 📚 相关资源

- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [GitHub OAuth 文档](https://docs.github.com/en/apps/oauth-apps)
- [Next.js 中间件文档](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [配置指南](./SUPABASE_GITHUB_AUTH.md)
- [快速开始](./SUPABASE_QUICK_START.md)

---

**祝你使用愉快！✨**

