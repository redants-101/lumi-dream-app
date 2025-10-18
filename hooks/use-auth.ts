/**
 * 用户认证状态管理 Hook
 * 提供登录、登出、用户状态等功能
 */

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 获取当前用户
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("[Auth Hook Error]:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  /**
   * OAuth 登录通用方法
   */
  const signInWithOAuth = async (provider: "github" | "google") => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      })

      const data = await response.json()

      if (data.url) {
        // 重定向到 OAuth 页面
        window.location.href = data.url
      } else {
        throw new Error("Failed to get login URL")
      }
    } catch (error) {
      console.error("[Sign In Error]:", error)
      throw error
    }
  }

  /**
   * 使用 GitHub 登录
   */
  const signInWithGithub = () => signInWithOAuth("github")

  /**
   * 使用 Google 登录
   */
  const signInWithGoogle = () => signInWithOAuth("google")

  /**
   * 登出
   */
  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      
      setUser(null)
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

