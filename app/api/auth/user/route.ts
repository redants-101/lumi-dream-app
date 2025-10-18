/**
 * 获取当前用户信息 API 路由
 * 返回当前登录用户的基本信息
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error("[Auth User Error]:", error)
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[Auth User Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

