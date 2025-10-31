# 🔐 Supabase GitHub 登录配置指南

本文档详细说明如何为 Lumi Dream App 配置 Supabase 的 GitHub OAuth 登录功能。

---

## 📋 配置步骤总览

1. 创建 Supabase 项目
2. 创建 GitHub OAuth 应用
3. 配置 Supabase GitHub 认证
4. 配置项目环境变量
5. 测试登录功能

---

## 1️⃣ 创建 Supabase 项目

### 步骤 1.1：注册 Supabase 账号

1. 访问 [Supabase 官网](https://supabase.com)
2. 点击 **Start your project** 或 **Sign In**
3. 使用 GitHub 账号登录（推荐）

### 步骤 1.2：创建新项目

1. 进入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **New Project**
3. 填写项目信息：
   - **Name**: `lumi-dream-app`（或自定义名称）
   - **Database Password**: 生成一个强密码并保存
   - **Region**: 选择离你最近的区域（建议：US East 或 US West）
   - **Pricing Plan**: 选择 **Free**（免费计划足够使用）
4. 点击 **Create new project**
5. 等待项目初始化（约 2 分钟）

### 步骤 1.3：获取 API 密钥

1. 项目创建完成后，在侧边栏点击 **Settings** → **API**
2. 在 **Project API keys** 部分，找到：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **复制并保存这两个值**（稍后配置环境变量时需要）

---

## 2️⃣ 创建 GitHub OAuth 应用

### 步骤 2.1：创建 OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **OAuth Apps** → **New OAuth App**
3. 填写应用信息：

   **开发环境配置：**
   - **Application name**: `Lumi Dream App (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://YOUR_SUPABASE_PROJECT_URL.supabase.co/auth/v1/callback`
     > ⚠️ 将 `YOUR_SUPABASE_PROJECT_URL` 替换为你的 Supabase 项目 URL
     > 
     > 示例：`https://abcdefghijk.supabase.co/auth/v1/callback`

4. 点击 **Register application**

### 步骤 2.2：获取 Client ID 和 Client Secret

1. 应用创建后，在应用详情页面找到：
   - **Client ID**: `Ov23liXXXXXXXXXXXXXX`
   - 点击 **Generate a new client secret** 生成 **Client Secret**
2. **立即复制并保存 Client Secret**（只会显示一次！）

### 步骤 2.3：生产环境配置（可选）

如果需要部署到生产环境，建议创建单独的 OAuth App：

1. 再次点击 **New OAuth App**
2. 填写信息：
   - **Application name**: `Lumi Dream App (Production)`
   - **Homepage URL**: `https://www.lumidreams.app`（你的生产域名）
   - **Authorization callback URL**: `https://YOUR_SUPABASE_PROJECT_URL.supabase.co/auth/v1/callback`
3. 获取生产环境的 Client ID 和 Client Secret

---

## 3️⃣ 配置 Supabase GitHub 认证

### 步骤 3.1：启用 GitHub Provider

1. 回到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 在侧边栏点击 **Authentication** → **Providers**
4. 找到 **GitHub** 并点击

### 步骤 3.2：填写 GitHub OAuth 配置

1. 启用 **GitHub Enabled** 开关
2. 填写从 GitHub 获取的信息：
   - **Client ID**: `Ov23liXXXXXXXXXXXXXX`（粘贴从 GitHub 复制的值）
   - **Client Secret**: `ghp_XXXXXXXXXXXXXXXXXXXXXXXX`（粘贴从 GitHub 复制的值）
3. 点击 **Save**

### 步骤 3.3：配置站点 URL（重要！）

1. 在侧边栏点击 **Authentication** → **URL Configuration**
2. 配置以下 URL：

   **开发环境：**
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: 
     ```
     http://localhost:3000/**
     ```

   **生产环境（部署后配置）：**
   - **Site URL**: `https://www.lumidreams.app`
   - **Redirect URLs**: 
     ```
     https://www.lumidreams.app/**
     ```

3. 点击 **Save**

---

## 4️⃣ 配置项目环境变量

### 步骤 4.1：创建本地环境变量文件

1. 在项目根目录中，复制 `env.example` 文件：
   ```bash
   cp env.example .env.local
   ```

2. 打开 `.env.local` 文件

### 步骤 4.2：填写 Supabase 配置

在 `.env.local` 文件中，找到 Supabase 配置部分并填写：

```bash
# ===================================
# Supabase 配置
# ===================================
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例（实际值需要替换）：**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTk5NTU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步骤 4.3：保存文件

保存 `.env.local` 文件后，环境变量配置完成。

---

## 5️⃣ 测试登录功能

### 步骤 5.1：启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

### 步骤 5.2：测试 GitHub 登录

1. 打开浏览器访问 `http://localhost:3000`
2. 在右上角找到 **Sign in with GitHub** 按钮
3. 点击按钮，应该会重定向到 GitHub 授权页面
4. 点击 **Authorize** 授权应用
5. 授权成功后，应该会重定向回应用首页
6. 此时右上角应该显示你的 GitHub 头像和用户名

### 步骤 5.3：验证用户信息

1. 点击右上角的用户头像
2. 应该看到下拉菜单显示：
   - 用户名
   - 邮箱地址
   - 登出按钮
3. 点击 **Sign out** 测试登出功能

### 步骤 5.4：检查 Supabase 用户表

1. 回到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **Authentication** → **Users**
3. 应该看到刚才登录的用户记录

---

## 🚀 部署到生产环境

### Vercel 部署配置

1. 将代码推送到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com) 导入项目
3. 在 **Environment Variables** 中添加：
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   NEXT_PUBLIC_APP_URL=https://www.lumidreams.app
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. 点击 **Deploy**

