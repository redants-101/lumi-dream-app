/**
 * 用户认证状态管理 Hook
 * 提供登录、登出、用户状态等功能
 * 
 * 优化：
 * - localStorage 缓存用户状态（跨标签页共享）
 * - 快速初始化（同步读取缓存）
 * - 后台异步验证和更新
 * - 5 分钟缓存有效期（自动过期）
 */

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// ✅ 缓存键（统一管理所有存储键）
const AUTH_CACHE_KEY = "lumi_auth_cache"
const TIER_STORAGE_KEY = "lumi_user_tier"
const USAGE_STORAGE_KEY = "lumi_usage_data_v2"
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟

interface AuthCache {
  user: User | null
  timestamp: number
}


/**
 * 同步匿名用户使用数据（登出时调用）
 * ✅ 从 anonymous_usage 表获取真实使用数据并同步到 localStorage
 */
const syncAnonymousUsageOnSignOut = async (): Promise<void> => {
  try {
    console.log("[Auth] 📊 Fetching anonymous usage from database...")
    
    const response = await fetch("/api/anonymous-usage")
    
    if (!response.ok) {
      console.warn("[Auth] ⚠️ Failed to fetch anonymous usage:", response.status)
      return
    }
    
    const result = await response.json()
    
    if (!result.success) {
      console.warn("[Auth] ⚠️ Anonymous usage API returned error:", result.error)
      return
    }
    
    // 检查是否有使用记录
    if (result.data.hasRecords && result.data.usage) {
      const usageData = result.data.usage
      
      // ✅ 同步到 localStorage（注意字段名匹配）
      // Context 期望的字段名是 date（不是 day）
      const syncedData = {
        dailyCount: usageData.dailyCount,
        date: usageData.day,  // ✅ 关键修复：day → date
        monthlyCount: usageData.monthlyCount,
        month: usageData.month,
      }
      
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(syncedData))
      console.log("[Auth] ✅ Anonymous usage synced to localStorage:", syncedData)
    } else {
      // 没有使用记录，初始化为空状态
      const initialData = {
        dailyCount: 0,
        date: new Date().toISOString().slice(0, 10),  // ✅ 关键修复：day → date
        monthlyCount: 0,
        month: new Date().toISOString().slice(0, 7),
      }
      
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(initialData))
      console.log("[Auth] ℹ️ No anonymous usage records, initialized empty state")
    }
  } catch (error) {
    console.error("[Auth] ❌ Error syncing anonymous usage:", error)
    // 发生错误时，仍然初始化为空状态（保证不会崩溃）
    const initialData = {
      dailyCount: 0,
      date: new Date().toISOString().slice(0, 10),  // ✅ 关键修复：day → date
      monthlyCount: 0,
      month: new Date().toISOString().slice(0, 7),
    }
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(initialData))
  }
}

/**
 * 统一清理所有用户相关数据
 * ✅ 登出时调用此函数确保完全清理
 */
