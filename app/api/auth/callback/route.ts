/**
 * GitHub OAuth 回调路由
 * 处理 GitHub 登录后的重定向回调
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // ✅ 获取真实的主机名（支持 ngrok、Vercel 等）
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto")
  
  // 优先使用环境变量，其次使用 forwarded headers，最后使用 request URL
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    if (forwardedHost) {
      const protocol = forwardedProto || "https"
      baseUrl = `${protocol}://${forwardedHost}`
    } else {
      baseUrl = requestUrl.origin
    }
  }

  // ✅ 调试日志：追踪 OAuth 回调
  console.log("=== [OAuth Callback] ===")
  console.log("Full URL:", request.url)
  console.log("Request origin:", requestUrl.origin)
  console.log("Forwarded Host:", forwardedHost)
  console.log("Forwarded Proto:", forwardedProto)
  console.log("Base URL (final):", baseUrl)
  console.log("Code exists:", !!code)
  console.log("Next param:", next)
  console.log("All params:", Object.fromEntries(searchParams))
  console.log("========================\n")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ 使用正确的 baseUrl 进行重定向
      const redirectUrl = `${baseUrl}${next}`
      console.log("Redirecting to:", redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 如果发生错误，重定向回首页
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}

