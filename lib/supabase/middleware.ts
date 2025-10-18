/**
 * Supabase 中间件配置
 * 用于在请求之间更新认证 token
 */

import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 重要：避免在这里写任何逻辑
  // 只需调用 supabase.auth.getUser() 来刷新认证 token
  const { data: { user } } = await supabase.auth.getUser()

  // 如果用户未登录且访问受保护的页面，可以在这里重定向
  // if (!user && request.nextUrl.pathname.startsWith('/protected')) {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  return supabaseResponse
}

