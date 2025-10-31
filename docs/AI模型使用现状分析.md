# AI 模型使用现状分析

**分析日期**: 2025-10-28

---

## 📊 当前四类用户应该使用的 AI 模型

### 配置定义（lib/pricing-config.ts + lib/ai-config.ts）

| 用户类型 | 应使用的模型 | 模型 ID | 提供商 | 成本 |
|---------|------------|---------|--------|------|
| **Anonymous** (未登录) | Gemini 2.0 Flash Exp | `google/gemini-2.0-flash-exp:free` | Google | $0 (免费) |
| **Free** (已登录) | Claude 3.5 Haiku | `anthropic/claude-3.5-haiku` | Anthropic | $5/M tokens |
| **Basic** (付费) | Claude 3.5 Haiku | `anthropic/claude-3.5-haiku` | Anthropic | $5/M tokens |
| **Pro** (高级付费) | Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | Anthropic | $15/M tokens |

---

## ⚠️ 实际实现现状

### 当前代码实现（app/api/interpret/route.ts）

```typescript
// 第 88 行
const modelId = getCurrentModel()  // ❌ 所有用户使用相同模型

// 第 91 行
const result = await generateText({
  model: openrouter(modelId),  // ❌ 没有根据用户层级区分
  // ...
})
```

### getCurrentModel() 函数（lib/ai-config.ts）

```typescript
export function getCurrentModel(): string {
  return process.env.AI_MODEL || AI_MODELS.FREE
  //     ❌ 返回环境变量或默认的 Gemini 免费模型
  //     ❌ 没有接受用户层级参数
}
```

---

## 🔴 问题：所有用户目前使用相同模型

### 实际情况

```
用户请求解梦
    ↓
identify user tier → "pro"（识别为 Pro 用户）
    ↓
getCurrentModel() → "google/gemini-2.0-flash-exp:free"  ❌
    ↓
所有用户（包括 Pro）都用免费的 Gemini
```

**结果**：
- ❌ **Pro 用户支付 $9.99/月，但使用的是免费模型**
- ❌ **Basic 用户支付 $4.99/月，但使用的是免费模型**
- ❌ **付费用户没有获得应有的价值**

---

## ✅ 已有的配置（未被使用）

### 1. lib/ai-config.ts - getModelByTier() 函数

```typescript
export function getModelByTier(tier: SubscriptionTier): string {
  const modelMap: Record<SubscriptionTier, string> = {
    free: AI_MODELS.STANDARD,    // Claude Haiku ✅
    basic: AI_MODELS.STANDARD,   // Claude Haiku ✅
    pro: AI_MODELS.PREMIUM,      // Claude Sonnet ✅
  }
  
  return modelMap[tier] || AI_MODELS.STANDARD
}
```

**问题**: 这个函数定义了，但**从未被调用**！

---

### 2. lib/pricing-config.ts - aiModel 配置

```typescript
PRICING.FREE.aiModel = AI_MODELS.STANDARD      // Claude Haiku
PRICING.BASIC.aiModel = AI_MODELS.STANDARD     // Claude Haiku
PRICING.PRO.aiModel = AI_MODELS.PREMIUM        // Claude Sonnet
PRICING.PRO.fallbackModel = AI_MODELS.STANDARD // 超量后降级
```

**问题**: 这些配置也**从未被使用**！

---

## 💡 应该如何实现

### 方案 1: 使用 getModelByTier()（推荐）

**修改**: `app/api/interpret/route.ts` 第 88 行

```typescript
// ❌ 修改前
const modelId = getCurrentModel()

// ✅ 修改后
import { getModelByTier } from "@/lib/ai-config"

// 获取用户层级（第 39 行已经有了）
let tier: SubscriptionTier = "free"
// ... 查询数据库获取 tier ...

// 根据用户层级选择模型
const modelId = getModelByTier(tier)  // ✅ 正确
```

**效果**:
```typescript
tier = "free"  → modelId = "anthropic/claude-3.5-haiku"
tier = "basic" → modelId = "anthropic/claude-3.5-haiku"
tier = "pro"   → modelId = "anthropic/claude-3.5-sonnet"
```

---

### 方案 2: 使用 getPricingConfig().aiModel

**修改**: `app/api/interpret/route.ts`

```typescript
// 已经有了（第 69 行）
const pricingConfig = getPricingConfig(tier)

// 使用配置中的模型
const modelId = pricingConfig.aiModel  // ✅ 也可以

// 如果是 Pro 且超量，可以降级
if (tier === "pro" && overLimit) {
  modelId = pricingConfig.fallbackModel || AI_MODELS.STANDARD
}
```