const clearAllUserData = () => {
  if (typeof window === "undefined") return
  
  try {
    // 1. 认证缓存
    localStorage.removeItem(AUTH_CACHE_KEY)
    
    // 2. 用户层级缓存
    localStorage.removeItem(TIER_STORAGE_KEY)
    
    // 3. ⚠️ 注意：使用数据缓存不在这里清除
    //    因为需要先同步匿名用户数据后再清除（在 signOut 中处理）
    // localStorage.removeItem(USAGE_STORAGE_KEY)
    
    // ❌ 不清理：用户偏好设置（与账户无关）
    // localStorage.removeItem("lumi-cookie-consent")
    
    console.log("[Auth] ✅ User data cleared (except usage data)")
  } catch (error) {
    console.error("[Auth] Failed to clear user data:", error)
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // ✅ 优化：从 localStorage 同步加载初始状态（跨标签页共享，避免闪烁）
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(AUTH_CACHE_KEY)
        if (cached) {
          const { user: cachedUser, timestamp }: AuthCache = JSON.parse(cached)
          // 如果缓存未过期，使用缓存数据
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log("[Auth] 📦 Using cached user (valid for", Math.round((CACHE_DURATION - (Date.now() - timestamp)) / 1000), "more seconds)")
            return cachedUser
          } else {
            // 缓存已过期，清除
            console.log("[Auth] 🗑️ Cache expired, clearing")
            localStorage.removeItem(AUTH_CACHE_KEY)
          }
        }
      } catch (error) {
        console.error("[Auth Cache Error]:", error)
      }
    }
    return null
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 保存用户状态到缓存（localStorage，跨标签页共享）
    const saveToCache = (userData: User | null) => {
      if (typeof window === "undefined") return
      
      try {
        const cache: AuthCache = {
          user: userData,
          timestamp: Date.now()
        }
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache))
        console.log("[Auth] 💾 User cached to localStorage (expires in 5 min)")
      } catch (error) {
        console.error("[Auth Cache Save Error]:", error)
      }
    }

    // 获取当前用户（异步验证）
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        saveToCache(user)
      } catch (error) {
        console.error("[Auth Hook Error]:", error)
        setUser(null)
        saveToCache(null)
      } finally {
        setIsLoading(false)
      }
    }

    // 如果有缓存，先显示缓存，然后后台验证
    const hasCachedUser = user !== null
    if (hasCachedUser) {
      setIsLoading(false) // 有缓存时立即标记为已加载
    }
    
    getUser() // 后台异步验证

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)
        saveToCache(newUser)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  /**
   * OAuth 登录通用方法
   * @param provider OAuth 提供商（github 或 google）
   * @param redirectPath 登录成功后跳转的路径（可选）
   */
  const signInWithOAuth = async (provider: "github" | "google", redirectPath?: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, redirectPath }),
      })

      const result = await response.json()

      // ✅ 适配统一响应格式：{ success: true, data: {...}, metadata: {...} }
      if (result.success && result.data.url) {
        // 重定向到 OAuth 页面
        window.location.href = result.data.url
      } else {
        throw new Error(result.error?.message || "Failed to get login URL")
      }
    } catch (error) {
      console.error("[Sign In Error]:", error)
      throw error
    }
  }

  /**
   * 使用 GitHub 登录
   * @param redirectPath 登录成功后跳转的路径（可选）
   */
  const signInWithGithub = (redirectPath?: string) => signInWithOAuth("github", redirectPath)

  /**
   * 使用 Google 登录
   * @param redirectPath 登录成功后跳转的路径（可选）
   */
  const signInWithGoogle = (redirectPath?: string) => signInWithOAuth("google", redirectPath)

  /**
   * 登出
   * ✅ 清除所有用户相关数据（认证 + 层级 + 使用记录）
   * ✅ 同步匿名用户使用数据（从 anonymous_usage 表）
   * ✅ 即使后端 API 失败，也继续清除本地状态
   */
  const signOut = async () => {
    try {
      console.log("[Auth] 🚪 Starting sign out process...")
      
      // 1. 调用后端登出 API（不阻塞后续流程）
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        })
        
        if (!response.ok) {
          console.warn("[Auth] ⚠️ Backend logout failed (status:", response.status, ") but continuing with local cleanup")
        } else {
          console.log("[Auth] ✅ Backend logout successful")
        }
      } catch (fetchError) {
        // ✅ 即使后端登出失败，也继续清除本地状态
        console.warn("[Auth] ⚠️ Backend logout API error:", fetchError, "- continuing with local cleanup")
      }
      
      // 2. 清除 React 状态（必须执行）
      setUser(null)
      
      // 3. 清除认证和层级缓存（必须执行）
      clearAllUserData()
      
      // 4. ✅ 同步匿名用户使用数据（必须执行）
      //    - 如果 anonymous_usage 表有记录 → 同步到 localStorage
      //    - 如果没有记录 → 初始化为空状态
      await syncAnonymousUsageOnSignOut()
      
      console.log("[Auth] ✅ User signed out successfully (local state cleared)")
    } catch (error) {
      console.error("[Sign Out Error]:", error)
      // ⚠️ 即使发生错误，也尝试清除基本状态
      try {
        setUser(null)
        clearAllUserData()
      } catch (cleanupError) {
        console.error("[Auth] Failed to cleanup on error:", cleanupError)
      }
      throw error
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGithub,
    signInWithGoogle,
    signOut,
  }
}

