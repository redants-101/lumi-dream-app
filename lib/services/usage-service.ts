/**
 * 使用限制服务
 * 处理使用次数验证、记录和同步
 */

import { createClient } from "@/lib/supabase/server"
import { getLimits, type UserTier } from "@/lib/usage-limits"
import { getResetTimes } from "./api-response"

/**
 * 使用情况数据
 */
export interface UsageData {
  daily: number
  monthly: number
  limits: {
    daily: number
    monthly: number
  }
}

/**
 * 使用验证结果
 */
export interface UsageValidationResult {
  allowed: boolean
  usageData?: UsageData
  error?: {
    message: string
    details: any
  }
}

/**
 * 验证匿名用户的使用限制（基于 IP）
 * ✅ 使用配置文件的日限制（2次）和月限制（4次）
 */
export async function validateAnonymousUsage(ip: string): Promise<UsageValidationResult> {
  const supabase = await createClient()
  const currentDay = new Date().toISOString().slice(0, 10)
  const currentMonth = new Date().toISOString().slice(0, 7)  // YYYY-MM
  
  // ✅ 从配置文件读取限制
  const limits = getLimits('anonymous')
  
  // === 查询今日使用记录 ===
  const { data: dailyUsage } = await supabase
    .from("anonymous_usage")
    .select("count")
    .eq("ip_address", ip)
    .eq("date", currentDay)
  
  // 计算今日总使用次数
  const dailyTotal = dailyUsage?.reduce((sum, record) => sum + record.count, 0) || 0
  
  // === 查询本月使用记录 ===
  const { data: monthlyUsage } = await supabase
    .from("anonymous_usage")
    .select("count")
    .eq("ip_address", ip)
    .gte("date", `${currentMonth}-01`)  // 本月第一天
    .lte("date", `${currentMonth}-31`)  // 本月最后一天
  
  // 计算本月总使用次数
  const monthlyTotal = monthlyUsage?.reduce((sum, record) => sum + record.count, 0) || 0
  
  const resetTimes = getResetTimes()
  
  // === 检查月限制（优先检查，更重要）===
  if (monthlyTotal >= limits.monthly) {
    console.warn(`[UsageService] ❌ IP monthly limit reached: ${ip} (${monthlyTotal}/${limits.monthly})`)
    return {
      allowed: false,
      error: {
        message: "Monthly limit reached. Please sign in for more interpretations.",
        details: {
          currentUsage: { 
            daily: dailyTotal,
            monthly: monthlyTotal 
          },
          limits: { 
            daily: limits.daily,
            monthly: limits.monthly 
          },
          resetTime: { 
            daily: resetTimes.daily,
            dailyLocal: resetTimes.dailyLocal,
            monthly: resetTimes.monthly,
            monthlyLocal: resetTimes.monthlyLocal
          },
          hint: "Create a free account to get 10 interpretations per month!",
          userTier: "anonymous",
        },
      },
    }
  }
  
  // === 检查日限制 ===
  if (dailyTotal >= limits.daily) {
    console.warn(`[UsageService] ❌ IP daily limit reached: ${ip} (${dailyTotal}/${limits.daily})`)
    return {
      allowed: false,
      error: {
        message: "Daily limit reached. Please sign in for more interpretations.",
        details: {
          currentUsage: { 
            daily: dailyTotal,
            monthly: monthlyTotal 
          },
          limits: { 
            daily: limits.daily,
            monthly: limits.monthly 
          },
          resetTime: { 
            daily: resetTimes.daily,
            dailyLocal: resetTimes.dailyLocal,
            monthly: resetTimes.monthly,
            monthlyLocal: resetTimes.monthlyLocal
          },
          hint: "Create a free account to get 10 interpretations per month!",
          userTier: "anonymous",
        },
      },
    }
  }
  
  console.log(`[UsageService] ✅ IP limit check passed: ${ip} (daily: ${dailyTotal}/${limits.daily}, monthly: ${monthlyTotal}/${limits.monthly})`)
  
  return {
    allowed: true,
    usageData: {
      daily: dailyTotal,
      monthly: monthlyTotal,
      limits: {
        daily: limits.daily,
        monthly: limits.monthly,
      },
    },
  }
}

/**
 * 验证已登录用户的使用限制
 */
