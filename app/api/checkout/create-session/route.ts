import { NextRequest } from "next/server"
import { creemClient, getCreemProductId, CREEM_CONFIG } from "@/lib/creem-config"
import { createClient } from "@/lib/supabase/server"
import { successResponse, errorResponse } from "@/lib/services/api-response"

/**
 * 创建 Creem 结账会话
 * POST /api/checkout/create-session
 */
export async function POST(request: NextRequest) {
  try {
    const { tier, billingCycle } = await request.json()
    
    console.log("\n🚀 [Checkout] New request:", { tier, billingCycle })

    // 验证参数
    if (!tier || !billingCycle) {
      console.error("❌ [Checkout] Missing required parameters")
      return errorResponse(
        "Missing tier or billingCycle",
        400,
        "INVALID_PARAMETERS"
      )
    }

    if (tier === "free") {
      return errorResponse(
        "Free tier does not require checkout",
        400,
        "INVALID_TIER"
      )
    }

    if (!["basic", "pro"].includes(tier)) {
      return errorResponse(
        "Invalid tier",
        400,
        "INVALID_TIER"
      )
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return errorResponse(
        "Invalid billing cycle",
        400,
        "INVALID_BILLING_CYCLE"
      )
    }

    // 获取当前用户
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    console.log("👤 [Checkout] User:", user ? user.email : "Not authenticated")

    // ✅ 强制要求用户登录
    if (!user) {
      console.error("❌ [Checkout] User not authenticated")
      return errorResponse(
        "Please sign in to subscribe",
        401,
        "AUTH_REQUIRED"
      )
    }
    
    console.log("✅ [Checkout] User authenticated:", user.id)

    // 获取产品 ID
    const productId = getCreemProductId(tier, billingCycle)
    console.log("🏷️ [Checkout] Product ID:", productId)

    // 创建结账会话
    const session = await creemClient.createCheckoutSession({
      product_id: productId,
      success_url: CREEM_CONFIG.successUrl,
      metadata: {
        user_id: user.id,        // ✅ 现在保证有值
        user_email: user.email || "",
        tier,
        billing_cycle: billingCycle,
      },
    })

    console.log("[Checkout] Session created:", session.id)

    return successResponse(
      {
        sessionId: session.id,
        checkoutUrl: session.checkout_url,
      },
      {
        userId: user.id,
        tier,
        billingCycle,
        productId,
      }
    )
  } catch (error) {
    console.error("[Checkout Error]:", error)
    return errorResponse(
      "Failed to create checkout session",
      500,
      "CHECKOUT_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

