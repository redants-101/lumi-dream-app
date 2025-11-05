# 🔧 Supabase Redirect URLs 配置完整指南

## 📋 问题总结

**现象**：从 `/pricing` 页面登录后，跳转到首页 `/` 而不是 `/pricing`

**根本原因**：Supabase 的 Redirect URLs 配置不正确，导致使用了默认的 Site URL

**环境**：使用 ngrok 隧道（`https://unpatentable-unrepudiable-marget.ngrok-free.dev`）

## ✅ 完整配置步骤

### 步骤 1：配置 Supabase Dashboard

#### 1.1 打开配置页面

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`mainndpvgoguduyktybj`
3. 点击左侧 **Authentication**
4. 点击 **URL Configuration**

#### 1.2 配置 Site URL

**推荐配置**（根据主要使用场景选择）：

**选项 A：主要使用 localhost 开发**
```
http://localhost:3000
```

**选项 B：主要使用 ngrok 测试**
```
https://unpatentable-unrepudiable-marget.ngrok-free.dev
```

⚠️ **注意**：
- Site URL 是当代码中没有指定 `redirectTo` 时的默认值
- 建议使用你最常用的访问方式
- 生产环境部署后改为正式域名

#### 1.3 配置 Redirect URLs（关键！）

根据 [Supabase 官方文档](https://supabase.com/docs/guides/auth/redirect-urls)，添加以下 URL：

```
http://localhost:3000/**
http://localhost:3000/api/auth/callback
https://unpatentable-unrepudiable-marget.ngrok-free.dev/**
https://unpatentable-unrepudiable-marget.ngrok-free.dev/api/auth/callback
```

**通配符说明**：
- `**` - 匹配任意路径（推荐用于开发环境）
- `*` - 匹配单层路径
- 具体路径 - 最安全，推荐生产环境使用

#### 1.4 配置示意图

```
┌───────────────────────────────────────────────────────────────┐
│ Supabase Dashboard → Authentication → URL Configuration      │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│ Site URL (默认重定向地址):                                     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ http://localhost:3000                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Redirect URLs (允许列表):                                     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ http://localhost:3000/**                                 │ │
│ │ http://localhost:3000/api/auth/callback                  │ │
│ │ https://unpatentable-unrepudiable-marget.ngrok-free...   │ │
│ │ https://unpatentable-unrepudiable-marget.ngrok-free.../  │ │
│ │     api/auth/callback                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ✅ [Save]                                                      │
└───────────────────────────────────────────────────────────────┘
```

---

### 步骤 2：配置 GitHub OAuth App

#### 2.1 访问 GitHub 设置

1. 访问：https://github.com/settings/developers
2. 点击 **OAuth Apps**
3. 找到你的应用（或创建新的）

#### 2.2 配置 Authorization callback URL

**问题**：GitHub OAuth App 通常只允许**一个**回调 URL

**解决方案**：根据当前使用场景选择

**开发时使用**：
```
http://localhost:3000/api/auth/callback
```

**使用 ngrok 测试时**：
```
https://unpatentable-unrepudiable-marget.ngrok-free.dev/api/auth/callback
```

**生产环境**：
```
https://www.lumidreams.app/api/auth/callback
```

⚠️ **建议**：
- 创建两个 OAuth App：
  - 一个用于开发（localhost）
  - 一个用于测试/生产（ngrok/正式域名）
- 在 `.env.local` 中使用不同的 Client ID 和 Secret

---

### 步骤 3：配置 Google OAuth（如果使用）

#### 3.1 访问 Google Cloud Console

1. 访问：https://console.cloud.google.com/apis/credentials
2. 选择你的项目
3. 点击 OAuth 2.0 Client ID

#### 3.2 配置 Authorized redirect URIs

**优势**：Google 允许多个重定向 URI

添加以下所有 URI：
```
http://localhost:3000/api/auth/callback
https://unpatentable-unrepudiable-marget.ngrok-free.dev/api/auth/callback
https://www.lumidreams.app/api/auth/callback
```

---

### 步骤 4：更新代码（已完成）

#### 4.1 优化 origin 获取逻辑

已更新 `app/api/auth/login/route.ts`：

```typescript
// ✅ 智能获取 origin
// 1. 优先使用环境变量 NEXT_PUBLIC_APP_URL
// 2. 其次使用 x-forwarded-host (ngrok/Vercel)
// 3. 最后使用 request URL
let origin = process.env.NEXT_PUBLIC_APP_URL
if (!origin) {
  origin = forwardedHost 
    ? `${protocol}://${forwardedHost}`
    : requestUrl.origin
}
```

**好处**：
- 自动适配 localhost、ngrok、生产环境
- 无需手动修改代码

---

## 🧪 测试验证

### 测试 1：Localhost 测试

1. **确保环境变量注释掉**（临时测试）
   ```bash
   # .env.local
   # NEXT_PUBLIC_APP_URL=https://unpatentable-unrepudiable-marget.ngrok-free.dev
   ```

2. **重启开发服务器**
   ```bash
   pnpm dev
   ```

3. **访问** `http://localhost:3000/pricing`

4. **点击** Basic 的 "Subscribe Now"

5. **观察日志**：
   ```
   === [OAuth Login] ===
   Provider: github
   Redirect Path: /pricing
   Origin: http://localhost:3000  ✅ 应该是 http
   Callback URL: http://localhost:3000/api/auth/callback?next=%2Fpricing
   ```

