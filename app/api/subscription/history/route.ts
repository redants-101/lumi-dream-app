import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { successResponse, errorResponse } from "@/lib/services/api-response"

/**
 * 订阅历史记录 API
 * GET /api/subscription/history - 获取用户的订阅历史
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

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // 可选：过滤事件类型

    console.log(`[History API] Fetching history for user ${user.id}, limit: ${limit}, offset: ${offset}`)

    // 构建查询
    let query = supabase
      .from("subscription_history")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("event_date", { ascending: false })
      .range(offset, offset + limit - 1)

    // 可选：按事件类型过滤
    if (type) {
      query = query.eq("event_type", type)
    }

    const { data: history, error, count } = await query

    if (error) {
      console.error("[History API] Query error:", error)
      return errorResponse(
        "Failed to fetch subscription history",
        500,
        "QUERY_ERROR"
      )
    }

    // 获取统计信息
    const { data: stats } = await supabase.rpc("get_user_total_spent", {
      p_user_id: user.id,
    })

    const { data: renewalCount } = await supabase.rpc("get_user_renewal_count", {
      p_user_id: user.id,
    })

    console.log(`[History API] Found ${history?.length || 0} records, total count: ${count}`)

    return successResponse(
      {
        history: history || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
        stats: {
          totalSpent: stats || 0,
          renewalCount: renewalCount || 0,
        },
      },
      {
        userId: user.id,
      }
    )
  } catch (error) {
    console.error("[History API Error]:", error)
    return errorResponse(
      "Failed to fetch subscription history",
      500,
      "INTERNAL_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

