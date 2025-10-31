/**
 * AI 服务
 * 处理 AI 模型选择和文本生成
 */

import { generateText } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { MODEL_PARAMS } from "@/lib/ai-config"
import { getCurrentPrompt, PROMPT_VERSION } from "@/lib/prompts"
import { getModelForTier, getFallbackModel, getDowngradeThreshold, type UserTier } from "@/lib/usage-limits"
import type { UsageData } from "./usage-service"

/**
 * 配置 OpenRouter 官方 Provider
 */
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app",
    "X-Title": "Lumi Dream Interpreter",
  },
})

/**
 * AI 解析结果
 */
export interface InterpretationResult {
  interpretation: string
  metadata: {
    userTier: UserTier
    model: string
    isDowngraded: boolean
    promptVersion: string
    usage: {
      inputTokens: number
      outputTokens: number
      totalTokens: number
    }
    finishReason: string
  }
}

/**
 * 选择 AI 模型（包含降级逻辑）
 */
export function selectModel(
  tier: UserTier,
  usageData?: UsageData
): { modelId: string; isDowngraded: boolean } {
  let modelId = getModelForTier(tier)
  let isDowngraded = false
  
  // Pro 用户降级判断
  if (tier === "pro" && usageData) {
    const downgradeThreshold = getDowngradeThreshold(tier) || 100
    
    if (usageData.monthly >= downgradeThreshold) {
      const fallback = getFallbackModel(tier)
      if (fallback) {
        modelId = fallback
        isDowngraded = true
        console.log(
          `[AIService] 🔄 Pro user downgraded (${usageData.monthly}/200 used, threshold: ${downgradeThreshold}) → ${modelId}`
        )
      }
    } else if (usageData.monthly > 0) {
      console.log(
        `[AIService] 🚀 Pro user using premium model (${usageData.monthly}/${downgradeThreshold})`
      )
    }
  } else {
    console.log(`[AIService] 🤖 User tier: ${tier} → Model: ${modelId}`)
  }
  
  return { modelId, isDowngraded }
}

/**
 * 生成梦境解析
 */
export async function generateDreamInterpretation(
  dream: string,
  tier: UserTier,
  usageData?: UsageData
): Promise<InterpretationResult> {
  const { modelId, isDowngraded } = selectModel(tier, usageData)
  
  // 使用集中管理的提示词
  const result = await generateText({
    model: openrouter(modelId),
    prompt: getCurrentPrompt(dream),
    temperature: MODEL_PARAMS.temperature,
    topP: MODEL_PARAMS.topP,
    frequencyPenalty: MODEL_PARAMS.frequencyPenalty,
    presencePenalty: MODEL_PARAMS.presencePenalty,
  })
  
  // 记录 AI 使用情况
  console.log("[AIService] AI Interpretation Stats:", {
    userTier: tier,
    model: modelId,
    isDowngraded: isDowngraded,
    promptVersion: PROMPT_VERSION,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    totalTokens: result.usage.totalTokens,
    finishReason: result.finishReason,
  })
  
  return {
    interpretation: result.text,
    metadata: {
      userTier: tier,
      model: modelId,
      isDowngraded: isDowngraded,
      promptVersion: PROMPT_VERSION,
      usage: {
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
        totalTokens: result.usage.totalTokens || 0,
      },
      finishReason: result.finishReason,
    },
  }
}

