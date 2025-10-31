/**
 * 梦境解析 API
 * 使用服务层架构，确保代码清晰和可维护
 */

import { getUserAuth, getUserIP } from "@/lib/services/auth-service"
import { 
  validateAnonymousUsage, 
  validateUserUsage,
  recordAnonymousUsage,
  recordUserUsage 
} from "@/lib/services/usage-service"
import { 
  validateDreamInput, 
  validateDreamLength, 
  validateApiConfig 
} from "@/lib/services/validation-service"
import { generateDreamInterpretation } from "@/lib/services/ai-service"
import { successResponse, errorResponse } from "@/lib/services/api-response"

export async function POST(request: Request) {
  try {
    // === 步骤 1：解析请求 ===
    const { dream } = await request.json()

    // === 步骤 2：验证输入 ===
    const inputValidation = validateDreamInput(dream)
    if (!inputValidation.valid) {
      return errorResponse(
        inputValidation.error!.message,
        400,
        "INVALID_INPUT",
        inputValidation.error!.details
      )
    }
    
    // === 步骤 3：验证 API 配置 ===
    const apiValidation = validateApiConfig()
    if (!apiValidation.valid) {
      return errorResponse(
        apiValidation.error!.message,
        500,
        "CONFIG_ERROR",
        apiValidation.error!.details
      )
    }
    
    // === 步骤 4：获取用户认证状态 ===
    const auth = await getUserAuth()
    
    // === 步骤 5：验证梦境长度 ===
    const lengthValidation = validateDreamLength(dream, auth.tier)
    if (!lengthValidation.valid) {
      return errorResponse(
        lengthValidation.error!.message,
        400,
        "DREAM_TOO_LONG",
        lengthValidation.error!.details
      )
    }
    
    // === 步骤 6：验证使用限制 ===
    let usageValidation
    let usageData
    let ip: string | undefined  // 用于匿名用户的 IP 地址（复用，避免重复获取）
    
    if (auth.isAuthenticated && auth.userId) {
      // 已登录用户验证
      usageValidation = await validateUserUsage(auth.userId, auth.tier)
    } else {
      // 匿名用户验证（IP 限流）
      ip = await getUserIP()
      usageValidation = await validateAnonymousUsage(ip)
    }
    
    if (!usageValidation.allowed) {
      return errorResponse(
        usageValidation.error!.message,
        429,
        "RATE_LIMIT_EXCEEDED",
        usageValidation.error!.details
      )
    }
    
    // ✅ 确保 usageData 存在（类型安全）
    usageData = usageValidation.usageData
    if (!usageData) {
      console.error("[Interpret API] ❌ Missing usageData after validation")
      return errorResponse(
        "Usage data is missing",
        500,
        "INTERNAL_ERROR"
      )
    }
    
    // === 步骤 7：生成 AI 解析 ===
    const result = await generateDreamInterpretation(dream, auth.tier, usageData)
    
    // === 步骤 8：记录使用次数 ===
    if (auth.isAuthenticated && auth.userId) {
      await recordUserUsage(auth.userId)
    } else {
      // 复用步骤 6 中获取的 IP 地址
      await recordAnonymousUsage(ip!)
    }
    
    // === 步骤 9：更新使用数据（使用后）===
    // ✅ 关键修复：记录使用次数后，返回最新的使用情况
    const updatedUsageData = {
      daily: usageData.daily + 1,
      monthly: usageData.monthly + 1,
      limits: usageData.limits,
    }
    
    // === 步骤 10：返回成功响应 ===
    return successResponse(
      {
        interpretation: result.interpretation,
      },
      {
        // 元数据供前端使用
        ...result.metadata,
        currentUsage: updatedUsageData,  // ✅ 返回使用后的最新数据
      }
    )
    
  } catch (error) {
    console.error("[Interpret API] Error:", error)
    
    // 提供友好的错误信息
    const errorMessage =
      error instanceof Error 
        ? error.message 
        : "Failed to interpret dream. Please try again."
    
    return errorResponse(
      "We couldn't process your dream at this moment. Please try again later.",
      500,
      "INTERNAL_ERROR",
      {
        originalError: errorMessage,
      }
    )
  }
}
