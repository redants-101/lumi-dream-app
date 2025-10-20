# 🚀 升级后快速上手指南

> 如何使用新的 OpenRouter 官方包和配置系统

---

## ✅ 已完成的升级

### 1. **安装了新的依赖包**
```bash
pnpm add @openrouter/ai-sdk-provider
```

### 2. **创建了配置文件**
- 📁 `lib/ai-config.ts` - 集中管理所有 AI 模型配置

### 3. **升级了 API 路由**
- 📁 `app/api/interpret/route.ts` - 使用官方 SDK 和完整功能

### 4. **更新了环境变量**
- 📁 `env.example` - 添加了 `AI_MODEL` 配置选项

---

## 🎯 现在你可以做什么

### 方式 1: 保持默认（推荐开始）

**不需要任何额外配置**，直接使用免费的 Gemini 2.0 Flash Thinking。

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

✅ 启动服务器即可使用！

---

### 方式 2: 通过环境变量切换模型

想要更温暖的心理分析风格？添加一行配置：

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_MODEL=anthropic/claude-3.5-haiku  # 👈 添加这一行
```

**可用模型**:
```bash
# 免费（默认）
AI_MODEL=google/gemini-2.0-flash-thinking-exp:free

# 温暖心理风格（$5/M）
AI_MODEL=anthropic/claude-3.5-haiku

# 最强同理心（$15/M）
AI_MODEL=anthropic/claude-3.5-sonnet

# 中文优化（$1.10/M）
AI_MODEL=deepseek/deepseek-chat

# 联网搜索（$5/M）
AI_MODEL=perplexity/llama-3.1-sonar-large-128k-online
```

重启服务器后生效。

---

### 方式 3: 修改默认配置

编辑 `lib/ai-config.ts`:

```typescript
export function getCurrentModel(): string {
  // 改变这里的默认值
  return process.env.AI_MODEL || AI_MODELS.STANDARD  // 改为 Claude Haiku
}
```

---

## 📊 新增功能：使用追踪

升级后，**每次 AI 请求都会记录详细信息**：

### 在服务端日志中查看

启动开发服务器后，每次解梦请求会输出：

```
[Lumi] AI Interpretation Stats: {
  model: 'google/gemini-2.0-flash-thinking-exp:free',
  inputTokens: 152,
  outputTokens: 387,
  totalTokens: 539,
  finishReason: 'stop'
}
```

**含义**:
- `inputTokens`: 输入消耗的 token（你的 prompt）
- `outputTokens`: 输出消耗的 token（AI 的回答）
- `totalTokens`: 总计
- `finishReason`: 
  - `stop` = 正常完成 ✅
  - `length` = 超长被截断 ⚠️
  - `content-filter` = 内容被过滤 ❌

### 在前端获取元数据（可选）

API 现在返回额外信息：

```typescript
const response = await fetch("/api/interpret", {
  method: "POST",
  body: JSON.stringify({ dream }),
})

const data = await response.json()

console.log(data.interpretation)  // AI 解析文本
console.log(data.metadata)         // 使用信息
// {
//   model: "...",
//   usage: { inputTokens, outputTokens, totalTokens },
//   finishReason: "stop"
// }
```

---

## 💰 成本监控

### 免费模型（当前默认）
```
成本: $0 ✅
无需担心！
```

### 付费模型示例

假设平均每次解梦输出 400 tokens：

| 模型 | 每次成本 | 1000次成本 | 10000次成本 |
|------|---------|-----------|------------|
| Gemini Flash (免费) | $0 | $0 | $0 |
| Claude Haiku | $0.002 | $2 | $20 |
| Claude Sonnet | $0.006 | $6 | $60 |
| DeepSeek | $0.00044 | $0.44 | $4.40 |

**计算公式**:
```
成本 = (outputTokens / 1,000,000) × 每百万token价格
```

---

## 🎯 智能功能：动态模型选择

### 场景 1: 按用户等级分配

修改 `app/api/interpret/route.ts`:

```typescript
import { getModelByTier } from "@/lib/ai-config"

// 在 POST 函数中
const userTier = user?.isPremium ? "premium" : "free"
const modelId = getModelByTier(userTier)

