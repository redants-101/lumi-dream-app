/**
 * 登出 API 路由
 * 处理用户登出操作
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 登出用户
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("[Auth Logout Error]:", error)
      return NextResponse.json(
        { error: "Failed to logout" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth Logout Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

