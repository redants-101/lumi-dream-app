/**
 * OAuth 登录 API 路由
 * 启动 OAuth 登录流程（支持 GitHub、Google 等）
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { origin } = new URL(request.url)
    const { provider } = await request.json()

    // 验证 provider 参数
    if (!provider || !["github", "google"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      )
    }

    // 启动 OAuth 登录
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "github" | "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    })

    if (error) {
      console.error("[Auth Login Error]:", error)
      return NextResponse.json(
        { error: "Failed to initiate login" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    console.error("[Auth Login Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