---

### 方案 3: 混合方案（最灵活）

```typescript
// 根据梦境复杂度智能选择
import { getModelByComplexity } from "@/lib/ai-config"

const modelId = getModelByComplexity(dream.length, tier)

// 逻辑：
// - Free 用户：始终 Claude Haiku
// - Basic 用户：始终 Claude Haiku
// - Pro 用户：
//   - 梦境 > 500 字符 → Claude Sonnet（高级模型）
//   - 梦境 ≤ 500 字符 → Claude Haiku（节省成本）
```

---

## 🎯 Anonymous 用户的特殊处理

### 问题：Anonymous 应该用 Gemini 免费模型

当前 `getModelByTier()` 只处理了 `free/basic/pro`，没有处理 `anonymous`。

### 解决方案：扩展类型定义

```typescript
// lib/ai-config.ts
export type UserTier = "anonymous" | "free" | "basic" | "pro"

export function getModelByTier(tier: UserTier): string {
  const modelMap: Record<UserTier, string> = {
    anonymous: AI_MODELS.FREE,       // ✅ Gemini（完全免费）
    free: AI_MODELS.STANDARD,        // Claude Haiku
    basic: AI_MODELS.STANDARD,       // Claude Haiku
    pro: AI_MODELS.PREMIUM,          // Claude Sonnet
  }
  
  return modelMap[tier] || AI_MODELS.FREE
}
```

### 在 interpret API 中处理

```typescript
// app/api/interpret/route.ts
let tier: UserTier = "anonymous"  // ✅ 默认未登录

if (user) {
  // 已登录，查询订阅
  tier = subscription?.tier || "free"  // free/basic/pro
} else {
  // 未登录
  tier = "anonymous"  // ✅ 使用 Gemini 免费模型
}

const modelId = getModelByTier(tier)
```

---

## 📊 实现后的效果对比

### 修改前（当前）

| 用户类型 | 支付金额 | 实际使用模型 | 模型成本 | 用户价值 |
|---------|---------|------------|---------|---------|
| Anonymous | $0 | Gemini | $0 | ✅ 合理 |
| Free | $0 | Gemini | $0 | ⚠️ 应该更好 |
| Basic | **$4.99/月** | Gemini ❌ | $0 | ❌ 没价值 |
| Pro | **$9.99/月** | Gemini ❌ | $0 | ❌ 没价值 |

**问题**: 付费用户没有获得应有的 AI 质量！

---

### 修改后（推荐）

| 用户类型 | 支付金额 | 实际使用模型 | 模型成本 | 用户价值 |
|---------|---------|------------|---------|---------|
| Anonymous | $0 | Gemini | $0 | ✅ 免费体验 |
| Free | $0 | Claude Haiku | ~$0.02/次 | ✅ 登录奖励 |
| Basic | $4.99/月 | Claude Haiku ✅ | ~$0.02/次 | ✅ 物有所值 |
| Pro | $9.99/月 | Claude Sonnet ✅ | ~$0.06/次 | ✅ 高端体验 |

**效果**:
- ✅ 付费用户获得更好的 AI 质量
- ✅ 层级差异明显
- ✅ 成本可控（仍有利润）

---

## 💰 成本影响分析

### Free 用户（登录用户）

**修改前**: Gemini (免费)
- 成本: $0

**修改后**: Claude Haiku
- 成本: 10 次/月 × $0.00215 = **$0.0215/用户/月**
- 基础设施: $0.02
- **总成本: $0.0415**（已在 pricing-config.ts 中计算）

**影响**: 
- ⚠️ Free 用户现在亏损 $0.0415/用户/月
- ✅ 但能吸引用户注册，为付费转化做准备

---

### Basic 用户

**修改前**: Gemini (免费)
- 收入: $4.99
- 成本: $0.02 (基础设施)
- 利润: $4.97

**修改后**: Claude Haiku
- 收入: $4.99
- 成本: $0.41 (AI + 基础设施)
- **利润: $4.58** (91.8% 利润率)

**影响**: 
- ⚠️ 利润降低 $4.39
- ✅ 但用户获得更好的价值，续费率提升

---

### Pro 用户

**修改前**: Gemini (免费)
- 收入: $9.99
- 成本: $0.02
- 利润: $9.97

**修改后**: Claude Sonnet
- 收入: $9.99
- 成本: $1.79 (AI + 基础设施)
- **利润: $8.20** (82.1% 利润率)

