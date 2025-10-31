# 🚀 Vercel 部署指南

## 📋 部署前准备清单

### ✅ 1. 环境变量配置（必需）

在 Vercel 项目设置中配置以下环境变量：

#### 🔑 必需的环境变量

| 变量名 | 说明 | 如何获取 |
|--------|------|---------|
| `OPENROUTER_API_KEY` | OpenRouter AI API 密钥 | [https://openrouter.ai/keys](https://openrouter.ai/keys) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | [https://supabase.com/dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | [https://supabase.com/dashboard](https://supabase.com/dashboard) → Settings → API |

#### 🎨 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_APP_URL` | 应用的公开 URL | `https://www.lumidreams.app` |
| `AI_MODEL` | 使用的 AI 模型 | `google/gemini-2.0-flash-thinking-exp:free` |
| `NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT` | 未登录用户每日解梦次数 | `5` |
| `NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT` | 已登录用户每日解梦次数 | `10` |

---

## 🔧 Vercel 配置步骤

### 步骤 1: 连接 GitHub 仓库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库 `lumi-dream-app`
4. 点击 "Import"

### 步骤 2: 配置构建设置

Vercel 会自动检测 Next.js 项目，默认配置如下：

```plaintext
Framework Preset: Next.js
Build Command: pnpm build (自动检测)
Output Directory: .next (自动)
Install Command: pnpm install (自动检测)
```

**⚠️ 重要**：确保 Vercel 使用 **pnpm** 而不是 npm！

- ✅ 项目已配置 `.npmrc` 文件，指定使用 pnpm
- ✅ 项目中只保留 `pnpm-lock.yaml`（已删除 `package-lock.json`）

### 步骤 3: 添加环境变量

在 Vercel 项目设置中：

1. 进入 "Settings" → "Environment Variables"
2. 添加以下变量（点击 "Add"）：

#### 必需变量

```plaintext
名称: OPENROUTER_API_KEY
值: sk-or-v1-你的实际密钥
环境: Production, Preview, Development
```

```plaintext
名称: NEXT_PUBLIC_SUPABASE_URL
值: https://你的项目ID.supabase.co
环境: Production, Preview, Development
```

```plaintext
名称: NEXT_PUBLIC_SUPABASE_ANON_KEY
值: 你的Supabase匿名密钥
环境: Production, Preview, Development
```

#### 可选变量（推荐）

```plaintext
名称: NEXT_PUBLIC_APP_URL
值: https://你的域名.vercel.app (或自定义域名)
环境: Production
```

### 步骤 4: 部署

1. 点击 "Deploy" 按钮
2. 等待构建完成（通常 1-3 分钟）
3. 部署成功后，访问提供的 URL 测试应用

---

## 🔍 常见构建错误排查

### ❌ 错误 1: 包管理器冲突

**错误信息**：
```
Multiple lockfiles found (package-lock.json and pnpm-lock.yaml)
```

**解决方案**：
- ✅ 已在本地删除 `package-lock.json`
- ✅ 已创建 `.npmrc` 指定使用 pnpm
- 推送这些更改到 GitHub 后重新部署

### ❌ 错误 2: 环境变量缺失

**错误信息**：
```
TypeError: Cannot read properties of undefined (reading 'NEXT_PUBLIC_SUPABASE_URL')
```

**解决方案**：
1. 检查 Vercel 项目设置中是否已添加所有必需的环境变量
2. 确保变量名称**完全匹配**（区分大小写）
3. 重新部署项目

### ❌ 错误 3: Supabase 认证失败

**错误信息**：
```
Supabase client initialization failed
```

**解决方案**：
1. 确认 Supabase 项目已创建
2. 复制正确的 URL 和 Anon Key（不是 Service Key）
3. 检查 Supabase 项目是否已启用认证功能

### ❌ 错误 4: OpenRouter API 失败

**错误信息**：
```
AI service is not configured
```

**解决方案**：
1. 在 [OpenRouter](https://openrouter.ai/keys) 创建 API Key
2. 确保 API Key 以 `sk-or-v1-` 开头
3. 检查 OpenRouter 账户是否有余额（免费模型无需余额）

---

## 📊 部署后验证

部署成功后，测试以下功能：

- [ ] 主页加载正常
- [ ] 输入梦境描述
- [ ] AI 解梦功能工作正常
- [ ] 未登录用户有 5 次免费使用限制
- [ ] Google 登录功能正常
- [ ] GitHub 登录功能正常
- [ ] 登录后获得额外使用次数

---

## 🔐 Supabase OAuth 回调配置

### 配置 OAuth 重定向 URL

在 Supabase Dashboard 中：

1. 进入 "Authentication" → "URL Configuration"
2. 添加以下 URL 到 "Redirect URLs"：

```plaintext
https://你的域名.vercel.app/api/auth/callback
https://你的域名.vercel.app/auth/callback
```

### 配置社交登录提供商

#### Google OAuth

1. 进入 "Authentication" → "Providers" → "Google"
2. 启用 Google Provider
3. 输入 Google OAuth Client ID 和 Secret
4. 详细步骤参考：`docs/SUPABASE_GOOGLE_AUTH.md`

#### GitHub OAuth

1. 进入 "Authentication" → "Providers" → "GitHub"
2. 启用 GitHub Provider
3. 输入 GitHub OAuth Client ID 和 Secret
4. 在 GitHub App 设置中添加回调 URL：
   ```
   https://你的项目ID.supabase.co/auth/v1/callback
   ```
5. 详细步骤参考：`docs/SUPABASE_GITHUB_AUTH.md`

---

## 🎯 生产环境优化建议

### 1. 自定义域名

在 Vercel 项目设置中：
- "Settings" → "Domains"
- 添加你的自定义域名（如 `www.lumidreams.app`）
- 更新 `NEXT_PUBLIC_APP_URL` 环境变量

### 2. 性能监控

- Vercel Analytics 已集成（`@vercel/analytics`）
- Vercel Speed Insights 已集成（`@vercel/speed-insights`）
- 在 Vercel Dashboard 查看性能数据

### 3. 错误监控

考虑集成错误追踪服务：
- Sentry
- LogRocket
- Bugsnag

### 4. AI 成本控制

监控 OpenRouter 使用情况：
- 访问 [OpenRouter Dashboard](https://openrouter.ai/activity)
- 查看 API 调用次数和成本
- 当前使用免费模型 `google/gemini-2.0-flash-thinking-exp:free`

---

## 📝 更新部署

### 自动部署（推荐）

- 推送到 `main` 分支会自动触发生产环境部署
- 推送到其他分支会创建预览部署

### 手动部署

在 Vercel Dashboard：
1. 进入项目
2. 点击 "Deployments"
3. 点击右上角 "Redeploy"

---

## 🆘 需要帮助？

### Vercel 支持

- [Vercel 文档](https://vercel.com/docs)
- [Vercel 支持](https://vercel.com/help)

### 项目文档

- 快速开始：`README.md`
- Supabase 配置：`docs/SUPABASE_QUICK_START.md`
- 环境变量说明：`docs/ENV_SETUP.md`
- OpenRouter 配置：`docs/OPENROUTER_MIGRATION.md`

---

## ✅ 部署成功！

如果所有步骤都完成，你的 Lumi Dream App 应该已经成功部署到 Vercel！🎉

访问你的应用 URL，开始帮助用户解析梦境吧！

