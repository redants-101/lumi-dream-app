/**
 * 认证服务
 * 处理用户认证和层级判断
 */

import { createClient } from "@/lib/supabase/server"
import type { UserTier } from "@/lib/ai-config"

/**
 * 用户认证结果
 */
export interface AuthResult {
  userId: string | null
  tier: UserTier
  isAuthenticated: boolean
}

/**
 * 获取用户认证状态和层级
 */
export async function getUserAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 未登录用户
  if (!user) {
    console.log("[AuthService] User not authenticated, using anonymous tier")
    return {
      userId: null,
      tier: "anonymous",
      isAuthenticated: false,
    }
  }
  
  // 查询用户订阅
  const { data: subscription, error: subscriptionError } = await supabase
    .from("user_subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", user.id)
    .single()
  
  let tier: UserTier = "free"  // 默认已登录用户为 free
  
  // 处理订阅查询错误
  if (subscriptionError) {
    if (subscriptionError.code === 'PGRST116') {
      // 记录不存在（用户无订阅）
      tier = "free"
      console.log("[AuthService] No subscription found, using free tier")
    } else {
      // 其他数据库错误（网络、权限等）
      console.error("[AuthService] ❌ Database error fetching subscription:", subscriptionError)
      tier = "free"  // 降级处理
    }
  } else if (subscription) {
    // 检查订阅是否有效
    const isActive = subscription.status === "active"
    const isNotExpired = !subscription.current_period_end || 
                        new Date(subscription.current_period_end) > new Date()
    
    if (isActive && isNotExpired) {
      tier = subscription.tier as UserTier
      console.log("[AuthService] ✅ Active subscription found:", tier)
    } else {
      tier = "free"
      console.log("[AuthService] ⚠️ Subscription inactive or expired, using free tier")
    }
  }
  
  return {
    userId: user.id,
    tier,
    isAuthenticated: true,
  }
}

/**
 * 获取用户 IP 地址（用于匿名用户限流）
 */
export async function getUserIP(): Promise<string> {
  const { headers } = await import("next/headers")
  const headersList = await headers()
  
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'
  
  console.log(`[AuthService] User IP: ${ip}`)
  return ip
}

