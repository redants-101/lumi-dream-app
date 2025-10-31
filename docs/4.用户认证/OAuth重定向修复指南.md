# 🔧 OAuth 回调重定向到 localhost 问题修复指南

## 🔴 问题描述

**症状**：
- 应用部署在 Vercel (https://www.lumidreams.app/)
- 点击 Google 或 GitHub 登录
- 登录后重定向到 `http://localhost:3000/?code=xxxx` 而不是生产域名

**根本原因**：
Supabase 的 Site URL 和 Redirect URLs 配置仍然指向 localhost。

---

## ✅ 修复步骤（按顺序执行）

### 📍 步骤 1: 更新 Supabase Site URL

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** → **URL Configuration**
4. 找到 **Site URL** 字段
5. 将其从 `http://localhost:3000` 更改为：
   ```
   https://www.lumidreams.app
   ```
6. 点击 **Save** 保存

---

### 📍 步骤 2: 配置 Redirect URLs 白名单

在同一页面（URL Configuration）：

1. 找到 **Redirect URLs** 字段
2. 确保包含以下所有 URL（每行一个）：

   ```
   http://localhost:3000/**
   https://www.lumidreams.app/**
   https://*.vercel.app/**
   ```

   > ⚠️ **重要**：
   > - `http://localhost:3000/**` - 保留用于本地开发
   > - `https://www.lumidreams.app/**` - 生产域名
   > - `https://*.vercel.app/**` - Vercel 预览部署

3. 点击 **Save** 保存

---

### 📍 步骤 3: 检查 Vercel 环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择 `lumi-dream-app` 项目
3. 进入 **Settings** → **Environment Variables**
4. 确认以下变量存在且正确：

   | 变量名 | 正确的值 | 环境 |
   |--------|---------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://你的项目ID.supabase.co` | Production |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key | Production |
   | `NEXT_PUBLIC_APP_URL` | `https://www.lumidreams.app` | Production |
   | `OPENROUTER_API_KEY` | `sk-or-v1-xxx` | Production |

5. 如果缺失或错误，点击 **Edit** 修改
6. 如果修改了环境变量，必须**重新部署**

---

### 📍 步骤 4: 更新 OAuth Provider 配置

#### 如果使用 GitHub 登录：

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 找到你的 OAuth App（如 `Lumi Dream App`）
3. 点击进入应用详情
4. 检查 **Authorization callback URL**：
   - 必须是：`https://你的项目ID.supabase.co/auth/v1/callback`
   - ⚠️ **不是** 你的应用域名，而是 Supabase 的域名
5. 如果有多个环境，可以创建两个 OAuth App：
   - `Lumi Dream App (Dev)` → Homepage: `http://localhost:3000`
   - `Lumi Dream App (Prod)` → Homepage: `https://www.lumidreams.app`
6. 点击 **Update application** 保存

#### 如果使用 Google 登录：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择项目
3. 进入 **APIs & Services** → **Credentials**
4. 找到你的 OAuth 2.0 客户端 ID
5. 在 **已授权的重定向 URI** 中添加：
   ```
   https://你的项目ID.supabase.co/auth/v1/callback
   ```
6. 确保没有添加 localhost URL 到生产 OAuth 客户端
7. 点击 **保存**

---

### 📍 步骤 5: 重新部署 Vercel 项目

1. 在 Vercel Dashboard，进入项目
2. 点击 **Deployments** 标签
3. 找到最新部署，点击右侧的 **...** 菜单
4. 选择 **Redeploy**
5. 等待部署完成

---

### 📍 步骤 6: 清除浏览器缓存并测试

1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮，选择 **清空缓存并硬性重新加载**
3. 访问 https://www.lumidreams.app
4. 点击 **Sign in with GitHub** 或 **Sign in with Google**
5. 完成授权
6. ✅ 应该正确重定向回 `https://www.lumidreams.app`

---

## 🔍 故障排查

### ❌ 问题 1: 修改后仍然重定向到 localhost

**可能原因**：
- Supabase 配置缓存未生效
- 浏览器缓存了旧的 OAuth 会话

**解决方案**：
1. 在 Supabase Dashboard 点击 **Authentication** → **Users**
2. 删除测试用户（如果有）
3. 完全关闭浏览器，重新打开
4. 使用隐身模式/无痕模式测试
5. 等待 5-10 分钟让 Supabase 配置生效

---

### ❌ 问题 2: 显示 "redirect_uri_mismatch" 错误

**错误信息**：
```
Error: redirect_uri_mismatch
The redirect URI in the request does not match the ones authorized for the OAuth client.
```

**解决方案**：
1. 检查 GitHub/Google OAuth App 的回调 URL
2. 必须精确匹配：`https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
3. 注意：
   - ✅ 使用 Supabase 域名（不是你的应用域名）
   - ✅ 包含 `/auth/v1/callback` 路径
   - ✅ 使用 `https://` 协议

---

### ❌ 问题 3: 回调后显示空白页或错误页

**可能原因**：
- Supabase Redirect URLs 白名单未包含你的域名
- 环境变量配置错误

**解决方案**：
1. 重新检查步骤 2 的 Redirect URLs 配置
2. 确保包含 `https://www.lumidreams.app/**`（注意结尾的 `/**`）
3. 检查 Vercel 环境变量中的 `NEXT_PUBLIC_SUPABASE_URL`
4. 在浏览器控制台查看具体错误信息

---

### ❌ 问题 4: 本地开发环境也受影响

**症状**：
修改 Site URL 后，本地开发环境无法登录

**解决方案**：
1. 确保 Redirect URLs 中保留了 `http://localhost:3000/**`
2. 在本地 `.env.local` 中添加：
   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Supabase 的 Site URL 只影响默认行为，Redirect URLs 白名单可以包含多个域名

---

## 📋 快速检查清单

修复前，确认以下配置：

### Supabase 配置
- [ ] Site URL = `https://www.lumidreams.app`
- [ ] Redirect URLs 包含 `https://www.lumidreams.app/**`
- [ ] Redirect URLs 包含 `http://localhost:3000/**`（用于本地开发）
- [ ] GitHub Provider 已启用（如使用）
- [ ] Google Provider 已启用（如使用）

### GitHub OAuth App（如使用）
- [ ] Callback URL = `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- [ ] 生产和开发使用不同的 OAuth App（推荐）

### Google OAuth Client（如使用）
- [ ] 授权重定向 URI = `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- [ ] 已添加到授权的 JavaScript 来源（如需要）

### Vercel 环境变量
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已配置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置
- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.lumidreams.app`
- [ ] 修改环境变量后已重新部署

---

## 🎯 验证修复成功

1. 访问 https://www.lumidreams.app
2. 点击 **Sign in with GitHub** 或 **Sign in with Google**
3. 完成 OAuth 授权
4. ✅ 成功重定向回 `https://www.lumidreams.app`（而不是 localhost）
5. ✅ 右上角显示用户头像和用户名
6. ✅ 可以正常使用 AI 解梦功能
7. ✅ 点击头像可以看到登出按钮

---

## 📚 相关文档

- [Supabase URL Configuration 文档](https://supabase.com/docs/guides/auth/redirect-urls)
- [GitHub OAuth Apps 文档](https://docs.github.com/en/apps/oauth-apps)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Vercel 环境变量文档](https://vercel.com/docs/projects/environment-variables)

---

## 💡 最佳实践

### 开发与生产环境分离

**推荐配置：**

1. **创建两个 GitHub OAuth Apps**：
   - Dev: `http://localhost:3000`
   - Prod: `https://www.lumidreams.app`

2. **Supabase 同时支持多个域名**：
   - Site URL: 设置为生产域名
   - Redirect URLs: 包含所有环境的域名

3. **使用环境变量**：
   ```bash
   # .env.local (本地开发)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # Vercel 生产环境变量
   NEXT_PUBLIC_SITE_URL=https://www.lumidreams.app
   ```

---

## 🆘 仍然无法解决？

1. 检查浏览器控制台的完整错误信息
2. 检查 Vercel 部署日志
3. 检查 Supabase Dashboard 的 Auth Logs
4. 确认所有配置已保存并等待 5-10 分钟
5. 尝试创建全新的 OAuth App 和 Supabase Provider 配置

---

**修复完成后，你的用户就能在生产环境正常登录了！** ✨

