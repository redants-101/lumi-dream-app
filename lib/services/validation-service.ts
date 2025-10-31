/**
 * 验证服务
 * 处理输入验证和业务逻辑验证
 */

import { getPricingConfig, type SubscriptionTier } from "@/lib/pricing-config"
import type { UserTier } from "@/lib/ai-config"

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  error?: {
    message: string
    details?: any
  }
}

/**
 * 验证梦境描述
 */
export function validateDreamInput(dream: any): ValidationResult {
  if (!dream || typeof dream !== "string") {
    return {
      valid: false,
      error: {
        message: "Dream description is required",
        details: {
          expectedType: "string",
          receivedType: typeof dream,
        },
      },
    }
  }
  
  if (dream.trim().length === 0) {
    return {
      valid: false,
      error: {
        message: "Dream description cannot be empty",
      },
    }
  }
  
  return { valid: true }
}

/**
 * 验证梦境长度
 */
export function validateDreamLength(
  dream: string,
  tier: UserTier
): ValidationResult {
  // Anonymous 使用 free 的配置
  const tierForConfig = (tier === "anonymous" ? "free" : tier) as SubscriptionTier
  const pricingConfig = getPricingConfig(tierForConfig)
  const maxDreamLength = pricingConfig.limits.maxDreamLength
  
  if (dream.length > maxDreamLength) {
    console.warn(`[ValidationService] Dream length (${dream.length}) exceeds limit (${maxDreamLength}) for tier: ${tier}`)
    
    return {
      valid: false,
      error: {
        message: `Dream description is too long. ${tier.charAt(0).toUpperCase() + tier.slice(1)} users can use up to ${maxDreamLength} characters. Please upgrade for longer dreams.`,
        details: {
          maxLength: maxDreamLength,
          currentLength: dream.length,
          userTier: tier,
          upgradeAvailable: tier !== "pro",
        },
      },
    }
  }
  
  console.log(`[ValidationService] Dream length validation passed: ${dream.length}/${maxDreamLength} characters (${tier})`)
  return { valid: true }
}

/**
 * 验证 API Key 配置
 */
export function validateApiConfig(): ValidationResult {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ValidationService] OpenRouter API Key is not configured")
    return {
      valid: false,
      error: {
        message: "AI service is not configured. Please contact support.",
        details: {
          missingConfig: "OPENROUTER_API_KEY",
        },
      },
    }
  }
  
  return { valid: true }
}

