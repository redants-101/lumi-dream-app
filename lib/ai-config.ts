/**
 * AI 模型配置文件
 * 集中管理所有 AI 相关配置
 */

// ===================================
// 模型配置
// ===================================

export const AI_MODELS = {
  // 免费模型（MVP 阶段）
  FREE: "google/gemini-2.0-flash-exp:free",
  
  // 标准付费模型（温暖心理分析风格）
  STANDARD: "anthropic/claude-3.5-haiku",
  
  // 高级付费模型（最强同理心）
  PREMIUM: "anthropic/claude-3.5-sonnet",
  
  // 中文优化模型
  CHINESE: "deepseek/deepseek-chat",
  
  // 专家模型（联网搜索）
  EXPERT: "perplexity/llama-3.1-sonar-large-128k-online",
} as const

// ===================================
// 当前使用的模型
// ===================================

/**
 * 获取当前环境使用的模型
 * 优先级：环境变量 > 默认免费模型
 */
export function getCurrentModel(): string {
  return process.env.AI_MODEL || AI_MODELS.FREE
}

// ===================================
// 模型参数配置
// ===================================

export const MODEL_PARAMS = {
  // 温度参数（0-2，越高越有创意）
  temperature: 0.7,
  
  // Top-P 采样（核采样）
  topP: 0.9,
  
  // 频率惩罚（减少重复）
  frequencyPenalty: 0.3,
  
  // 存在惩罚（鼓励新话题）
  presencePenalty: 0.1,
} as const

// ===================================
// 根据用户等级选择模型
// ===================================

export type UserTier = "free" | "standard" | "premium"

export function getModelByTier(tier: UserTier): string {
  const modelMap: Record<UserTier, string> = {
    free: AI_MODELS.FREE,
    standard: AI_MODELS.STANDARD,
    premium: AI_MODELS.PREMIUM,
  }
  
  return modelMap[tier] || AI_MODELS.FREE
}

// ===================================
// 根据梦境复杂度智能选择模型
// ===================================

export function getModelByComplexity(dreamLength: number, userTier: UserTier = "free"): string {
  // 免费用户始终使用免费模型
  if (userTier === "free") {
    return AI_MODELS.FREE
  }
  
  // 付费用户根据梦境长度智能选择
  if (dreamLength > 500) {
    // 复杂长梦境使用高级模型
    return userTier === "premium" ? AI_MODELS.PREMIUM : AI_MODELS.STANDARD
  }
  
  // 简单梦境使用标准模型
  return AI_MODELS.STANDARD
}

// ===================================
// 模型元数据（用于展示和计费）
// ===================================

export const MODEL_METADATA = {
  [AI_MODELS.FREE]: {
    name: "Gemini 2.0 Flash Exp",
    provider: "Google",
    cost: 0,
    speed: "fast",
    quality: "good",
    description: "完全免费，适合 MVP 测试",
  },
  [AI_MODELS.STANDARD]: {
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    cost: 5, // $ per million tokens (output)
    speed: "very-fast",
    quality: "excellent",
    description: "温暖心理分析风格，性价比最高",
  },
  [AI_MODELS.PREMIUM]: {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    cost: 15,
    speed: "medium",
    quality: "outstanding",
    description: "最强同理心，高端体验",
  },
  [AI_MODELS.CHINESE]: {
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    cost: 1.1,
    speed: "fast",
    quality: "excellent",
    description: "中文优化，适合中文市场",
  },
  [AI_MODELS.EXPERT]: {
    name: "Perplexity Sonar",
    provider: "Perplexity",
    cost: 5,
    speed: "medium",
    quality: "excellent",
    description: "联网搜索，引用最新心理学研究",
  },
} as const