### 更新 Supabase 生产 URL

部署完成后，需要更新 Supabase 的 URL 配置：

1. 在 Supabase Dashboard 中，点击 **Authentication** → **URL Configuration**
2. 将 **Site URL** 更新为你的生产域名：
   ```
   https://www.lumidreams.app
   ```
3. 在 **Redirect URLs** 中添加：
   ```
   https://www.lumidreams.app/**
   ```
4. 点击 **Save**

### 更新 GitHub OAuth App

1. 回到 [GitHub OAuth Apps](https://github.com/settings/developers)
2. 编辑生产环境的 OAuth App
3. 确认 **Authorization callback URL** 正确：
   ```
   https://YOUR_SUPABASE_PROJECT_URL.supabase.co/auth/v1/callback
   ```

---

## 🔍 故障排除

### 问题 1：点击登录按钮无反应

**可能原因：**
- 环境变量未正确配置
- Supabase URL 或 API Key 错误

**解决方法：**
1. 检查 `.env.local` 文件中的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 确保重启了开发服务器（`pnpm dev`）
3. 检查浏览器控制台是否有错误信息

### 问题 2：重定向到 GitHub 后返回错误页面

**可能原因：**
- GitHub OAuth App 的回调 URL 配置错误
- Supabase 的 Redirect URLs 未正确配置

**解决方法：**
1. 确认 GitHub OAuth App 的 **Authorization callback URL** 为：
   ```
   https://YOUR_SUPABASE_PROJECT_URL.supabase.co/auth/v1/callback
   ```
2. 确认 Supabase 的 **Redirect URLs** 包含：
   ```
   http://localhost:3000/**
   ```

### 问题 3：授权成功但无法获取用户信息

**可能原因：**
- Supabase GitHub Provider 未启用
- Client ID 或 Client Secret 错误

**解决方法：**
1. 在 Supabase Dashboard 检查 **Authentication** → **Providers** → **GitHub**
2. 确认 **GitHub Enabled** 已开启
3. 重新检查 **Client ID** 和 **Client Secret** 是否正确

### 问题 4：开发环境正常，生产环境登录失败

**可能原因：**
- 生产环境的 URL 未在 Supabase 中配置
- 使用了开发环境的 OAuth App

**解决方法：**
1. 为生产环境创建单独的 GitHub OAuth App
2. 在 Supabase 的 **URL Configuration** 中添加生产域名
3. 确保 Vercel 环境变量配置正确

---

## 📚 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase GitHub Auth 指南](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Supabase 服务器端认证](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [GitHub OAuth Apps 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Next.js 15 文档](https://nextjs.org/docs)

---

## 💡 最佳实践

### 安全性

1. **永远不要提交** `.env.local` 文件到 Git 仓库
2. 定期轮换 Supabase 的 **service_role** 密钥（如使用）
3. 使用 Supabase 的 **Row Level Security (RLS)** 保护用户数据

### 用户体验

1. 在登录按钮上显示加载状态
2. 处理登录失败的错误提示
3. 提供登出功能和用户信息显示
4. 考虑添加"记住我"功能（Supabase 默认支持）

### 生产环境

1. 为开发和生产环境使用不同的 GitHub OAuth Apps
2. 监控 Supabase 的使用量和性能
3. 配置 Supabase 的 Email 模板（用于密码重置等）
4. 考虑添加其他登录方式（Google, Twitter 等）

---

## ✅ 配置完成检查清单

- [ ] Supabase 项目已创建
- [ ] 获取了 Supabase URL 和 anon key
- [ ] GitHub OAuth App 已创建（开发环境）
- [ ] 获取了 GitHub Client ID 和 Client Secret
- [ ] Supabase 中已启用 GitHub Provider
- [ ] Supabase 中配置了正确的 Site URL 和 Redirect URLs
- [ ] `.env.local` 文件已配置
- [ ] 开发服务器可以正常启动
- [ ] GitHub 登录功能测试通过
- [ ] 用户信息显示正常
- [ ] 登出功能正常

---

## 🆘 需要帮助？

如果遇到问题，可以：

1. 查看浏览器控制台的错误信息
2. 查看 Supabase Dashboard 的 Logs
3. 参考 [Supabase Discord 社区](https://discord.supabase.com)
4. 查看项目的 Issues

---

**祝你配置顺利！✨**

