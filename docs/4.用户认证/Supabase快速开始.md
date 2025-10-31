# 🚀 Supabase 社交登录 - 快速开始

> 5 分钟完成 GitHub 或 Google 登录配置

---

## 📝 准备工作

- GitHub 账号
- 浏览器

---

## ⚡ 快速配置（3 步）

### 1️⃣ 创建 Supabase 项目

1. 访问 https://supabase.com
2. 使用 GitHub 登录
3. 创建新项目（选择免费计划）
4. 复制 **Project URL** 和 **anon key**（Settings → API）

### 2️⃣ 创建 OAuth 应用（选择一种）

#### 选项 A：GitHub 登录

1. 访问 https://github.com/settings/developers
2. 点击 **OAuth Apps** → **New OAuth App**
3. 填写信息：
   - Name: `Lumi Dream App (Dev)`
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. 复制 **Client ID** 和生成 **Client Secret**

#### 选项 B：Google 登录

1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 配置 OAuth 同意屏幕
4. 创建 OAuth 客户端 ID（Web 应用）
5. 添加重定向 URI：`https://YOUR_PROJECT.supabase.co/auth/v1/callback`
6. 复制 **Client ID** 和 **Client Secret**

> 💡 两种方式可以同时配置！

### 3️⃣ 配置项目

1. 复制环境变量文件：
   ```bash
   cp env.example .env.local
   ```

2. 编辑 `.env.local`：
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. 在 Supabase Dashboard：
   - **Authentication** → **Providers** → 启用 **GitHub** 或 **Google**（或两者都启用）
   - 填入对应的 Client ID 和 Client Secret
   - **Authentication** → **URL Configuration** → 添加 `http://localhost:3000/**`

4. 启动项目：
   ```bash
   pnpm dev
   ```

5. 打开 http://localhost:3000 测试登录！

---

## 📖 详细文档

**完整配置指南：**
- [GitHub 登录配置](./Supabase的GitHub登录配置.md)
- [Google 登录配置](./Supabase的Google登录配置.md)
- [使用指南和扩展示例](./GitHub登录使用指南.md)

---

## ✅ 验证清单

- [ ] Supabase 项目已创建
- [ ] GitHub OAuth App 已创建
- [ ] `.env.local` 已配置
- [ ] Supabase 中启用了 GitHub Provider
- [ ] 可以成功登录

---

**需要帮助？查看完整文档：**
- [GitHub 登录](./Supabase的GitHub登录配置.md)
- [Google 登录](./Supabase的Google登录配置.md)

