# 🚀 OpenRouter 官方包升级指南

> 从兼容模式（`@ai-sdk/openai`）升级到官方包（`@openrouter/ai-sdk-provider`）

**升级时间**: 2025年10月15日  
**状态**: ✅ 已完成

---

## 📊 升级概览

### 变更内容

| 项目 | 之前（兼容模式） | 现在（官方包） |
|------|----------------|---------------|
| **依赖包** | `@ai-sdk/openai` | `@openrouter/ai-sdk-provider` |
| **导入方式** | `createOpenAI` | `createOpenRouter` |
| **baseURL** | 需要手动指定 | 自动配置 |
| **配置文件** | 无 | `lib/ai-config.ts` |
| **模型配置** | 硬编码 | 外部配置/环境变量 |
| **返回信息** | 仅 text | 完整的 usage、finishReason |

---

## 🎯 升级原因

### 1. **官方支持更好**
- OpenRouter 官方维护，优先获得新特性
- 更好的类型定义和错误处理
- 自动处理 OpenRouter 特定配置

### 2. **配置更简洁**
```typescript
// ❌ 之前（需要手动配置 baseURL）
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",  // 容易出错
  apiKey: process.env.OPENROUTER_API_KEY,
})

// ✅ 现在（自动配置）
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,  // 更简洁
})
```

### 3. **外部模型配置**
- 模型 ID 从配置文件读取
- 支持环境变量切换
- 便于 A/B 测试和分层服务

### 4. **完整的使用信息**
- 获取详细的 token 使用量
- 追踪成本和性能
- 监控 finishReason（停止原因）

---

## 📝 技术实现详解

### 1. 新的 AI 配置文件

**文件**: `lib/ai-config.ts`

这个文件集中管理所有 AI 相关配置：

```typescript
// 预定义的模型配置
export const AI_MODELS = {
  FREE: "google/gemini-2.0-flash-thinking-exp:free",
  STANDARD: "anthropic/claude-3.5-haiku",
  PREMIUM: "anthropic/claude-3.5-sonnet",
  CHINESE: "deepseek/deepseek-chat",
  EXPERT: "perplexity/llama-3.1-sonar-large-128k-online",
}

// 获取当前模型（优先环境变量）
export function getCurrentModel(): string {
  return process.env.AI_MODEL || AI_MODELS.FREE
}

// 模型参数配置
export const MODEL_PARAMS = {
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.1,
}
```

**优势**:
- ✅ 集中管理，易于维护
- ✅ 类型安全
- ✅ 支持智能路由（按用户等级、梦境复杂度选择模型）

### 2. 升级后的 API 路由

**文件**: `app/api/interpret/route.ts`

#### 核心变化：

**导入方式**:
```typescript
// ❌ 之前
import { createOpenAI } from "@ai-sdk/openai"

// ✅ 现在
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { getCurrentModel, MODEL_PARAMS } from "@/lib/ai-config"
```

**Provider 创建**:
```typescript
// ✅ 使用官方包
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://lumi-dreams.app",
    "X-Title": "Lumi Dream Interpreter",
  },
})
```

**完整的 generateText 调用**:
```typescript
const result = await generateText({
  model: openrouter(getCurrentModel()),  // 从配置读取
  prompt: `...`,
  // 使用配置文件中的参数
  temperature: MODEL_PARAMS.temperature,
  topP: MODEL_PARAMS.topP,
  frequencyPenalty: MODEL_PARAMS.frequencyPenalty,
  presencePenalty: MODEL_PARAMS.presencePenalty,
})

// 记录详细使用信息
console.log("[Lumi] AI Interpretation Stats:", {
  model: getCurrentModel(),
  inputTokens: result.usage.inputTokens,      // 输入 token 数
  outputTokens: result.usage.outputTokens,    // 输出 token 数
  totalTokens: result.usage.totalTokens,      // 总 token 数
  finishReason: result.finishReason,          // 结束原因
})
```