6. **登录后应该跳转到** `/pricing` ✅

### 测试 2：ngrok 测试

1. **启用环境变量**
   ```bash
   # .env.local
   NEXT_PUBLIC_APP_URL=https://unpatentable-unrepudiable-marget.ngrok-free.dev
   ```

2. **重启服务器**

3. **通过 ngrok URL 访问**

4. **观察日志**：
   ```
   === [OAuth Login] ===
   Origin: https://unpatentable-unrepudiable-marget.ngrok-free.dev  ✅
   Callback URL: https://unpatentable-unrepudiable-marget.ngrok-free.dev/api/auth/callback?next=%2Fpricing
   ```

5. **登录后应该跳转到** `/pricing` ✅

---

## 📊 预期日志输出

### ✅ 正确的日志

```bash
=== [Pricing SignIn] ===
Redirect Path: /pricing
========================

=== [OAuth Login] ===
Provider: github
Redirect Path: /pricing
Origin: http://localhost:3000  # 或 ngrok URL
Request URL: http://localhost:3000/api/auth/login
Callback URL: http://localhost:3000/api/auth/callback?next=%2Fpricing
====================

# GitHub 授权后...

=== [OAuth Callback] ===
Full URL: http://localhost:3000/api/auth/callback?code=xxx&next=%2Fpricing
                        ↑ 正确！应该是 /api/auth/callback
Code exists: true
Next param: /pricing
========================

GET /pricing 200 in 72ms  ✅ 跳转到 /pricing
```

### ❌ 错误的日志（修复前）

```bash
=== [OAuth Login] ===
Callback URL: http://localhost:3000/api/auth/callback?next=%2Fpricing
====================

# 但实际回调是：
GET /?code=xxx 200 in 292ms  ❌ 回调到了根路径
```

---

## 🔍 常见问题

### Q1：为什么回调到了 `/` 而不是 `/api/auth/callback`？

**A**：Supabase 的 Redirect URLs 配置不正确，导致使用了默认的 Site URL。

**解决方案**：
1. 在 Redirect URLs 中添加 `http://localhost:3000/**`
2. 确保 Site URL 和实际访问的 URL 协议一致（HTTP/HTTPS）

### Q2：localhost 使用 HTTP 还是 HTTPS？

**A**：
- **开发环境**：使用 `http://localhost:3000`
- **ngrok 隧道**：使用 `https://your-subdomain.ngrok-free.dev`
- **生产环境**：使用 `https://yourdomain.com`

### Q3：GitHub OAuth 只允许一个回调 URL 怎么办？

**A**：有两个选择：

**选项 1**：创建两个 OAuth App
```
App 1 (开发): http://localhost:3000/api/auth/callback
App 2 (生产): https://yourdomain.com/api/auth/callback
```

**选项 2**：临时修改
- 开发时使用 localhost
- 测试时改为 ngrok
- 部署前改为生产 URL

### Q4：ngrok URL 每次都变化怎么办？

**A**：

**免费方案**：每次修改 Supabase 和 GitHub 配置

**付费方案**：使用固定的 ngrok 域名
```bash
ngrok http 3000 --domain=your-fixed-domain.ngrok-free.app
```

---

## 📋 配置检查清单

完成配置后，请检查以下所有项：

### Supabase 配置
- [ ] Site URL = `http://localhost:3000`（或 ngrok URL）
- [ ] Redirect URLs 包含 `http://localhost:3000/**`
- [ ] Redirect URLs 包含 `http://localhost:3000/api/auth/callback`
- [ ] Redirect URLs 包含 ngrok URL（如果使用）
- [ ] 点击 **Save** 保存配置

### GitHub OAuth
- [ ] Authorization callback URL = `http://localhost:3000/api/auth/callback`
- [ ] 或者创建了两个 OAuth App（开发 + 生产）

### Google OAuth（如果使用）
- [ ] Authorized redirect URIs 包含所有必要的 URL

### 环境变量
- [ ] `.env.local` 中的 `NEXT_PUBLIC_APP_URL` 正确
- [ ] Supabase URL 和 Keys 正确

### 代码更新
- [ ] `app/api/auth/login/route.ts` 已更新
- [ ] 删除 `.next` 文件夹
- [ ] 重启开发服务器

---

## 🚀 快速修复步骤

如果你只想快速解决问题：

1. **Supabase Dashboard**
   ```
   Site URL: http://localhost:3000
   
   Redirect URLs:
   - http://localhost:3000/**
   - https://unpatentable-unrepudiable-marget.ngrok-free.dev/**
   ```

2. **GitHub OAuth**
   ```
   Callback URL: http://localhost:3000/api/auth/callback
   ```

3. **重启服务器**
   ```bash
   # 按 Ctrl+C 停止
   pnpm dev
   ```

4. **测试**
   - 访问 `http://localhost:3000/pricing`
   - 点击 Subscribe Now
   - 登录
   - 应该回到 `/pricing` ✅

---

## 📚 参考资料

- [Supabase Redirect URLs 官方文档](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase OAuth 配置指南](https://supabase.com/docs/guides/auth/social-login)
- [GitHub OAuth Apps 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)

---

**创建时间**：2025-11-05  
**最后更新**：2025-11-05  
**状态**：✅ 配置指南已完成

