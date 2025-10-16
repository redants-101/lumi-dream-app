import { generateText } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { getCurrentModel, MODEL_PARAMS } from "@/lib/ai-config"
import { getCurrentPrompt, PROMPT_VERSION } from "@/lib/prompts"

// 配置 OpenRouter 官方 Provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  // 可选：添加应用标识以在 OpenRouter 排行榜上显示
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app",
    "X-Title": "Lumi Dream Interpreter",
  },
})

export async function POST(request: Request) {
  try {
    const { dream } = await request.json()

    if (!dream || typeof dream !== "string") {
      return Response.json({ error: "Dream description is required" }, { status: 400 })
    }

    // 检查 API Key 是否配置
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("[Lumi] OpenRouter API Key is not configured")
      return Response.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 500 }
      )
    }

    // 获取当前配置的模型（从环境变量或配置文件）
    const modelId = getCurrentModel()
    
    // 使用集中管理的提示词（支持版本控制和 A/B 测试）
    const result = await generateText({
      model: openrouter(modelId),
      prompt: getCurrentPrompt(dream),
      // 使用配置文件中的参数
      temperature: MODEL_PARAMS.temperature,
      topP: MODEL_PARAMS.topP,
      frequencyPenalty: MODEL_PARAMS.frequencyPenalty,
      presencePenalty: MODEL_PARAMS.presencePenalty,
    })

    // 记录 AI 使用情况（用于监控和成本追踪）
    console.log("[Lumi] AI Interpretation Stats:", {
      model: modelId,
      promptVersion: PROMPT_VERSION,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
      finishReason: result.finishReason,
    })

    // 返回完整信息
    return Response.json({
      interpretation: result.text,
      // 可选：返回元数据供前端使用
      metadata: {
        model: modelId,
        promptVersion: PROMPT_VERSION,
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        },
        finishReason: result.finishReason,
      },
    })
  } catch (error) {
    console.error("[Lumi] Error in dream interpretation:", error)
    
    // 提供更友好的错误信息
    const errorMessage =
      error instanceof Error ? error.message : "Failed to interpret dream. Please try again."
    
    return Response.json(
      { error: "We couldn't process your dream at this moment. Please try again later." },
      { status: 500 }
    )
  }
}
