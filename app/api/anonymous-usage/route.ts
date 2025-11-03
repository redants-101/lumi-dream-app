import { getAnonymousUsageInfo } from "@/lib/services/usage-service"
import { successResponse, errorResponse } from "@/lib/services/api-response"
import { headers } from "next/headers"

/**
 * 获取匿名用户的使用数据（用于登出时同步）
 * GET /api/anonymous-usage
 * 
 * 功能：
 * - 基于 IP 地址查询 anonymous_usage 表
 * - 返回日/月使用次数
 * - 如果没有记录返回 null
 */
export async function GET() {
  try {
    // 获取客户端 IP
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIP || "unknown"
    
    console.log("[Anonymous Usage API] 📊 Fetching usage for IP:", ip)
    
    // 获取匿名用户的使用信息
    const usageInfo = await getAnonymousUsageInfo(ip)
    
    if (!usageInfo) {
      // 没有使用记录，返回初始化数据
      console.log("[Anonymous Usage API] ℹ️ No usage records, returning empty state")
      return successResponse(
        {
          hasRecords: false,
          usage: null,
        },
        {
          source: "database",
          ip,
          message: "No usage records found for this IP",
        }
      )
    }
    
    // 有使用记录，返回数据
    console.log("[Anonymous Usage API] ✅ Returning usage data:", usageInfo)
    return successResponse(
      {
        hasRecords: true,
        usage: usageInfo,
      },
      {
        source: "database",
        ip,
      }
    )
  } catch (error) {
    console.error("[Anonymous Usage API] ❌ Error:", error)
    return errorResponse(
      "Failed to fetch anonymous usage data",
      500,
      "ANONYMOUS_USAGE_ERROR",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    )
  }
}

