# 🌙 Lumi - AI 解梦应用

一个基于 AI 的梦境解析 Web 应用，使用温暖神秘的设计风格，帮助用户探索梦境的深层含义。

## ✨ 项目特点

- 🤖 **AI 驱动**：使用 OpenRouter + Google Gemini 2.0 Flash Thinking 提供专业的梦境解析
- 🎁 **完全免费**：使用免费 AI 模型，无需信用卡
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
- **包管理器**: pnpm

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 pnpm (推荐)
- OpenRouter API Key (完全免费，无需信用卡)

### 安装步骤

1. **安装依赖**

```bash
pnpm install
# 或
npm install
```

2. **配置环境变量**

创建 `.env.local` 文件并添加你的 OpenRouter API Key：

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 如何获取 API Key：访问 [OpenRouter Platform](https://openrouter.ai/keys) 创建（免费注册，无需信用卡）
> 📄 详细配置指南：查看 `docs/ENV_SETUP.md`

3. **启动开发服务器**

```bash
pnpm dev
# 或
npm run dev
```

4. **打开浏览器**

访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 📁 项目结构

```
lumi-dream-app/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API 路由
│   │   └── interpret/     # 梦境解析 API
│   ├── layout.tsx         # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   ├── ui/               # Shadcn UI 组件库
│   └── theme-provider.tsx # 主题提供者
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数
├── docs/                 # 项目文档
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

## 🎯 开发规范

项目遵循严格的代码规范，详见 `.cursor/rules/lumi-dream-app-rules.mdc`

### 关键规范：

- ✅ 使用 App Router（非 Pages Router）
- ✅ 客户端组件标记 `"use client"`
- ✅ 导入使用 `@/` 路径别名
- ✅ 类名合并使用 `cn()` 函数
- ✅ API 路由使用 `Response.json()`
- ✅ 完整的 TypeScript 类型定义

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

## 📄 许可证

本项目仅供学习和个人使用。

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

**注意**: 此服务仅供娱乐和自我探索，不能替代专业心理咨询。