**返回完整信息给前端**:
```typescript
return Response.json({
  interpretation: result.text,
  metadata: {
    model: getCurrentModel(),
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
    },
    finishReason: result.finishReason,
  },
})
```

---

## 🔧 使用方法

### 方式 1: 使用默认免费模型

无需任何配置，默认使用 Gemini 2.0 Flash Thinking (免费)

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 方式 2: 通过环境变量切换模型

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_MODEL=anthropic/claude-3.5-haiku  # 切换到 Claude
```

### 方式 3: 修改配置文件默认值

修改 `lib/ai-config.ts`:

```typescript
export function getCurrentModel(): string {
  return process.env.AI_MODEL || AI_MODELS.STANDARD  // 改为 STANDARD
}
```

### 方式 4: 实现智能路由

在 `route.ts` 中根据条件选择模型：

```typescript
import { getModelByComplexity, getModelByTier } from "@/lib/ai-config"

// 根据梦境长度智能选择
const modelId = getModelByComplexity(dream.length, userTier)

// 或根据用户等级
const modelId = getModelByTier(user.isPremium ? "premium" : "free")

const result = await generateText({
  model: openrouter(modelId),
  // ...
})
```

---

## 📊 使用信息详解

### Token 使用量

升级后可以获取详细的 token 统计：

```typescript
{
  inputTokens: 152,    // 输入消耗
  outputTokens: 387,   // 输出消耗
  totalTokens: 539     // 总计
}
```

**用途**:
- 💰 **成本计算**: `cost = (outputTokens / 1_000_000) * pricePerMillion`
- 📊 **性能监控**: 追踪平均 token 使用量
- 🔍 **优化提示词**: 分析哪些 prompt 更高效

### Finish Reason

了解 AI 生成为何停止：

| finishReason | 含义 | 处理建议 |
|--------------|------|---------|
| `stop` | 正常完成 | ✅ 无需处理 |
| `length` | 达到最大长度 | ⚠️ 可能被截断，考虑增加长度限制 |
| `content-filter` | 内容过滤 | ❌ 检查输入内容 |
| `tool-calls` | 工具调用 | 🔧 处理工具调用结果 |

**示例应用**:
```typescript
if (result.finishReason === "length") {
  console.warn("[Lumi] Response truncated, consider adjusting prompt")
}
```

---

## 💰 成本追踪示例

### 实时成本计算

```typescript
import { MODEL_METADATA } from "@/lib/ai-config"

const modelId = getCurrentModel()
const costPerMillion = MODEL_METADATA[modelId]?.cost || 0

const cost = (result.usage.outputTokens / 1_000_000) * costPerMillion

console.log(`[Lumi] Request cost: $${cost.toFixed(6)}`)
```

### 聚合统计

可以在数据库中记录每次请求的使用量：

```typescript
// 伪代码
await db.usage.create({
  modelId,
  inputTokens: result.usage.inputTokens,
  outputTokens: result.usage.outputTokens,
  cost: calculateCost(result.usage, modelId),
  timestamp: new Date(),
})

// 月度统计
const monthlyCost = await db.usage.aggregate({
  where: { timestamp: { gte: startOfMonth } },
  sum: { cost: true },
})
```

---

## 🎯 高级功能

### 1. 多模型对比测试

```typescript
const models = [
  "google/gemini-2.0-flash-thinking-exp:free",
  "anthropic/claude-3.5-haiku",
  "deepseek/deepseek-chat",
]

const results = await Promise.all(
  models.map(modelId =>
    generateText({
      model: openrouter(modelId),
      prompt: dream,
    })
  )
)

// 对比质量、速度、成本
results.forEach((result, i) => {
  console.log(`Model ${models[i]}:`, {
    length: result.text.length,
    tokens: result.usage.totalTokens,
    finishReason: result.finishReason,
  })
})
```

### 2. 自适应参数调整

```typescript
// 根据模型类型调整参数
const params = modelId.includes("claude")
  ? { temperature: 0.8, topP: 0.95 }  // Claude 更有创意
  : { temperature: 0.7, topP: 0.9 }   // Gemini 稳定

