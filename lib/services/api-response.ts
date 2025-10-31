/**
 * 统一 API 响应格式
 * 确保所有 API 返回一致的响应结构
 */

/**
 * 统一成功响应接口
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  metadata?: {
    timestamp?: string
    version?: string
    [key: string]: any
  }
}

/**
 * 统一错误响应接口
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: {
      currentUsage?: {
        daily?: number
        monthly?: number
      }
      limits?: {
        daily?: number
        monthly?: number
      }
      resetTime?: {
        daily?: string
        monthly?: string
      }
      userTier?: string
      [key: string]: any
    }
  }
}

/**
 * API 响应联合类型
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, metadata?: any): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details: {
        timestamp: new Date().toISOString(),
        ...details,
      },
    },
  }
}

/**
 * 返回成功的 Response 对象
 */
export function successResponse<T>(data: T, metadata?: any, status: number = 200): Response {
  return Response.json(createSuccessResponse(data, metadata), { status })
}

/**
 * 返回错误的 Response 对象
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: any
): Response {
  return Response.json(createErrorResponse(message, code, details), { status })
}

/**
 * 计算重置时间
 */
export function getResetTimes() {
  const now = new Date()
  
  // 每日重置时间（UTC 午夜）
  const dailyReset = new Date(now)
  dailyReset.setUTCHours(24, 0, 0, 0)
  
  // 每月重置时间（下月 1 日 UTC 午夜）
  const monthlyReset = new Date(now)
  monthlyReset.setUTCMonth(monthlyReset.getUTCMonth() + 1, 1)
  monthlyReset.setUTCHours(0, 0, 0, 0)
  
  return {
    daily: dailyReset.toISOString(),
    monthly: monthlyReset.toISOString(),
    // 添加本地时间（用户友好）
    dailyLocal: dailyReset.toLocaleString('en-US', { 
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short' 
    }) + ' UTC',
    monthlyLocal: monthlyReset.toLocaleString('en-US', { 
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short' 
    }) + ' UTC',
  }
}

