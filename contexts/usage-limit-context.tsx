/**
 * 使用限制全局 Context
 * 
 * 功能：
 * - 全局单例状态（跨组件共享）
 * - 避免重复 API 调用
 * - 统一数据源
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getLimits, type UserTier } from "@/lib/usage-limits"

// === 类型定义 ===

interface UsageData {
  dailyCount: number
  date: string  // YYYY-MM-DD
  monthlyCount: number
  month: string  // YYYY-MM
}

interface UsageLimitContextType {
  // 使用数据
  usageData: UsageData | null
  usageCount: number
  
  // 剩余次数
  remainingCount: number
  remainingDaily: number
  remainingMonthly: number
  
  // 限制状态
  isLimitReached: boolean
  limitType: "daily" | "monthly" | "none"
  
  // 方法
  canUse: () => boolean
  incrementUsage: () => void
  getLimitMessage: () => string
  
  // 元数据
  isAuthenticated: boolean
  userTier: UserTier
  limits: ReturnType<typeof getLimits>
  
  // 订阅相关
  subscription: any
  subscriptionLoading: boolean
  refreshUserInfo: () => Promise<void>
  refreshSubscription: () => Promise<void>
  syncUsageFromDatabase: () => Promise<void>
  syncFromResponse: (responseUsage: { daily: number; monthly: number }) => void
}

const UsageLimitContext = createContext<UsageLimitContextType | null>(null)

// === 常量 ===

const STORAGE_KEY = "lumi_usage_data_v2"
const TIER_STORAGE_KEY = "lumi_user_tier"

// ✅ 模块级全局变量（不会因为组件挂载/卸载而丢失）
let globalPrevAuth: boolean | null = null

// === Provider 组件 ===

export function UsageLimitProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  
  // 🔍 调试：Provider 每次渲染时打印状态
  useEffect(() => {
    console.log("[Usage Limit Context] 📍 Provider state changed:", { 
      isAuthenticated, 
      globalPrevAuth,  // ✅ 使用全局变量
      subscription: subscription?.tier,
      initialized,
      subscriptionLoading,
      usageData: usageData ? `${usageData.dailyCount}/${usageData.monthlyCount}` : 'null'
    })
  }, [isAuthenticated, subscription, initialized, subscriptionLoading, usageData])

  // === 辅助函数 ===
  
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  const getCurrentMonth = useCallback(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  const getUsageData = useCallback((): UsageData => {
    if (typeof window === "undefined") {
      return {
        dailyCount: 0,
        date: getTodayDate(),
        monthlyCount: 0,
        month: getCurrentMonth(),
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: UsageData = JSON.parse(stored)
        const today = getTodayDate()
        const thisMonth = getCurrentMonth()
        
        const needsDailyReset = data.date !== today
        const needsMonthlyReset = data.month !== thisMonth
        
        return {
          dailyCount: needsDailyReset ? 0 : data.dailyCount,
          date: today,
          monthlyCount: needsMonthlyReset ? 0 : data.monthlyCount,
          month: thisMonth,
        }
      }
    } catch (error) {
      console.error("[Usage Limit Context] Error reading data:", error)
    }

    return {
      dailyCount: 0,
      date: getTodayDate(),
      monthlyCount: 0,
      month: getCurrentMonth(),
    }
  }, [getTodayDate, getCurrentMonth])

  const saveUsageData = useCallback((data: UsageData) => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("[Usage Limit Context] Error saving data:", error)
    }
  }, [])

  // ✅ updateLimitStatus 智能获取当前 tier
  const updateLimitStatus = useCallback((data: UsageData, tier?: UserTier) => {
    console.log("[Usage Limit Context] 🎯 updateLimitStatus called with data:", data, "tier:", tier)
    console.log("[Usage Limit Context] 🔍 Current auth state:", { isAuthenticated, subscription: subscription?.tier })
    
    // ✅ 智能获取 tier：优先使用传入的 tier，其次使用 subscription.tier，最后根据登录状态决定
    let currentTier: UserTier
    if (tier) {
      currentTier = tier
    } else if (!isAuthenticated) {
      currentTier = "anonymous"
    } else if (subscription && subscription.tier) {
      currentTier = subscription.tier as UserTier
    } else {
      // ✅ 已登录但没有 subscription 数据：不更新状态，等待 subscription 加载
      console.log("[Usage Limit Context] ⏳ Skipping limit update, waiting for subscription data...")
      return
    }
    
    const limits = getLimits(currentTier)
    console.log("[Usage Limit Context] 📏 Limits for tier", currentTier, ":", limits)
    
    const dailyReached = data.dailyCount >= limits.daily
    const monthlyReached = data.monthlyCount >= limits.monthly
    
    console.log("[Usage Limit Context] 🔍 Limit check:", {
      dailyCount: data.dailyCount,
      dailyLimit: limits.daily,
      dailyReached,
      monthlyCount: data.monthlyCount,
      monthlyLimit: limits.monthly,
      monthlyReached
    })
    
    const limitReached = dailyReached || monthlyReached
    setIsLimitReached(limitReached)
    console.log(`[Usage Limit Context] 📊 Limit status updated for tier ${currentTier}: isLimitReached=${limitReached}`)
  }, [isAuthenticated, subscription])

  // === 核心函数：API 调用 ===
  
  const fetchUserInfo = useCallback(async (skipLoadingCheck = false) => {
    // ✅ 允许跳过 loading 检查（用于初始化时已经设置了 loading 状态）
    if (!skipLoadingCheck && subscriptionLoading) return
    
    if (!skipLoadingCheck) {
      setSubscriptionLoading(true)
    }
    try {
      const response = await fetch("/api/user-info")
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // ✅ 检查是否返回 JSON（避免解析 HTML 错误页面）
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[Usage Limit Context] ❌ API returned non-JSON:", text.substring(0, 200))
        throw new Error("API returned HTML instead of JSON")
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || "API returned error")
      }
      
      setSubscription(result.data.subscription)
      console.log("[Usage Limit Context] ✅ User info loaded:", result.data.subscription.tier)
      
      // ✅ 保存 tier 到缓存，供页面刷新时使用
      const tier = result.data.subscription?.tier as UserTier || "free"
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(TIER_STORAGE_KEY, tier)
          console.log("[Usage Limit Context] 💾 Saved tier to cache:", tier)
        } catch (error) {
          console.error("[Usage Limit Context] Failed to save tier to cache:", error)
        }
      }
      
      const today = getTodayDate()
      const thisMonth = getCurrentMonth()
      
      const syncedData: UsageData = {
        dailyCount: result.data.usage.daily,
        date: today,
        monthlyCount: result.data.usage.monthly,
        month: thisMonth,
      }
      
      saveUsageData(syncedData)
      setUsageData(syncedData)
      // ✅ 传入 tier 确保使用正确的限制
      updateLimitStatus(syncedData, tier)
      
      console.log("[Usage Limit Context] ✅ Usage synced from user-info:", syncedData)
      
    } catch (error) {
      console.error("[Usage Limit Context] Error fetching user info:", error)
      
      setSubscription({ tier: "free", status: "active" })
      
      const defaultData: UsageData = {
        dailyCount: 0,
        date: getTodayDate(),
        monthlyCount: 0,
        month: getCurrentMonth(),
      }
      
      saveUsageData(defaultData)
      setUsageData(defaultData)
      updateLimitStatus(defaultData, "free")  // ✅ 降级时使用 free
      
      console.log("[Usage Limit Context] ⚠️ Fell back to default values")
    } finally {
      setSubscriptionLoading(false)
    }
  }, [subscriptionLoading, getTodayDate, getCurrentMonth, saveUsageData, updateLimitStatus])

  const fetchUserSubscription = useCallback(async () => {
    if (subscriptionLoading) return
    
    setSubscriptionLoading(true)
    try {
      const response = await fetch("/api/subscription/manage")
      
      if (response.ok) {
        // ✅ 检查 Content-Type
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response")
        }
        
        const result = await response.json()
        
        if (result.success) {
          setSubscription(result.data)
          console.log("[Usage Limit Context] User subscription loaded:", result.data.tier)
        } else {
          setSubscription({ tier: "free", status: "active" })
        }
      } else {
        setSubscription({ tier: "free", status: "active" })
      }
    } catch (error) {
      console.error("[Usage Limit Context] Error fetching subscription:", error)
      setSubscription({ tier: "free", status: "active" })
    } finally {
      setSubscriptionLoading(false)
    }
  }, [subscriptionLoading])

  const syncUsageFromDatabase = useCallback(async () => {
    try {
      const response = await fetch("/api/usage")
      
      if (response.ok) {
        // ✅ 检查 Content-Type
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response")
        }
        
        const result = await response.json()
        
        if (result.success && result.metadata?.source === "database") {
          const today = getTodayDate()
          const thisMonth = getCurrentMonth()
          
          const syncedData: UsageData = {
            dailyCount: result.data.usage.daily,
            date: today,
            monthlyCount: result.data.usage.monthly,
            month: thisMonth,
          }
          
          saveUsageData(syncedData)
          setUsageData(syncedData)
          // ✅ 从 API 获取 tier 信息
          const tier = result.data?.tier as UserTier || "free"
          updateLimitStatus(syncedData, tier)
          
          console.log("[Usage Limit Context] ✅ Synced from database:", syncedData)
        }
      }
    } catch (error) {
      console.error("[Usage Limit Context] Failed to sync from database:", error)
    }
  }, [getTodayDate, getCurrentMonth, saveUsageData, updateLimitStatus])

  const syncFromResponse = useCallback((responseUsage: { daily: number; monthly: number }) => {
    console.log("[Usage Limit Context] 🔄 syncFromResponse called with:", responseUsage)
    console.log("[Usage Limit Context] 🔍 Current state before sync:", { isAuthenticated, usageData })
    
    const today = getTodayDate()
    const thisMonth = getCurrentMonth()
    
    const syncedData: UsageData = {
      dailyCount: responseUsage.daily,
      date: today,
      monthlyCount: responseUsage.monthly,
      month: thisMonth,
    }
    
    console.log("[Usage Limit Context] 💾 Saving to localStorage:", syncedData)
    saveUsageData(syncedData)
    
    console.log("[Usage Limit Context] 📝 Updating usageData state:", syncedData)
    setUsageData(syncedData)
    
    // ✅ syncFromResponse 使用当前计算的 userTier
    console.log("[Usage Limit Context] 🎯 Calling updateLimitStatus (auto-detect tier)")
    updateLimitStatus(syncedData)  // 不传 tier，让它自动检测
    
    console.log("[Usage Limit Context] ✅ Synced from API response complete")
  }, [getTodayDate, getCurrentMonth, saveUsageData, updateLimitStatus, isAuthenticated])

  // === useEffect: 全局初始化（只执行一次）===
  
  useEffect(() => {
    console.log("[Usage Limit Context] 🔍 Init useEffect:", { isAuthenticated, user: !!user, initialized })
    
    if (isAuthenticated && user && !initialized) {
      console.log("[Usage Limit Context] 🔄 Initializing user data (GLOBAL, first time)...")
      // ✅ 修复闪烁：立即设置加载状态，防止在 API 返回前显示错误数据
      setSubscriptionLoading(true)
      fetchUserInfo(true)  // ✅ 跳过 loading 检查，因为我们已经设置了
      setInitialized(true)
    }
    
    // ❌ 不要在这里更新 prevAuthRef！会导致登出检测失效
  }, [isAuthenticated, user, initialized, fetchUserInfo])
  
  // ✅ 检测登出转换（true → false）使用全局变量，永不丢失
  useEffect(() => {
    console.log("[Usage Limit Context] 🔍 Logout detection useEffect running...")
    const prevAuth = globalPrevAuth  // ✅ 使用全局变量
    
    console.log("[Usage Limit Context] 🔍 Checking logout:", { prevAuth, isAuthenticated, globalPrevAuth })
    
    // 检测从登录变为未登录
    if (prevAuth && !isAuthenticated) {
      console.log("[Usage Limit Context] 🔄 User logged out detected (prev: true, current: false)...")
      
      // ✅ 注意：localStorage 清理已由 use-auth.ts 的 clearAllUserData() 统一处理
      // 这里只需要重置 Context 特定的状态
      
      // ✅ 重置所有 React 状态
      setSubscription(null)
      setUsageData(null)
      setIsLimitReached(false)
      setSubscriptionLoading(false)
      setInitialized(false)
      
      // ✅ 3. 重置全局变量
      globalPrevAuth = null
      
      console.log("[Usage Limit Context] ✅ Reset complete, globalPrevAuth set to null")
    } else {
      // ✅ 保存当前认证状态到全局变量
      globalPrevAuth = isAuthenticated
      console.log("[Usage Limit Context] 🔍 Saved globalPrevAuth:", isAuthenticated)
    }
  }, [isAuthenticated])

  // ✅ 初始化使用数据（首次挂载 + 认证状态改变时）
  useEffect(() => {
    console.log("[Usage Limit Context] 🔍 Data initialization useEffect running, isAuthenticated:", isAuthenticated)
    
    if (!isAuthenticated) {
      // ✅ 未登录用户：从 localStorage 读取数据（如果有），否则使用默认值
      // ⚠️ 重要：不要强制清除 localStorage，因为 syncFromResponse 需要保存后端返回的使用数据
      const data = getUsageData()  // 从 localStorage 读取（带自动重置逻辑）
      console.log("[Usage Limit Context] 🔄 Setting anonymous data from localStorage:", data)
      setUsageData(data)
      updateLimitStatus(data, "anonymous")  // ✅ 明确传入 anonymous
      console.log("[Usage Limit Context] ✅ Anonymous data initialized")
    } else {
      // ✅ 已登录用户：只设置 usageData，不调用 updateLimitStatus
      // 等待 subscription 加载完成后，fetchUserInfo 会调用 updateLimitStatus
      const data = getUsageData()
      console.log("[Usage Limit Context] 🔄 Setting authenticated user data:", data)
      setUsageData(data)
      console.log("[Usage Limit Context] 🔄 Set authenticated user data, waiting for subscription...")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])  // ✅ 只在认证状态改变时触发，不依赖函数（避免循环）

  // === 业务函数 ===
  
  // ✅ canUse 需要在 userTier 计算之后定义，所以先定义 userTier

  const incrementUsage = useCallback(() => {
    if (!usageData) return  // ✅ 使用状态，不是 localStorage
    
    const newData: UsageData = {
      dailyCount: usageData.dailyCount + 1,  // ✅ 使用状态
      date: usageData.date,
      monthlyCount: usageData.monthlyCount + 1,
      month: usageData.month,
    }
    
    saveUsageData(newData)
    setUsageData(newData)
    updateLimitStatus(newData)  // 不传 tier，使用当前的
  }, [usageData, saveUsageData, updateLimitStatus])

  // ✅ 这些函数需要在 userTier 计算之后定义

  // === Context Value（使用 useMemo 避免重复渲染）===
  
  // ✅ 缓存计算值（直接依赖原始值，避免时序问题）
  const userTier = useMemo((): UserTier => {
    // ✅ 未登录用户：立即返回 anonymous
    if (!isAuthenticated) {
      return "anonymous"
    }
    
    // ✅ 已登录且有 subscription 数据：使用真实 tier
    if (subscription && subscription.tier) {
      console.log("[Usage Limit Context] 📊 userTier from subscription:", subscription.tier)
      return subscription.tier as UserTier
    }
    
    // ✅ 已登录但还在加载：从缓存读取（如果有）
    if (subscriptionLoading && typeof window !== "undefined") {
      try {
        const cachedTier = localStorage.getItem(TIER_STORAGE_KEY)
        if (cachedTier && ['free', 'basic', 'pro'].includes(cachedTier)) {
          console.log("[Usage Limit Context] 📊 userTier from cache:", cachedTier)
          return cachedTier as UserTier
        }
      } catch (error) {
        console.error("[Usage Limit Context] Failed to read cached tier:", error)
      }
    }
    
    // ✅ 已登录但没有数据且未加载：降级为 free（安全默认值）
    console.log("[Usage Limit Context] ⚠️ userTier defaulting to free (no subscription data)")
    return "free"
  }, [isAuthenticated, subscription, subscriptionLoading])  // ✅ 直接依赖原始值
  
  const limits = useMemo(() => getLimits(userTier), [userTier])
  
  // ✅ 现在定义依赖 userTier 的业务函数
  const canUse = useCallback((): boolean => {
    if (!usageData) return true
    return usageData.dailyCount < limits.daily && usageData.monthlyCount < limits.monthly
  }, [usageData, limits])
  
  const getRemainingCount = useCallback(() => {
    if (!usageData) return { daily: 0, monthly: 0 }
    
    return {
      daily: Math.max(0, limits.daily - usageData.dailyCount),
      monthly: Math.max(0, limits.monthly - usageData.monthlyCount),
    }
  }, [usageData, limits])
  
  const remaining = useMemo(() => getRemainingCount(), [getRemainingCount])
  
  const getLimitType = useCallback((): "daily" | "monthly" | "none" => {
    if (!usageData) return "none"
    
    if (usageData.dailyCount >= limits.daily) return "daily"
    if (usageData.monthlyCount >= limits.monthly) return "monthly"
    return "none"
  }, [usageData, limits])
  
  const limitType = useMemo(() => getLimitType(), [getLimitType])
  
  const getLimitMessage = useCallback((): string => {
    const remaining = getRemainingCount()
    const limitType = getLimitType()

    if (isLimitReached) {
      if (limitType === "daily") {
        return `You've reached your daily limit of ${limits.daily} interpretations. Please try again tomorrow.`
      } else if (limitType === "monthly") {
        return `You've reached your monthly limit of ${limits.monthly} interpretations. Upgrade for more!`
      }
    }

    const minRemaining = Math.min(remaining.daily, remaining.monthly)
    
    if (userTier === "anonymous") {
      return `You have ${minRemaining} of ${limits.monthly} free interpretations left this month.`
    } else {
      return `You have ${minRemaining} interpretations left (${remaining.daily} today, ${remaining.monthly} this month).`
    }
  }, [userTier, limits, getRemainingCount, getLimitType, isLimitReached])
  
  // ✅ 使用 useMemo 缓存整个 Context Value（关键优化）
  const contextValue = useMemo<UsageLimitContextType>(() => ({
    usageData,
    usageCount: usageData?.monthlyCount || 0,
    
    remainingCount: Math.min(remaining.daily, remaining.monthly),
    remainingDaily: remaining.daily,
    remainingMonthly: remaining.monthly,
    
    isLimitReached,
    limitType,
    
    canUse,
    incrementUsage,
    getLimitMessage,
    
    isAuthenticated,
    userTier,
    limits,
    
    subscription,
    subscriptionLoading,
    refreshUserInfo: fetchUserInfo,
    refreshSubscription: fetchUserSubscription,
    syncUsageFromDatabase,
    syncFromResponse,
  }), [
    usageData,
    remaining,
    isLimitReached,
    limitType,
    canUse,
    incrementUsage,
    getLimitMessage,
    isAuthenticated,
    userTier,
    limits,
    subscription,
    subscriptionLoading,
    fetchUserInfo,
    fetchUserSubscription,
    syncUsageFromDatabase,
    syncFromResponse,
  ])

  return (
    <UsageLimitContext.Provider value={contextValue}>
      {children}
    </UsageLimitContext.Provider>
  )
}

// === Hook ===

export function useUsageLimitV2() {
  const context = useContext(UsageLimitContext)
  
  if (!context) {
    throw new Error("useUsageLimitV2 must be used within UsageLimitProvider")
  }
  
  return context
}

