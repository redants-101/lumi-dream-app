import { createClient } from "@/lib/supabase/server"
import { getLimits, type UserTier } from "@/lib/usage-limits"
import { successResponse, errorResponse } from "@/lib/services/api-response"

/**
 * 获取用户真实使用次数
 * GET /api/usage
 * 
 * 返回：
 * - 用户层级
 * - 日/月使用次数
 * - 日/月限制
 * - 剩余次数
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentDay = new Date().toISOString().slice(0, 10)
    
    if (!user) {
      // Anonymous 用户：返回默认值（localStorage 处理）
      const anonymousLimits = getLimits("anonymous")  // ✅ 从配置获取
      
      return successResponse(
        {
          tier: "anonymous",
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
        }
      )
    }
    
    // 查询用户订阅层级
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier, status, current_period_end")
      .eq("user_id", user.id)
      .single()
    
    let tier: UserTier = "free"
    
    if (subscription && subscription.status === "active") {
      const isNotExpired = !subscription.current_period_end || 
                          new Date(subscription.current_period_end) > new Date()
      if (isNotExpired) {
        tier = subscription.tier as UserTier
      }
    }
    
    // 查询使用次数
    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("daily_count, monthly_count, day")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single()
    
    // 检查是否需要重置日计数
    const isDifferentDay = usage?.day !== currentDay
    const dailyCount = isDifferentDay ? 0 : (usage?.daily_count || 0)
    const monthlyCount = usage?.monthly_count || 0
    
    const limits = getLimits(tier)
    
    return successResponse(
      {
        tier,
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
      }
    )
  } catch (error) {
    console.error("[Usage API] Error:", error)
    return errorResponse(
      "Failed to fetch usage data",
      500,
      "USAGE_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

