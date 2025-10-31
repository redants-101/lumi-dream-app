/**
 * 用户信息合并接口
 * GET /api/user-info
 * 
 * 功能：一次性获取用户的订阅信息和使用情况
 * 优势：
 * - 减少 API 调用：2 次 → 1 次
 * - 并行查询数据库：提升响应速度
 * - 数据一致性：同一时刻的快照
 */

import { createClient } from "@/lib/supabase/server"
import { getLimits, type UserTier } from "@/lib/usage-limits"
import { successResponse, errorResponse } from "@/lib/services/api-response"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentDay = new Date().toISOString().slice(0, 10)
    
    // 未登录用户：返回 anonymous 默认值
    if (!user) {
      const anonymousLimits = getLimits("anonymous")
      
      return successResponse(
        {
          subscription: {
            tier: "anonymous",
            status: "active",
          },
          usage: {
            daily: 0,
            monthly: 0,
          },
          limits: {
            daily: anonymousLimits.daily,
            monthly: anonymousLimits.monthly,
          },
          remaining: {
            daily: anonymousLimits.daily,
            monthly: anonymousLimits.monthly,
          },
        },
        {
          source: "default",
          userType: "anonymous",
        }
      )
    }
    
    // ✅ 并行查询订阅和使用情况（提升性能）
    const [subscriptionResult, usageResult] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select("*")  // ✅ 查询所有字段（确保完整性）
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("usage_tracking")
        .select("daily_count, monthly_count, day")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .single()
    ])
    
    // 处理订阅数据
    let tier: UserTier = "free"
    let subscription = {
      tier: "free" as UserTier,
      status: "active",
    }
    
    if (subscriptionResult.data && subscriptionResult.data.status === "active") {
      const isNotExpired = !subscriptionResult.data.current_period_end || 
                          new Date(subscriptionResult.data.current_period_end) > new Date()
      if (isNotExpired) {
        tier = subscriptionResult.data.tier as UserTier
        // ✅ 返回完整的订阅数据（确保 Dashboard 兼容）
        subscription = subscriptionResult.data
      }
    }
    
    // 处理使用数据
    const usageData = usageResult.data
    const isDifferentDay = usageData?.day !== currentDay
    const dailyCount = isDifferentDay ? 0 : (usageData?.daily_count || 0)
    const monthlyCount = usageData?.monthly_count || 0
    
    const limits = getLimits(tier)
    
    return successResponse(
      {
        subscription,
        usage: {
          daily: dailyCount,
          monthly: monthlyCount,
        },
        limits: {
          daily: limits.daily,
          monthly: limits.monthly,
        },
        remaining: {
          daily: Math.max(0, limits.daily - dailyCount),
          monthly: Math.max(0, limits.monthly - monthlyCount),
        },
      },
      {
        source: "database",
        userId: user.id,
        currentMonth,
        currentDay,
        tier,
      }
    )
  } catch (error) {
    console.error("[User Info API] Error:", error)
    return errorResponse(
      "Failed to fetch user information",
      500,
      "USER_INFO_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