const result = await generateText({
  model: openrouter(modelId),
  prompt: dream,
  ...params,
})
```

### 3. 回退机制

```typescript
async function interpretWithFallback(dream: string) {
  const models = [
    AI_MODELS.PREMIUM,   // 尝试高级模型
    AI_MODELS.STANDARD,  // 回退到标准
    AI_MODELS.FREE,      // 最后免费
  ]

  for (const modelId of models) {
    try {
      return await generateText({
        model: openrouter(modelId),
        prompt: dream,
      })
    } catch (error) {
      console.error(`Failed with ${modelId}, trying next...`)
    }
  }

  throw new Error("All models failed")
}
```

---

## 📚 配置文件完整 API

### `getCurrentModel()`
获取当前使用的模型（优先环境变量）

```typescript
const modelId = getCurrentModel()
// => "google/gemini-2.0-flash-thinking-exp:free"
```

### `getModelByTier(tier)`
根据用户等级选择模型

```typescript
const modelId = getModelByTier("premium")
// => "anthropic/claude-3.5-sonnet"
```

### `getModelByComplexity(length, tier)`
根据梦境复杂度智能选择

```typescript
const modelId = getModelByComplexity(dream.length, "standard")
// 长梦境 => "anthropic/claude-3.5-haiku"
// 短梦境 => "anthropic/claude-3.5-haiku"
```

### `MODEL_METADATA`
模型元数据（用于展示和成本计算）

```typescript
const metadata = MODEL_METADATA[AI_MODELS.STANDARD]
console.log(metadata)
// {
//   name: "Claude 3.5 Haiku",
//   provider: "Anthropic",
//   cost: 5,
//   speed: "very-fast",
//   quality: "excellent",
//   description: "温暖心理分析风格，性价比最高"
// }
```

---

## 🐛 故障排除

### Q: 提示 "Cannot find module '@openrouter/ai-sdk-provider'"

A: 重新安装依赖：
```bash
npm install @openrouter/ai-sdk-provider --legacy-peer-deps
```

### Q: TypeScript 报错 "Property 'inputTokens' does not exist"

A: 确保使用正确的属性名：
- ✅ `inputTokens`（新）
- ❌ `promptTokens`（旧）

### Q: 如何临时切换模型测试？

A: 修改 `.env.local`:
```bash
AI_MODEL=anthropic/claude-3.5-haiku
```
然后重启开发服务器。

### Q: 成本如何计算？

A: 使用公式：
```typescript
cost = (outputTokens / 1_000_000) * MODEL_METADATA[modelId].cost
```

---

## ✅ 升级检查清单

- [x] 安装 `@openrouter/ai-sdk-provider`
- [x] 创建 `lib/ai-config.ts` 配置文件
- [x] 修改 `route.ts` 使用 `createOpenRouter`
- [x] 使用完整的 `generateText` 返回值
- [x] 添加 usage 和 finishReason 日志
- [x] 更新 `env.example` 添加 `AI_MODEL` 配置
- [x] 测试模型切换功能
- [x] 验证 token 统计正确性

---

## 🎓 总结

### 升级带来的好处

1. **更专业**: 使用 OpenRouter 官方包
2. **更灵活**: 外部配置文件管理模型
3. **更透明**: 完整的使用信息追踪
4. **更智能**: 支持动态模型路由
5. **更易维护**: 集中化配置管理

### 下一步建议

1. 实现基于用户等级的模型分层
2. 添加成本追踪和预算告警
3. 实现 A/B 测试对比不同模型质量
4. 根据 finishReason 优化 prompt
5. 添加模型性能监控仪表板

---

**升级状态**: ✅ 完成并测试  
**文档更新**: ✅ 完成  
**生产就绪**: ⏳ 待测试

🌙 升级完成！享受更强大的 AI 解梦功能！✨

