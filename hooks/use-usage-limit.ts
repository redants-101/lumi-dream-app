/**
 * 使用次数限制管理 Hook
 * - 未登录用户：每天最多 5 次
 * - 已登录用户：每天最多 10 次
 */

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

interface UsageData {
  count: number
  date: string // YYYY-MM-DD 格式
}

// 从环境变量读取限制配置，如果未配置则使用默认值
const ANONYMOUS_LIMIT = parseInt(process.env.NEXT_PUBLIC_ANONYMOUS_USAGE_LIMIT || "5", 10)
const AUTHENTICATED_LIMIT = parseInt(process.env.NEXT_PUBLIC_AUTHENTICATED_USAGE_LIMIT || "10", 10)
const STORAGE_KEY = "lumi_usage_data"

export function useUsageLimit() {
  const { isAuthenticated } = useAuth()
  const [usageCount, setUsageCount] = useState(0)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [remainingCount, setRemainingCount] = useState(0)

  // 获取今天的日期（YYYY-MM-DD）
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // 从 localStorage 获取使用数据
  const getUsageData = (): UsageData => {
    if (typeof window === "undefined") {
      return { count: 0, date: getTodayDate() }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: UsageData = JSON.parse(stored)
        // 如果是新的一天，重置计数
        if (data.date !== getTodayDate()) {
          return { count: 0, date: getTodayDate() }
        }
        return data
      }
    } catch (error) {
      console.error("[Usage Limit] Error reading usage data:", error)
    }

    return { count: 0, date: getTodayDate() }
  }

  // 保存使用数据到 localStorage
  const saveUsageData = (data: UsageData) => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("[Usage Limit] Error saving usage data:", error)
    }
  }

  // 初始化使用数据
  useEffect(() => {
    const data = getUsageData()
    setUsageCount(data.count)
    updateLimitStatus(data.count)
  }, [isAuthenticated])

  // 更新限制状态
  const updateLimitStatus = (count: number) => {
    const limit = isAuthenticated ? AUTHENTICATED_LIMIT : ANONYMOUS_LIMIT
    const remaining = Math.max(0, limit - count)
    
    setRemainingCount(remaining)
    setIsLimitReached(count >= limit)
  }

  // 检查是否可以使用
  const canUse = (): boolean => {
    const data = getUsageData()
    const limit = isAuthenticated ? AUTHENTICATED_LIMIT : ANONYMOUS_LIMIT
    return data.count < limit
  }

  // 增加使用次数
  const incrementUsage = () => {
    const data = getUsageData()
    const newCount = data.count + 1
    const newData: UsageData = {
      count: newCount,
      date: getTodayDate()
    }
    
    saveUsageData(newData)
    setUsageCount(newCount)
    updateLimitStatus(newCount)
  }

  // 获取当前限制
  const getLimit = () => {
    return isAuthenticated ? AUTHENTICATED_LIMIT : ANONYMOUS_LIMIT
  }

  // 获取限制提示信息
  const getLimitMessage = (): string => {
    if (isAuthenticated) {
      if (isLimitReached) {
        return "You've reached your daily limit of 10 interpretations. Please try again tomorrow."
      }
      return `You have ${remainingCount} of ${AUTHENTICATED_LIMIT} interpretations left today.`
    } else {
      if (isLimitReached) {
        return "You've used all 5 free interpretations. Please sign in to get 5 more interpretations today!"
      }
      return `You have ${remainingCount} of ${ANONYMOUS_LIMIT} free interpretations left today.`
    }
  }

  return {
    usageCount,
    remainingCount,
    isLimitReached,
    canUse,
    incrementUsage,
    getLimit,
    getLimitMessage,
    isAuthenticated,
    anonymousLimit: ANONYMOUS_LIMIT,
    authenticatedLimit: AUTHENTICATED_LIMIT,
  }
}