export async function validateUserUsage(
  userId: string,
  tier: UserTier
): Promise<UsageValidationResult> {
  const supabase = await createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const limits = getLimits(tier)
  
  // 查询使用次数
  const { data: usageData, error: usageError } = await supabase
    .from("usage_tracking")
    .select("daily_count, monthly_count")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .single()
  
  // 数据库错误时降级处理
  if (usageError && usageError.code !== 'PGRST116') {
    console.error("[UsageService] ❌ Failed to fetch usage:", usageError)
    // 允许继续，但记录错误，返回默认 usageData 确保 Pro 降级逻辑正常工作
    return {
      allowed: true,
      usageData: {
        daily: 0,
        monthly: 0,
        limits: {
          daily: limits.daily,
          monthly: limits.monthly,
        },
      },
    }
  }
  
  // 无使用记录，允许继续
  if (!usageData) {
    console.log(`[UsageService] No usage record, starting fresh for ${tier} user`)
    return {
      allowed: true,
      usageData: {
        daily: 0,
        monthly: 0,
        limits: {
          daily: limits.daily,
          monthly: limits.monthly,
        },
      },
    }
  }
  
  const resetTimes = getResetTimes()
  
  // 验证日限制
  if (usageData.daily_count >= limits.daily) {
    console.warn(`[UsageService] ❌ Daily limit reached: ${tier} (${usageData.daily_count}/${limits.daily})`)
    return {
      allowed: false,
      error: {
        message: `Daily limit reached. You can use ${limits.daily} interpretations per day. Come back tomorrow!`,
        details: {
          currentUsage: {
            daily: usageData.daily_count,
            monthly: usageData.monthly_count,
          },
          limits: {
            daily: limits.daily,
            monthly: limits.monthly,
          },
          resetTime: {
            daily: resetTimes.daily,
            dailyLocal: resetTimes.dailyLocal,
            monthly: resetTimes.monthly,
            monthlyLocal: resetTimes.monthlyLocal,
          },
          userTier: tier,
        },
      },
    }
  }
  
  // 验证月限制
  if (usageData.monthly_count >= limits.monthly) {
    console.warn(`[UsageService] ❌ Monthly limit reached: ${tier} (${usageData.monthly_count}/${limits.monthly})`)
    const upgradeHint = tier === "free" 
      ? "Upgrade to Basic for 50/month!" 
      : tier === "basic"
      ? "Upgrade to Pro for 200/month!"
      : "See you next month!"
    
    return {
      allowed: false,
      error: {
        message: `Monthly limit reached. You can use ${limits.monthly} interpretations per month. ${upgradeHint}`,
        details: {
          currentUsage: {
            daily: usageData.daily_count,
            monthly: usageData.monthly_count,
          },
          limits: {
            daily: limits.daily,
            monthly: limits.monthly,
          },
          resetTime: {
            daily: resetTimes.daily,
            dailyLocal: resetTimes.dailyLocal,
            monthly: resetTimes.monthly,
            monthlyLocal: resetTimes.monthlyLocal,
          },
          userTier: tier,
          upgradeAvailable: tier !== "pro",
        },
      },
    }
  }
  
  console.log(`[UsageService] ✅ Usage limit check passed: ${tier} (daily: ${usageData.daily_count}/${limits.daily}, monthly: ${usageData.monthly_count}/${limits.monthly})`)
  
  return {
    allowed: true,
    usageData: {
      daily: usageData.daily_count,
      monthly: usageData.monthly_count,
      limits: {
        daily: limits.daily,
        monthly: limits.monthly,
      },
    },
  }
}

/**
 * 记录匿名用户使用
 */
export async function recordAnonymousUsage(ip: string): Promise<void> {
  const supabase = await createClient()
  const currentDay = new Date().toISOString().slice(0, 10)
  const currentHour = new Date().getHours()
  
  try {
    // 查询当前小时的使用次数
    const { data: hourUsage } = await supabase
      .from("anonymous_usage")
      .select("count")
      .eq("ip_address", ip)
      .eq("date", currentDay)
      .eq("hour", currentHour)
      .single()
    
    const newCount = (hourUsage?.count || 0) + 1
    
    // 更新或插入
    const { error: syncError } = await supabase
      .from("anonymous_usage")
      .upsert({
        ip_address: ip,
        date: currentDay,
        hour: currentHour,
        count: newCount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'ip_address,date,hour',
      })
    
    if (syncError) {
      console.error("[UsageService] ⚠️ Failed to sync IP usage:", syncError)
    } else {
      console.log(`[UsageService] ✅ IP usage synced: ${ip} hour=${currentHour} count=${newCount}`)
    }
  } catch (syncErr) {
    console.error("[UsageService] ⚠️ IP sync error:", syncErr)
  }
}

/**
 * 记录已登录用户使用
 */
export async function recordUserUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentDay = new Date().toISOString().slice(0, 10)
  
  try {
    // 先查询当前值
    const { data: currentUsage } = await supabase
      .from("usage_tracking")
      .select("daily_count, monthly_count, day")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .single()
    
    // 检查是否需要重置日计数（新的一天）
    const isDifferentDay = currentUsage?.day !== currentDay
    const newDailyCount = isDifferentDay ? 1 : (currentUsage?.daily_count || 0) + 1
    const newMonthlyCount = (currentUsage?.monthly_count || 0) + 1
    
    // 更新或插入
    const { error: syncError } = await supabase
      .from("usage_tracking")
      .upsert({
        user_id: userId,
        month: currentMonth,
        day: currentDay,
        daily_count: newDailyCount,
        monthly_count: newMonthlyCount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,month',
      })
    
    if (syncError) {
      console.error("[UsageService] ⚠️ Failed to sync usage to database:", syncError)
    } else {
      console.log(`[UsageService] ✅ User usage synced: daily=${newDailyCount}, monthly=${newMonthlyCount}`)
    }
  } catch (syncErr) {
    console.error("[UsageService] ⚠️ Database sync error:", syncErr)
  }
}

