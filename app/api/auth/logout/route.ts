/**
 * 登出 API 路由
 * 处理用户登出操作
 */

import { createClient } from "@/lib/supabase/server"
import { successResponse, errorResponse } from "@/lib/services/api-response"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 登出用户
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("[Auth Logout Error]:", error)
      return errorResponse(
        "Failed to logout",
        500,
        "LOGOUT_ERROR",
        {
          error: error.message,
        }
      )
    }

    return successResponse(
      {
        message: "Successfully logged out",
      },
      {
        loggedOutAt: new Date().toISOString(),
      }
    )
  } catch (error) {
    console.error("[Auth Logout Error]:", error)
    return errorResponse(
      "Internal server error",
      500,
      "INTERNAL_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

