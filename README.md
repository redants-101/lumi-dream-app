# 🌙 Lumi - AI 解梦应用

一个基于 AI 的梦境解析 Web 应用，使用温暖神秘的设计风格，帮助用户探索梦境的深层含义。

## ✨ 项目特点

- 🤖 **AI 驱动**：使用 OpenRouter + Google Gemini 2.0 Flash Thinking 提供专业的梦境解析
- 🎁 **完全免费**：使用免费 AI 模型，无需信用卡
- 🔐 **社交登录**：使用 Supabase 实现 GitHub、Google OAuth 认证（可选）
- 🎨 **精美设计**：深紫色/午夜蓝配色 + 柔和金色点缀，营造神秘梦幻氛围
- ⚡ **现代技术栈**：Next.js 15 + React 19 + TypeScript 5
- 📱 **响应式设计**：完美适配桌面和移动设备
- ✨ **特色视觉效果**：自定义发光效果，增强神秘感
- 🔄 **模型可切换**：支持 100+ AI 模型，灵活配置

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + Shadcn/ui (New York 风格)
- **图标**: Lucide React
- **字体**: Nunito (Google Fonts)
- **AI SDK**: Vercel AI SDK
- **认证**: Supabase (GitHub OAuth)
- **包管理器**: pnpm

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- pnpm (包管理器)
- OpenRouter API Key (完全免费，无需信用卡)
- Supabase 账号（可选，用于社交登录）

### 安装步骤

1. **安装依赖**

```bash
pnpm install
```

2. **配置环境变量**

