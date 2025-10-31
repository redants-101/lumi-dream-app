import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { creemClient } from "@/lib/creem-config"
import { successResponse, errorResponse } from "@/lib/services/api-response"

/**
 * 订阅管理 API
 * GET /api/subscription/manage - 获取订阅信息
 * DELETE /api/subscription/manage - 取消订阅
 */

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse("Unauthorized", 401, "AUTH_REQUIRED")
    }

    // 查询订阅信息
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      // 用户没有订阅，返回免费版
      return successResponse(
        {
          tier: "free",
          status: "active",
        },
        {
          source: "default",
          userId: user.id,
        }
      )
    }

    return successResponse(
      subscription,
      {
        source: "database",
        userId: user.id,
      }
    )
  } catch (error) {
    console.error("[Subscription Error]:", error)
    return errorResponse(
      "Failed to get subscription",
      500,
      "SUBSCRIPTION_ERROR"
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 获取当前用户
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse("Unauthorized", 401, "AUTH_REQUIRED")
    }

    // 查询订阅信息
    const { data: subscription, error: queryError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (queryError || !subscription) {
      return errorResponse(
        "No active subscription found",
        404,
        "SUBSCRIPTION_NOT_FOUND"
      )
    }

    // 调用 Creem API 取消订阅
    if (subscription.creem_subscription_id) {
      await creemClient.cancelSubscription(subscription.creem_subscription_id)
    }

    // 更新本地订阅状态
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    return successResponse(
      {
        message: "Subscription canceled successfully",
        canceledAt: new Date().toISOString(),
      },
      {
        userId: user.id,
        subscriptionId: subscription.creem_subscription_id,
      }
    )
  } catch (error) {
    console.error("[Cancel Subscription Error]:", error)
    return errorResponse(
      "Failed to cancel subscription",
      500,
      "CANCEL_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

