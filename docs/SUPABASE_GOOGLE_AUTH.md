# 🔐 Supabase Google 登录配置指南

本文档详细说明如何为 Lumi Dream App 配置 Supabase 的 Google OAuth 登录功能。

---

## 📋 配置步骤总览

1. 在 Google Cloud Console 创建 OAuth 应用
2. 配置 Supabase Google 认证
3. 测试登录功能

> 💡 **前提条件**：你已经完成了 [Supabase 基础配置](./SUPABASE_GITHUB_AUTH.md#1️⃣-创建-supabase-项目)（Supabase 项目已创建）

---

## 1️⃣ 在 Google Cloud Console 创建 OAuth 应用

### 步骤 1.1：访问 Google Cloud Console

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用你的 Google 账号登录

### 步骤 1.2：创建新项目（如果还没有）

1. 点击顶部导航栏的项目选择器
2. 点击 **新建项目**
3. 填写项目信息：
   - **项目名称**：`Lumi Dream App`（或自定义名称）
   - **位置**：选择你的组织（如果有）或留空
4. 点击 **创建**
5. 等待项目创建完成（约 10 秒）

### 步骤 1.3：启用 Google+ API（可选）

1. 在左侧菜单中，点击 **API 和服务** → **已启用的 API 和服务**
2. 点击 **+ 启用 API 和服务**
3. 搜索 `Google+ API`
4. 点击 **启用**

### 步骤 1.4：配置 OAuth 同意屏幕

1. 在左侧菜单中，点击 **OAuth 同意屏幕**
2. 选择用户类型：
   - **外部**：任何 Google 账户都可以登录（推荐）
   - **内部**：仅限你的 Google Workspace 组织内的用户
3. 点击 **创建**
4. 填写应用信息：

   **应用信息：**
   - **应用名称**：`Lumi Dream Interpreter`
   - **用户支持电子邮件地址**：你的邮箱
   - **应用徽标**：可选（建议上传 Lumi Logo）

   **应用网域：**
   - **应用首页**：`https://www.lumidreams.app`（或你的域名）
   - **应用隐私权政策链接**：`https://www.lumidreams.app/privacy`
   - **应用服务条款链接**：可选

   **已获授权的网域：**
   - 添加：`lumidreams.app`（你的域名）
   - 开发环境添加：`localhost`

   **开发者联系信息：**
   - **电子邮件地址**：你的邮箱

5. 点击 **保存并继续**

6. **权限范围**：
   - 点击 **添加或移除权限范围**
   - 选择以下权限：
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - 点击 **更新**
   - 点击 **保存并继续**

7. **测试用户**（如果选择了"外部"用户类型）：
   - 在开发阶段，添加测试用户的邮箱地址
   - 点击 **+ 添加用户**
   - 输入测试用户的 Gmail 地址
   - 点击 **保存并继续**

8. **摘要**：
   - 检查所有信息
   - 点击 **返回到信息中心**

### 步骤 1.5：创建 OAuth 客户端 ID

1. 在左侧菜单中，点击 **凭据**
2. 点击 **+ 创建凭据** → **OAuth 客户端 ID**
3. 选择应用类型：**Web 应用**
4. 填写信息：

   **名称**：`Lumi Web Client`

   **已获授权的 JavaScript 来源**：
   ```
   http://localhost:3000
   https://www.lumidreams.app
   ```

   **已获授权的重定向 URI**：
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   > ⚠️ 重要：将 `YOUR_SUPABASE_PROJECT_REF` 替换为你的 Supabase 项目 URL
   > 
   > 示例：`https://abcdefghijk.supabase.co/auth/v1/callback`
   >
   > 你可以在 Supabase Dashboard → Settings → API 中找到你的项目 URL

5. 点击 **创建**

### 步骤 1.6：获取客户端凭据

创建成功后，会弹出一个对话框显示：

- **客户端 ID**：`123456789-xxxxxx.apps.googleusercontent.com`
- **客户端密钥**：`GOCSPX-xxxxxxxxxxxxxx`

**立即复制并保存这两个值！**（稍后配置 Supabase 时需要）

> 💡 提示：你也可以随时在 **凭据** 页面点击客户端名称查看这些信息

---

## 2️⃣ 配置 Supabase Google 认证

### 步骤 2.1：启用 Google Provider

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 在左侧菜单点击 **Authentication** → **Providers**
4. 找到 **Google** 并点击

### 步骤 2.2：填写 Google OAuth 配置

1. 启用 **Google Enabled** 开关
2. 填写从 Google Cloud Console 获取的信息：
   - **Client ID (for OAuth)**：`123456789-xxxxxx.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**：`GOCSPX-xxxxxxxxxxxxxx`
3. 可选配置：
   - **Authorized Client IDs**：留空（除非你需要服务器端访问）
   - **Skip nonce checks**：保持关闭（推荐）
4. 点击 **Save**

### 步骤 2.3：确认 URL 配置

1. 在左侧菜单点击 **Authentication** → **URL Configuration**
2. 确认以下 URL 已配置：

   **开发环境：**
   - **Site URL**：`http://localhost:3000`
   - **Redirect URLs**：
     ```
     http://localhost:3000/**
     ```

   **生产环境：**
   - **Site URL**：`https://www.lumidreams.app`
   - **Redirect URLs**：
     ```
     https://www.lumidreams.app/**
     ```

3. 点击 **Save**

---

## 3️⃣ 测试登录功能

### 步骤 3.1：确认环境变量

确保 `.env.local` 文件中已配置 Supabase 凭据：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 步骤 3.2：启动开发服务器

```bash
npm run dev
```

### 步骤 3.3：测试 Google 登录

1. 打开浏览器访问 `http://localhost:3000`
2. 在右上角找到 **Sign in with Google** 按钮
3. 点击按钮，应该会重定向到 Google 登录页面
4. 选择你的 Google 账号（或登录）
5. 如果是首次使用，会看到授权确认页面
6. 点击 **继续** 或 **允许**
7. 授权成功后，应该会重定向回应用首页
8. 此时右上角应该显示你的 Google 头像和用户名

### 步骤 3.4：验证用户信息

1. 点击右上角的用户头像
2. 应该看到下拉菜单显示：
   - 你的姓名
   - 你的 Gmail 地址
   - 登出按钮
3. 点击 **Sign out** 测试登出功能

### 步骤 3.5：检查 Supabase 用户表

1. 回到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **Authentication** → **Users**
3. 应该看到刚才登录的用户记录
4. 查看用户的 **Provider** 列，应该显示 `google`

---

## 🚀 部署到生产环境

### 更新 Google OAuth 客户端

1. 回到 [Google Cloud Console](https://console.cloud.google.com/)
2. 找到你的 OAuth 客户端 ID
3. 编辑 **已获授权的 JavaScript 来源**，添加：
   ```
   https://www.lumidreams.app
   ```
4. 确认 **已获授权的重定向 URI** 包含：
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```
5. 点击 **保存**

### 更新 Supabase URL 配置

1. 在 Supabase Dashboard 中，点击 **Authentication** → **URL Configuration**
2. 更新 **Site URL** 为生产域名：
   ```
   https://www.lumidreams.app
   ```
3. 在 **Redirect URLs** 中添加：
   ```
   https://www.lumidreams.app/**
   ```
4. 点击 **Save**

### Vercel 环境变量

确保在 Vercel Dashboard 中配置了正确的环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://www.lumidreams.app
```

---

## 🔍 故障排除

### 问题 1：点击登录按钮后无反应

**可能原因：**
- 环境变量未正确配置
- Supabase URL 或 API Key 错误

**解决方法：**
1. 检查 `.env.local` 文件
2. 确保重启了开发服务器
3. 检查浏览器控制台错误信息

### 问题 2：重定向到 Google 后显示错误 "redirect_uri_mismatch"

**可能原因：**
- Google OAuth 客户端的重定向 URI 配置错误

**解决方法：**
1. 确认 Google Cloud Console 中的重定向 URI 为：
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```
2. 确保使用的是正确的 Supabase 项目 URL
3. 等待几分钟让 Google 的配置生效

### 问题 3：显示 "Access blocked: This app's request is invalid"

**可能原因：**
- OAuth 同意屏幕配置不完整
- 测试用户未添加（如果应用处于测试模式）

**解决方法：**
1. 返回 Google Cloud Console → OAuth 同意屏幕
2. 确保所有必填字段都已填写
3. 如果应用在测试模式，将你的 Gmail 添加为测试用户
4. 或者发布应用（点击 **发布应用** 按钮）

### 问题 4：授权成功但无法获取用户信息

**可能原因：**
- Supabase Google Provider 未启用
- Client ID 或 Client Secret 错误

**解决方法：**
1. 在 Supabase Dashboard 检查 **Authentication** → **Providers** → **Google**
2. 确认 **Google Enabled** 已开启
3. 重新检查 Client ID 和 Client Secret
4. 尝试重新保存配置

### 问题 5：本地测试正常，生产环境失败

**可能原因：**
- 生产域名未添加到 Google OAuth 配置
- Supabase Redirect URLs 未配置生产域名

**解决方法：**
1. 在 Google Cloud Console 添加生产域名到 **已获授权的 JavaScript 来源**
2. 在 Supabase 添加生产域名到 **Redirect URLs**
3. 等待配置生效（可能需要几分钟）

---

## 📊 Google 用户数据结构

登录成功后，`user` 对象包含以下 Google 信息：

```typescript
{
  id: "uuid",                    // Supabase 用户 ID
  email: "user@gmail.com",       // Google 邮箱
  user_metadata: {
    avatar_url: "https://...",   // Google 头像
    full_name: "John Doe",       // Google 账户姓名
    email: "user@gmail.com",     // Google 邮箱（重复）
    email_verified: true,        // 邮箱已验证
    iss: "https://accounts.google.com",
    name: "John Doe",
    picture: "https://...",      // Google 头像（同 avatar_url）
    provider_id: "123456789...", // Google 用户 ID
    sub: "123456789..."          // Google 用户 ID（同 provider_id）
  },
  app_metadata: {
    provider: "google",          // OAuth 提供商
    providers: ["google"]
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

---

## 🔒 安全最佳实践

### 1. 保护 Client Secret

- ✅ 永远不要在客户端代码中暴露 Client Secret
- ✅ 只在 Supabase Dashboard 中配置 Client Secret
- ✅ 定期轮换 Client Secret（在 Google Cloud Console 中重新生成）

### 2. 限制授权域名

- ✅ 只添加你控制的域名到 **已获授权的 JavaScript 来源**
- ✅ 生产环境和开发环境使用不同的 OAuth 客户端（可选）

### 3. 审查应用权限

- ✅ 只请求必要的权限范围（email 和 profile）
- ✅ 定期审查 OAuth 同意屏幕的信息
- ✅ 提供清晰的隐私政策链接

### 4. 监控登录活动

- ✅ 在 Supabase Dashboard 查看用户登录日志
- ✅ 监控异常登录行为
- ✅ 配置邮件通知（Supabase 支持）

---

## 📚 相关资源

- **Google Cloud Console**：https://console.cloud.google.com/
- **Google OAuth 文档**：https://developers.google.com/identity/protocols/oauth2
- **Supabase Google Auth 文档**：https://supabase.com/docs/guides/auth/social-login/auth-google
- **Supabase 服务器端认证**：https://supabase.com/docs/guides/auth/server-side/creating-a-client

---

## ✅ 配置完成检查清单

- [ ] Google Cloud 项目已创建
- [ ] OAuth 同意屏幕已配置
- [ ] OAuth 客户端 ID 已创建
- [ ] 获取了 Client ID 和 Client Secret
- [ ] Supabase 中已启用 Google Provider
- [ ] Supabase 中配置了 Client ID 和 Client Secret
- [ ] Supabase 中配置了正确的 Redirect URLs
- [ ] 本地环境测试通过
- [ ] 用户信息显示正常
- [ ] 登出功能正常

---

## 💡 提示

### Google 和 GitHub 双重登录

你现在同时拥有 Google 和 GitHub 登录功能！用户可以：

- 选择任意一种方式登录
- 两种方式会创建不同的用户账户（即使邮箱相同）
- 如需关联同一邮箱的多个登录方式，需要额外配置（参考 Supabase 文档）

### 发布应用到生产环境

默认情况下，Google OAuth 应用处于 **测试模式**，有以下限制：

- 只有测试用户可以登录
- 最多 100 个测试用户
- 每 7 天需要重新授权

**发布到生产环境：**

1. 在 Google Cloud Console → OAuth 同意屏幕
2. 点击 **发布应用**
3. 如果你的应用不需要敏感权限，可以立即发布
4. 如果需要敏感权限，需要通过 Google 的审核（可能需要几天）

---

**祝你配置顺利！✨**

