/**
 * GitHub OAuth 回调路由
 * 处理 GitHub 登录后的重定向回调
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      
      if (isLocalEnv) {
        // 本地开发环境，重定向到 localhost
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // 生产环境，使用 forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // 后备方案
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // 如果发生错误，重定向回首页
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