const result = await generateText({
  model: openrouter(modelId),
  // ...
})
```

**效果**:
- 免费用户 → Gemini (免费)
- 标准用户 → Claude Haiku ($5/M)
- 高级用户 → Claude Sonnet ($15/M)

### 场景 2: 按梦境复杂度选择

```typescript
import { getModelByComplexity } from "@/lib/ai-config"

const modelId = getModelByComplexity(dream.length, userTier)

const result = await generateText({
  model: openrouter(modelId),
  // ...
})
```

**效果**:
- 短梦境（< 200 字）→ 标准模型
- 长梦境（> 500 字）→ 高级模型（更深入分析）

---

## 🔧 配置文件详解

### `lib/ai-config.ts` 包含：

1. **预定义模型** (`AI_MODELS`)
   - 快速切换，避免拼写错误

2. **模型参数** (`MODEL_PARAMS`)
   - `temperature`: 创意度（0-2，当前 0.7）
   - `topP`: 核采样（当前 0.9）
   - `frequencyPenalty`: 减少重复（当前 0.3）
   - `presencePenalty`: 鼓励新话题（当前 0.1）

3. **智能函数**
   - `getCurrentModel()`: 获取当前模型
   - `getModelByTier()`: 按等级选择
   - `getModelByComplexity()`: 按复杂度选择

4. **元数据** (`MODEL_METADATA`)
   - 模型名称、提供商、成本、速度、质量描述

---

## 🧪 测试建议

### 1. 基础测试
```bash
# 1. 启动服务器
pnpm dev

# 2. 访问 http://localhost:3000

# 3. 输入测试梦境
"I was flying over a beautiful ocean under a starry sky."

# 4. 查看终端日志，确认：
# - 模型 ID 正确
# - token 统计正常
# - finishReason 为 "stop"
```

### 2. 模型切换测试
```bash
# 在 .env.local 中添加
AI_MODEL=anthropic/claude-3.5-haiku

# 重启服务器
# 输入相同梦境，对比输出风格
```

### 3. 成本追踪测试
```bash
# 查看日志中的 outputTokens
# 计算：成本 = outputTokens / 1,000,000 × 价格

# 例如：400 tokens，Claude Haiku ($5/M)
# 成本 = 400 / 1,000,000 × 5 = $0.002
```

---

## 📚 相关文档

| 文档 | 内容 |
|------|------|
| `docs/OPENROUTER_UPGRADE.md` | 详细的升级技术文档 |
| `docs/ENV_SETUP.md` | 环境变量配置指南 |
| `docs/PROJECT_STATUS.md` | 项目当前状态 |
| `docs/OPENROUTER_MIGRATION.md` | 从 OpenAI 迁移指南 |
| `env.example` | 环境变量模板 |

---

## ❓ 常见问题

### Q: 升级后还能用原来的免费模型吗？
**A**: 能！默认就是免费的 Gemini 2.0 Flash Thinking。

### Q: 如何知道当前用的是哪个模型？
**A**: 查看服务器日志，每次请求都会显示 `model: "..."`

### Q: 切换模型需要改代码吗？
**A**: 不需要！只需修改 `.env.local` 中的 `AI_MODEL` 即可。

### Q: 如何查看花费了多少钱？
**A**: 
1. 查看日志中的 `outputTokens`
2. 使用公式计算：`成本 = outputTokens / 1,000,000 × 价格`
3. 或访问 [OpenRouter Dashboard](https://openrouter.ai/activity)

### Q: finishReason 是 "length" 怎么办？
**A**: 说明回答被截断了。解决方法：
1. 优化 prompt 让回答更简洁
2. 或调整模型参数

---

## 🎉 开始使用

就这么简单！

1. ✅ 确保 `.env.local` 有 `OPENROUTER_API_KEY`
2. ✅ （可选）添加 `AI_MODEL` 切换模型
3. ✅ 启动服务器：`pnpm dev`
4. ✅ 访问：http://localhost:3000
5. ✅ 输入梦境，查看魔法发生！✨

---

**Happy Dreaming! 🌙**