**影响**:
- ⚠️ 利润降低 $1.77
- ✅ 但提供真正的高端体验

---

## 🚀 实施步骤

### Step 1: 扩展类型定义

```typescript
// lib/ai-config.ts
export type UserTier = "anonymous" | "free" | "basic" | "pro"

export function getModelByTier(tier: UserTier): string {
  const modelMap: Record<UserTier, string> = {
    anonymous: AI_MODELS.FREE,       // Gemini
    free: AI_MODELS.STANDARD,        // Claude Haiku
    basic: AI_MODELS.STANDARD,       // Claude Haiku
    pro: AI_MODELS.PREMIUM,          // Claude Sonnet
  }
  
  return modelMap[tier] || AI_MODELS.FREE
}
```

---

### Step 2: 修改 interpret API

```typescript
// app/api/interpret/route.ts
import { getModelByTier, type UserTier } from "@/lib/ai-config"

export async function POST(request: Request) {
  // ... 现有代码 ...
  
  // 获取用户层级
  let tier: UserTier = "anonymous"  // ✅ 默认未登录
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // 查询订阅
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier, status, current_period_end")
      .eq("user_id", user.id)
      .single()
    
    if (subscription && subscription.status === "active") {
      tier = subscription.tier as UserTier  // free/basic/pro
    } else {
      tier = "free"  // 已登录但无有效订阅
    }
  }
  
  // ✅ 根据用户层级选择模型
  const modelId = getModelByTier(tier)
  
  console.log(`[Interpret] User tier: ${tier}, Model: ${modelId}`)
  
  // 使用选择的模型
  const result = await generateText({
    model: openrouter(modelId),
    prompt: getCurrentPrompt(dream),
    // ...
  })
  
  // ...
}
```

---

### Step 3: 更新返回的 metadata

```typescript
return Response.json({
  interpretation: result.text,
  metadata: {
    userTier: tier,              // ✅ 返回用户层级
    model: modelId,              // ✅ 返回使用的模型
    modelName: MODEL_METADATA[modelId]?.name,  // ✅ 模型名称
    // ...
  },
})
```

---

## 🧪 测试验证

### 测试 1: Anonymous 用户

```bash
# 未登录状态请求
POST /api/interpret
{
  "dream": "I had a dream about flying"
}

# 预期日志
[Interpret] User tier: anonymous, Model: google/gemini-2.0-flash-exp:free

# 预期响应
{
  "interpretation": "...",
  "metadata": {
    "userTier": "anonymous",
    "model": "google/gemini-2.0-flash-exp:free",
    "modelName": "Gemini 2.0 Flash Exp"
  }
}
```

---

### 测试 2: Free 用户

```bash
# 已登录，无付费订阅
POST /api/interpret
{
  "dream": "I had a dream about flying"
}

# 预期日志
[Interpret] User tier: free, Model: anthropic/claude-3.5-haiku

# 预期响应
{
  "metadata": {
    "userTier": "free",
    "model": "anthropic/claude-3.5-haiku",
    "modelName": "Claude 3.5 Haiku"
  }
}
```

---

### 测试 3: Pro 用户

```bash
# 已登录，Pro 订阅
POST /api/interpret
{
  "dream": "I had a dream about flying"
}

# 预期日志
[Interpret] User tier: pro, Model: anthropic/claude-3.5-sonnet

# 预期响应
{
  "metadata": {
    "userTier": "pro",
    "model": "anthropic/claude-3.5-sonnet",
    "modelName": "Claude 3.5 Sonnet"
  }
}
```

---

## 📋 总结

### 当前现状

- ❌ **所有用户使用相同模型**（Gemini 免费或环境变量指定的模型）
- ❌ **付费用户没有获得应有的 AI 质量**
- ❌ **虽然有配置，但未实际实现**

### 需要做的修改

1. ✅ 扩展 `UserTier` 类型（添加 `anonymous`）
2. ✅ 修改 `getModelByTier()` 函数（处理 4 种用户）
3. ✅ 修改 `app/api/interpret/route.ts`（使用 `getModelByTier()`）
4. ✅ 更新返回的 metadata（包含模型信息）

### 预期效果

- ✅ Anonymous 用户: Gemini (免费)
- ✅ Free 用户: Claude Haiku (高质量)
- ✅ Basic 用户: Claude Haiku (高质量)
- ✅ Pro 用户: Claude Sonnet (最高质量)

---

**优先级**: 🔴 **极高**  
**原因**: 付费用户目前没有获得应有的价值  
**预计工作量**: 30 分钟  
**建议**: 立即实施

