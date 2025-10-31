/**
 * 用户认证状态管理 Hook
 * 提供登录、登出、用户状态等功能
 * 
 * 优化：
 * - sessionStorage 缓存用户状态
 * - 快速初始化（同步读取缓存）
 * - 后台异步验证和更新
 */

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// 缓存键
const AUTH_CACHE_KEY = "lumi_auth_cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟

interface AuthCache {
  user: User | null
  timestamp: number
}


export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // ✅ 优化：从缓存同步加载初始状态（避免闪烁）
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(AUTH_CACHE_KEY)
        if (cached) {
          const { user: cachedUser, timestamp }: AuthCache = JSON.parse(cached)
          // 如果缓存未过期，使用缓存数据
          if (Date.now() - timestamp < CACHE_DURATION) {
            return cachedUser
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
    // 保存用户状态到缓存
    const saveToCache = (userData: User | null) => {
      if (typeof window === "undefined") return
      
      try {
        const cache: AuthCache = {
          user: userData,
          timestamp: Date.now()
        }
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache))
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
   */
  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      
      // 清除用户状态
      setUser(null)
      
      // ✅ 清除 sessionStorage 缓存
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(AUTH_CACHE_KEY)
          console.log("[Auth] Cache cleared on sign out")
        } catch (error) {
          console.error("[Auth Cache Clear Error]:", error)
        }
      }
    } catch (error) {
      console.error("[Sign Out Error]:", error)
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