创建 `.env.local` 文件并添加你的 OpenRouter API Key：

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 社交登录（可选 - GitHub 和 Google）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> 💡 **OpenRouter API Key**：访问 [OpenRouter Platform](https://openrouter.ai/keys) 创建（免费注册，无需信用卡）
> 
> 🔐 **社交登录配置**：
> - GitHub 登录：查看 [GitHub 配置指南](docs/SUPABASE_GITHUB_AUTH.md)
> - Google 登录：查看 [Google 配置指南](docs/SUPABASE_GOOGLE_AUTH.md)
> - 快速开始：查看 [快速配置指南](docs/SUPABASE_QUICK_START.md)（5 分钟）
> 
> 📄 详细配置指南：查看 `docs/ENV_SETUP.md`

3. **启动开发服务器**

```bash
pnpm dev
```

4. **打开浏览器**

访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 📁 项目结构

```
lumi-dream-app/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证 API
│   │   │   ├── callback/  # OAuth 回调
│   │   │   ├── login/     # 登录
│   │   │   ├── logout/    # 登出
│   │   │   └── user/      # 获取用户信息
│   │   └── interpret/     # 梦境解析 API
│   ├── auth/              # 认证页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   ├── ui/               # Shadcn UI 组件库
│   ├── user-button.tsx   # 用户认证按钮
│   └── theme-provider.tsx # 主题提供者
├── hooks/
│   └── use-auth.ts       # 认证状态管理
├── lib/
│   ├── supabase/         # Supabase 客户端配置
│   └── utils.ts          # 工具函数
├── docs/                 # 项目文档
├── middleware.ts         # Next.js 中间件
└── public/              # 静态资源
```

## 🎨 设计系统

### 配色方案

- **主背景**: 深午夜蓝 `oklch(0.12 0.05 280)`
- **主色调**: 柔和金色 `oklch(0.65 0.15 60)`
- **强调色**: 鲜艳紫色 `oklch(0.55 0.18 280)`

### 自定义工具类

```typescript
glow-text    // 文字发光效果
glow-box     // 盒子金色光晕
glow-purple  // 紫色环境光
```

## 📝 可用脚本

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

## 🔒 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 | ✅ 是 |
| `NEXT_PUBLIC_APP_URL` | 应用 URL（用于统计） | ❌ 可选 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ❌ 可选（用于登录） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ❌ 可选（用于登录） |

## 📚 核心功能

### 1. 梦境输入
- 用户友好的文本输入框
- 实时字符验证
- 清晰的错误提示

### 2. AI 解析
- 使用 OpenRouter 官方 SDK（`@openrouter/ai-sdk-provider`）
- 默认模型：Google Gemini 2.0 Flash Thinking（完全免费）
- 支持外部配置切换模型（Claude、DeepSeek 等 100+ 模型）
- 200-400 字专业解析
- 结构化解析结果（关键符号、可能含义、反思问题）
- 完整的使用追踪（token 统计、成本监控、finishReason）

### 3. 结果展示
- 优雅的动画效果
- 易读的排版
- 免责声明提示

### 4. 用户认证 🔐（可选）
- **多种社交登录**：支持 GitHub、Google OAuth 登录
- **服务器端认证**：遵循 Supabase 最佳安全实践
- **用户状态管理**：实时认证状态同步
- **优雅的 UI**：用户头像、下拉菜单、响应式设计
- **5 分钟配置**：查看 [快速开始指南](docs/SUPABASE_QUICK_START.md)

### 5. 隐私合规 🍪
- **Cookie 同意横幅**：符合 GDPR/CCPA 法规
- **隐私政策页面**：完整的隐私声明
- **用户选择记忆**：localStorage 本地存储
- **退出选项**：允许拒绝非必要 Cookie

## 🎯 开发规范

项目遵循严格的代码规范，详见 `.cursor/rules/lumi-dream-app-rules.mdc`

### 关键规范：

- ✅ 使用 App Router（非 Pages Router）
- ✅ 客户端组件标记 `"use client"`
- ✅ 导入使用 `@/` 路径别名
- ✅ 类名合并使用 `cn()` 函数
- ✅ API 路由使用 `Response.json()`
- ✅ 完整的 TypeScript 类型定义

## 🚀 部署到 Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/lumi-dream-app)

### 手动部署步骤

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

2. **在 Vercel 创建项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 导入你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 项目

3. **配置环境变量**（必需！）
   
   在 Vercel 项目设置 → Environment Variables 中添加：
   
   ```plaintext
   OPENROUTER_API_KEY=sk-or-v1-你的密钥
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase密钥
   NEXT_PUBLIC_APP_URL=https://你的域名.vercel.app
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（1-3 分钟）
   
📚 **详细部署指南**：查看 [VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

## 🐛 故障排除

### 依赖安装问题

```bash
# 清理缓存并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 端口被占用

```bash
# 更改端口运行
pnpm dev -p 3001
```

### API 调用失败

- 检查 `.env.local` 文件是否存在
- 确认 OpenRouter API Key 是否正确（格式：sk-or-v1-...）
- 检查网络连接是否正常
- 查看终端错误日志获取详细信息
- 访问 [OpenRouter Status](https://openrouter.ai/status) 检查服务状态

### Vercel 构建失败

- ✅ 确保已配置所有必需的环境变量
- ✅ 检查项目使用 pnpm 包管理器（已配置 `.npmrc`）
- ✅ 查看 [部署指南](docs/VERCEL_DEPLOYMENT.md) 排查问题

## 🆕 最新更新

### 社交登录功能（2025-10-18）
- ✅ 使用 Supabase 实现多种 OAuth 登录（GitHub、Google）
- ✅ 服务器端认证（SSR）遵循安全最佳实践
- ✅ 完整的用户认证流程（登录/登出/状态管理）
- ✅ 优雅的用户界面（头像、下拉菜单、响应式）
- ✅ 实时认证状态同步
- ✅ 完整的错误处理和回调处理
- 📚 详细文档：
  - [快速开始](docs/SUPABASE_QUICK_START.md)（5 分钟配置）
  - [GitHub 登录配置](docs/SUPABASE_GITHUB_AUTH.md)
  - [Google 登录配置](docs/SUPABASE_GOOGLE_AUTH.md)
  - [使用指南](docs/GITHUB_AUTH_USAGE.md)

### Cookie 同意功能（2025-10-17）
- ✅ 添加符合 GDPR/CCPA 的 Cookie 同意横幅
- ✅ 创建完整的隐私政策页面（`/privacy`）
- ✅ 本地存储用户选择（localStorage）
- ✅ 响应式设计，完美适配移动端
- ✅ 优雅的动画效果和 Lumi 设计风格
- 📚 详细文档：查看 `docs/COOKIE_CONSENT.md`

## 📄 许可证

本项目仅供学习和个人使用。

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

**注意**: 此服务仅供娱乐和自我探索，不能替代专业心理咨询。


