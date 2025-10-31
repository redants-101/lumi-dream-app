/**
 * Creem 支付集成配置
 * 文档：https://docs.creem.io/
 */

// ===================================
// Creem API 配置
// ===================================

export const CREEM_CONFIG = {
  apiKey: process.env.CREEM_API_KEY!,
  apiUrl: process.env.CREEM_API_URL || "https://api.creem.io",
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  
  // 回调 URL
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
} as const

// ===================================
// Creem 产品 ID 映射
// ===================================

export const CREEM_PRODUCT_IDS = {
  basic_monthly: process.env.CREEM_BASIC_MONTHLY_PRODUCT_ID!,
  basic_yearly: process.env.CREEM_BASIC_YEARLY_PRODUCT_ID!,
  pro_monthly: process.env.CREEM_PRO_MONTHLY_PRODUCT_ID!,
  pro_yearly: process.env.CREEM_PRO_YEARLY_PRODUCT_ID!,
} as const

// ===================================
// 类型定义
// ===================================

export type CreemProductId = keyof typeof CREEM_PRODUCT_IDS

export interface CreemCheckoutSession {
  product_id: string
  success_url: string
  metadata?: Record<string, string>
}

export interface CreemCheckoutResponse {
  id: string
  checkout_url: string
  status: string
}

export interface CreemWebhookEvent {
  type: string
  data: {
    id: string
    customer_email: string
    product_id: string
    status: string
    subscription_id?: string
    metadata?: Record<string, string>
  }
}

// ===================================
// Creem API 客户端
// ===================================

export class CreemClient {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || CREEM_CONFIG.apiKey
    this.apiUrl = apiUrl || CREEM_CONFIG.apiUrl
  }

  /**
   * 创建结账会话
   */
  async createCheckoutSession(
    params: CreemCheckoutSession
  ): Promise<CreemCheckoutResponse> {
    // 调试日志
    console.log("\n🔍 [Creem Debug] Creating checkout session...")
    console.log("📍 URL:", `${this.apiUrl}/v1/checkouts`)
    console.log("🔑 API Key:", this.apiKey ? `✅ ${this.apiKey.substring(0, 12)}...${this.apiKey.slice(-4)}` : "❌ MISSING")
    console.log("📦 Product ID:", params.product_id || "❌ MISSING")
    console.log("📧 User Email (metadata):", params.metadata?.user_email || "No email")
    console.log("🔗 Success URL:", params.success_url)
    console.log("📦 Metadata:", JSON.stringify(params.metadata))
    
    const response = await fetch(`${this.apiUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(params),
    })

    console.log("📊 Response Status:", response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error("\n❌ [Creem Error] API call failed:")
      console.error("Status:", response.status)
      console.error("Response:", error)
      console.error("Request Product ID:", params.product_id)
      throw new Error(`Creem API Error: ${error}`)
    }

    const result = await response.json()
    console.log("✅ [Creem Success] Session created:", result.id)
    return result
  }

  /**
   * 获取订阅信息
   */
  async getSubscription(subscriptionId: string) {
    const response = await fetch(
      `${this.apiUrl}/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          "x-api-key": this.apiKey,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Creem API Error: ${error}`)
    }

    return response.json()
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(subscriptionId: string) {
    const response = await fetch(
      `${this.apiUrl}/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Creem API Error: ${error}`)
    }

    return response.json()
  }

  /**
   * 验证 Webhook 签名
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require("crypto")
    
    console.log("\n🔐 [Webhook Verification] Starting...")
    console.log("Payload length:", payload.length)
    console.log("Signature received:", signature.substring(0, 20) + "...")
    console.log("Webhook Secret:", CREEM_CONFIG.webhookSecret ? "SET" : "MISSING")
    
    // 尝试多种签名格式
    
    // 格式 1: 直接 HMAC-SHA256 (hex)
    const expectedHex = crypto
      .createHmac("sha256", CREEM_CONFIG.webhookSecret)
      .update(payload)
      .digest("hex")
    console.log("Expected (hex):", expectedHex.substring(0, 20) + "...")
    
    if (signature === expectedHex) {
      console.log("✅ Signature verified (hex format)")
      return true
    }
    
    // 格式 2: Base64
    const expectedBase64 = crypto
      .createHmac("sha256", CREEM_CONFIG.webhookSecret)
      .update(payload)
      .digest("base64")
    console.log("Expected (base64):", expectedBase64.substring(0, 20) + "...")
    
    if (signature === expectedBase64) {
      console.log("✅ Signature verified (base64 format)")
      return true
    }
    
    // 格式 3: 带前缀 (sha256=xxx)
    if (signature.startsWith("sha256=")) {
      const signatureWithoutPrefix = signature.substring(7)
      if (signatureWithoutPrefix === expectedHex) {
        console.log("✅ Signature verified (hex with sha256= prefix)")
        return true
      }
    }
    
    console.error("❌ Signature verification failed")
    console.error("None of the formats matched")
    return false
  }
}

// ===================================
// 辅助函数
// ===================================

/**
 * 根据套餐和计费周期获取产品 ID
 */
export function getCreemProductId(
  tier: "basic" | "pro",
  billingCycle: "monthly" | "yearly"
): string {
  const key = `${tier}_${billingCycle}` as CreemProductId
  const productId = CREEM_PRODUCT_IDS[key]

  if (!productId) {
    throw new Error(`Invalid tier or billing cycle: ${tier} ${billingCycle}`)
  }

  return productId
}

/**
 * 从产品 ID 解析套餐信息
 */
export function parseTierFromProductId(productId: string): {
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
} | null {
  for (const [key, id] of Object.entries(CREEM_PRODUCT_IDS)) {
    if (id === productId) {
      const [tier, cycle] = key.split("_") as ["basic" | "pro", "monthly" | "yearly"]
      return { tier, billingCycle: cycle }
    }
  }

  return null
}

// ===================================
// 导出默认客户端实例
// ===================================

export const creemClient = new CreemClient()

