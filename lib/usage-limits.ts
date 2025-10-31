/**
 * 使用限制配置
 * 定义每日和每月的双重限制 + AI 模型配置
 */

import { AI_MODELS } from "./ai-config"

export type UserTier = "anonymous" | "free" | "basic" | "pro"

/**
 * 使用限制配置
 * 每个层级都有每日、每月限制 + AI 模型配置 + 双重提醒阈值
 */
export const USAGE_LIMITS = {
  // 未登录用户
  anonymous: {
    daily: 2,                    // 每天 2 次
    monthly: 4,                  // 每月 4 次
    model: AI_MODELS.STANDARD,   // ✅ Claude Haiku（优质免费体验）
    warningThresholds: {
      daily: {
        gentle: 1,               // 日剩余 1 次时提醒（50%）
      },
      monthly: {
        gentle: 2,               // 月剩余 2 次时温和提醒（50%）
        urgent: 1,               // 月剩余 1 次时紧急提醒（75%）
      },
    },
  },
  
  // 已登录免费用户
  free: {
    daily: 5,                    // 每天 5 次
    monthly: 10,                 // 每月 10 次
    model: AI_MODELS.STANDARD,   // ✅ Claude Haiku（登录奖励）
    warningThresholds: {
      daily: {
        gentle: 2,               // 日剩余 2 次时提醒（60%）
        urgent: 1,               // 日剩余 1 次时提醒（80%）
      },
      monthly: {
        gentle: 5,               // 月剩余 5 次时温和提醒（50%）
        urgent: 2,               // 月剩余 2 次时紧急提醒（80%）
      },
    },
  },
  
  // Basic 付费用户
  basic: {
    daily: 10,                   // 每天 10 次
    monthly: 50,                 // 每月 50 次
    model: AI_MODELS.STANDARD,   // ✅ Claude Haiku（性价比）
    warningThresholds: {
      daily: {
        gentle: 5,               // 日剩余 5 次时提醒（50%）
        urgent: 2,               // 日剩余 2 次时提醒（80%）
      },
      monthly: {
        gentle: 25,              // 月剩余 25 次时温和提醒（50%）
        urgent: 10,              // 月剩余 10 次时紧急提醒（80%）
      },
    },
  },
  
  // Pro 付费用户
  pro: {
    daily: 20,                   // 每天 20 次
    monthly: 200,                // 每月 200 次
    model: AI_MODELS.PREMIUM,    // ✅ Claude Sonnet（高端体验）
    fallbackModel: AI_MODELS.STANDARD,  // ✅ 超过降级点后降级
    downgradeThreshold: 100,     // ✅ 降级阈值：使用 100 次后降级
    warningThresholds: {
      daily: {
        gentle: 10,              // 日剩余 10 次时提醒（50%）
        urgent: 4,               // 日剩余 4 次时提醒（80%）
      },
      monthly: {
        gentle: 100,             // 月剩余 100 次时温和提醒（50%）✨ 同时是降级点
        urgent: 40,              // 月剩余 40 次时紧急提醒（80%）
      },
    },
  },
} as const

/**
 * 获取用户层级的限制配置（包含模型配置）
 */
export function getLimits(tier: UserTier) {
  return USAGE_LIMITS[tier] || USAGE_LIMITS.anonymous
}

/**
 * 获取用户层级的 AI 模型
 */
export function getModelForTier(tier: UserTier): string {
  const limits = getLimits(tier)
  return limits.model
}

/**
 * 获取 Pro 用户的降级模型
 */
export function getFallbackModel(tier: UserTier): string | undefined {
  if (tier === "pro") {
    return USAGE_LIMITS.pro.fallbackModel
  }
  return undefined
}

/**
 * 获取 Pro 用户的降级阈值
 */
export function getDowngradeThreshold(tier: UserTier): number | undefined {
  if (tier === "pro") {
    return USAGE_LIMITS.pro.downgradeThreshold
  }
  return undefined
}

/**
 * 获取用户层级的提醒阈值
 */
export function getWarningThresholds(tier: UserTier) {
  const limits = getLimits(tier)
  return limits.warningThresholds || { 
    daily: { gentle: 2, urgent: 1 },
    monthly: { gentle: 5, urgent: 2 }
  }
}

/**
 * 获取限制描述文本
 */
export function getLimitDescription(tier: UserTier): {
  daily: string
  monthly: string
} {
  const limits = getLimits(tier)
  
  return {
    daily: `${limits.daily} interpretations per day`,
    monthly: `${limits.monthly} interpretations per month`,
  }
}

