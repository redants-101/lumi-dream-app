# 🔐 环境变量配置指南

## ⚠️ 重要：配置 OpenRouter API Key

项目已经成功运行，但要使用 AI 解梦功能，你需要配置 OpenRouter API Key。

> 🎉 **好消息**：现在使用的是 **完全免费** 的 Gemini 2.0 Flash Thinking 模型！

## 📝 配置步骤

### 1. 获取 OpenRouter API Key

1. 访问 [OpenRouter Platform](https://openrouter.ai/keys)
2. 使用 Google、GitHub 或邮箱登录/注册
3. 点击 "Create Key" 创建新 API 密钥
4. 复制生成的 API Key（格式类似：`sk-or-v1-xxxxx...`）

> 💡 **优势**：OpenRouter 提供多个免费模型，无需绑定信用卡即可开始使用！

### 2. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

**Windows (PowerShell):**
```powershell
New-Item -Path .env.local -ItemType File -Force
notepad .env.local
```

**或者直接在项目根目录创建 `.env.local` 文件**

### 3. 添加配置

在 `.env.local` 文件中添加以下内容（将 `your-api-key-here` 替换为你的实际 API Key）：

```env
# OpenRouter API Key (必需)
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here

# 应用 URL (可选，用于 OpenRouter 统计)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 重启开发服务器

配置完成后，需要重启开发服务器：

1. 在终端按 `Ctrl + C` 停止当前服务器
2. 重新运行 `pnpm dev`
3. 刷新浏览器页面

## ✅ 验证配置

访问 http://localhost:3000，尝试输入一个梦境描述并点击"开始解析"按钮：

- ✅ **成功**：如果看到 AI 生成的解析结果，说明配置正确
- ❌ **失败**：如果出现错误，检查以下内容：
  - API Key 是否正确复制（没有多余空格）
  - `.env.local` 文件是否在项目根目录
  - 是否重启了开发服务器
  - 检查浏览器控制台和终端的错误信息

## 🚨 安全提示

- ⚠️ **不要**将 `.env.local` 文件提交到 Git
- ⚠️ **不要**在公开场合分享你的 API Key
- ⚠️ API Key 已通过 `.gitignore` 自动排除，请保持该设置

## 💰 费用说明

### 当前模型：Gemini 2.0 Flash Thinking

- 🎁 **完全免费**！（限速期间）
- 🚀 **极速响应**：通常 1-2 秒内返回结果
- 🧠 **推理能力强**：适合深度梦境分析
- 📊 **无需信用卡**：注册即可使用

### 其他可选模型

OpenRouter 提供 100+ 模型可选，包括：
- `anthropic/claude-3.5-haiku` - 温暖心理分析风格（$5/M输出）
- `deepseek/deepseek-chat` - 中文优化（$1.10/M输出）
- `openai/gpt-4o-mini` - OpenAI 经济版（$0.60/M输出）

可在 [OpenRouter Usage Dashboard](https://openrouter.ai/activity) 查看使用情况。

## 🆘 常见问题

### Q: 如何切换到其他 AI 模型？

A: 在 `app/api/interpret/route.ts` 文件中修改模型 ID：
```typescript
model: openrouter("google/gemini-2.0-flash-thinking-exp:free")  
// 改为其他模型，例如：
// model: openrouter("anthropic/claude-3.5-haiku")
```

完整模型列表：https://openrouter.ai/models

### Q: OpenRouter 有使用限制吗？

A: 免费模型有速率限制（通常每分钟 20 次请求），足够个人测试使用。付费模型按使用量计费，无限制。

### Q: 能同时支持多个模型吗？

A: 可以！您可以实现模型路由逻辑，根据用户等级或场景选择不同模型：
```typescript
const modelId = user.isPremium 
  ? "anthropic/claude-3.5-sonnet"      // 付费用户
  : "google/gemini-2.0-flash-thinking-exp:free"  // 免费用户
```

### Q: 为什么要从 OpenAI 切换到 OpenRouter？

A: OpenRouter 的优势：
- ✅ 访问 100+ 模型（OpenAI、Anthropic、Google 等）
- ✅ 自动故障转移和负载均衡
- ✅ 提供免费模型选项
- ✅ 统一 API 接口，易于切换
- ✅ 更灵活的定价策略

---

配置完成后，尽情探索你的梦境世界吧！🌙✨

