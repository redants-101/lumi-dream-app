/**
 * OAuth 登录 API 路由
 * 启动 OAuth 登录流程（支持 GitHub、Google 等）
 */

import { createClient } from "@/lib/supabase/server"
import { successResponse, errorResponse } from "@/lib/services/api-response"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { origin } = new URL(request.url)
    const { provider, redirectPath } = await request.json()

    // 验证 provider 参数
    if (!provider || !["github", "google"].includes(provider)) {
      return errorResponse(
        "Invalid provider. Must be 'github' or 'google'",
        400,
        "INVALID_PROVIDER"
      )
    }

    // 构建回调 URL（带 next 参数）
    const callbackUrl = redirectPath 
      ? `${origin}/api/auth/callback?next=${encodeURIComponent(redirectPath)}`
      : `${origin}/api/auth/callback`

    // 启动 OAuth 登录
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "github" | "google",
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      console.error("[Auth Login Error]:", error)
      return errorResponse(
        "Failed to initiate login",
        500,
        "OAUTH_ERROR",
        {
          provider,
          error: error.message,
        }
      )
    }

    return successResponse(
      {
        url: data.url,
      },
      {
        provider,
        redirectPath: redirectPath || "/",
      }
    )
  } catch (error) {
    console.error("[Auth Login Error]:", error)
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

