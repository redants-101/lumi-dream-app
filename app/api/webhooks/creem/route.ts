import { NextRequest } from "next/server"
import { creemClient, parseTierFromProductId } from "@/lib/creem-config"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Creem Webhook 处理器
 * POST /api/webhooks/creem
 * 
 * 文档：https://docs.creem.io/api-reference/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    console.log("\n🔔 [Webhook] Received request")
    
    // 读取 payload
    const payload = await request.text()
    console.log("[Webhook] Payload length:", payload.length)
    
    // 获取所有 headers 用于调试
    const headers = Object.fromEntries(request.headers.entries())
    console.log("[Webhook] Headers:", JSON.stringify(headers, null, 2))
    
    // 尝试多种可能的签名头名称
    const possibleHeaders = [
      "x-creem-signature",
      "x-signature", 
      "signature",
      "creem-signature",
      "webhook-signature",
      "x-webhook-signature"
    ]
    
    let signature: string | null = null
    let signatureHeaderName: string | null = null
    
    for (const headerName of possibleHeaders) {
      const value = request.headers.get(headerName)
      if (value) {
        signature = value
        signatureHeaderName = headerName
        break
      }
    }
    
    console.log("[Webhook] Signature header name:", signatureHeaderName || "NOT FOUND")
    console.log("[Webhook] Signature value:", signature ? signature.substring(0, 20) + "..." : "MISSING")
    
    if (!signature) {
      console.error("\n❌ [Webhook] No signature found in headers")
      console.error("Checked headers:", possibleHeaders.join(", "))
      console.error("Available headers:", Object.keys(headers).filter(h => !h.startsWith('next-')).join(", "))
      
      // 返回详细错误供调试
      return Response.json({ 
        error: "Missing signature",
        debug: {
          checked_headers: possibleHeaders,
          available_headers: Object.keys(headers).filter(h => !h.startsWith('next-'))
        }
      }, { status: 401 })
    }

    // 验证签名
    const isValid = creemClient.verifyWebhookSignature(payload, signature)
    if (!isValid) {
      console.error("\n❌ [Webhook] Signature verification failed")
      return Response.json({ error: "Invalid signature" }, { status: 401 })
    }
    
    console.log("✅ [Webhook] Signature verified successfully")

    // 解析事件
    const event = JSON.parse(payload)
    
    // ✅ Creem 使用 eventType 字段（不是 type）
    const eventType = event.eventType || event.type || event.event
    // ✅ Creem 数据在 object 字段中（不是 data）
    const eventData = event.object || event.data
    
    console.log("[Webhook] 📦 Event received:", eventType || "Unknown")
    console.log("[Webhook] Full event:", JSON.stringify(event, null, 2))

    // 处理不同类型的事件
    let handled = false
    
    switch (eventType) {
      case "checkout.completed":
      case "checkout.session.completed":
        handled = await handleCheckoutCompleted(eventData)
        break

      case "subscription.created":
        handled = await handleSubscriptionCreated(eventData)
        break

      case "subscription.updated":
        handled = await handleSubscriptionUpdated(eventData)
        break

      case "subscription.canceled":
        handled = await handleSubscriptionCanceled(eventData)
        break

      case "subscription.expired":
        handled = await handleSubscriptionExpired(eventData)
        break

      default:
        console.log(`[Webhook] ⚠️ Unhandled event type: ${eventType}`)
        console.log("[Webhook] Available event types: checkout.completed, subscription.created, subscription.updated, subscription.canceled, subscription.expired")
        // 未知事件类型也算成功（避免 Creem 不断重试）
        handled = true
    }

    // ✅ 根据处理结果返回不同状态码
    if (!handled) {
      console.error("❌ [Webhook] Event processing failed")
      return Response.json(
        { error: "Failed to process webhook event" },
        { status: 500 }
      )
    }

    console.log("✅ [Webhook] Event processed successfully")
    return Response.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("[Webhook Error]:", error)
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

/**
 * 处理结账完成
 * @returns {Promise<boolean>} 返回 true 表示成功处理，false 表示失败
 */
async function handleCheckoutCompleted(data: any): Promise<boolean> {
  console.log("\n💳 [Webhook] Checkout completed:", data.id)
  
  // 打印详细信息用于调试
  console.log("[Webhook] 📦 Full data:", JSON.stringify(data, null, 2))

  // ✅ 从 Creem 数据结构中提取信息
  const customer_email = data.customer?.email
  const product_id = data.product?.id || data.order?.product
  const metadata = data.metadata || {}
  const subscription_id = data.subscription?.id || data.order?.subscription
  
  console.log("[Webhook] Extracted info:")
  console.log("  - Customer email:", customer_email)
  console.log("  - Product ID:", product_id)
  console.log("  - Subscription ID:", subscription_id)
  console.log("  - Metadata:", JSON.stringify(metadata, null, 2))

  // 解析套餐信息
  const tierInfo = parseTierFromProductId(product_id)
  if (!tierInfo) {
    console.error("❌ [Webhook] Unknown product ID:", product_id)
    console.error("[Webhook] Available product IDs should be configured in .env")
    return false  // ✅ 返回 false 表示处理失败，Creem 会重试
  }
  
  console.log("✅ [Webhook] Tier info parsed:", tierInfo)

  // 获取用户 ID（优先从 metadata）
  const userId = metadata?.user_id
  
  if (!userId) {
    console.error("❌ [Webhook] No user_id in metadata")
    console.error("[Webhook] Metadata received:", JSON.stringify(metadata, null, 2))
    console.error("[Webhook] Customer email:", customer_email)
    return false  // ✅ 返回 false 表示处理失败，Creem 会重试
  }
  
  console.log("✅ [Webhook] Processing for user:", userId)
  console.log("[Webhook] Tier:", tierInfo.tier)
  console.log("[Webhook] Billing cycle:", tierInfo.billingCycle)
  console.log("[Webhook] Product ID:", product_id)
  
  // ✅ 使用 Service Role Key 客户端（绕过 RLS）
  const supabase = createServiceClient()

  // 计算周期时间
  const periodStart = new Date()
  const periodEnd = new Date(
    periodStart.getTime() +
    (tierInfo.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
  )

  // ✅ 创建或更新订阅记录（添加 creem_product_id 字段）
  const { data: result, error } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        tier: tierInfo.tier,
        billing_cycle: tierInfo.billingCycle,
        status: "active",
        creem_subscription_id: subscription_id,
        creem_customer_email: customer_email,
        creem_product_id: product_id,  // ✅ 添加产品 ID
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select() // ✅ 返回结果用于验证

  if (error) {
    console.error("❌ [Webhook] Failed to update subscription")
    console.error("[Webhook] Error details:", JSON.stringify(error, null, 2))
    console.error("[Webhook] User ID:", userId)
    console.error("[Webhook] Tier:", tierInfo.tier)
    return false  // ✅ 返回 false，Creem 会重试
  }

  console.log("✅ [Webhook] Subscription activated successfully!")
  console.log("[Webhook] Result:", JSON.stringify(result, null, 2))
  console.log("[Webhook] User:", userId)
  console.log("[Webhook] Tier:", tierInfo.tier)
  console.log("[Webhook] Period end:", periodEnd.toISOString())
  
  return true  // ✅ 返回 true 表示成功
}

/**
 * 处理订阅创建
 */
async function handleSubscriptionCreated(data: any): Promise<boolean> {
  console.log("[Webhook] Subscription created:", data.id)
  // 订阅创建逻辑（通常在 checkout.session.completed 中已处理）
  return true
}

/**
 * 处理订阅更新
 */
async function handleSubscriptionUpdated(data: any): Promise<boolean> {
  console.log("[Webhook] Subscription updated:", data.id)

  const { id, status, product_id } = data

  // 解析套餐信息
  const tierInfo = parseTierFromProductId(product_id)
  if (!tierInfo) {
    console.error("[Webhook] Unknown product ID:", product_id)
    return false
  }

  // 更新订阅状态
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      tier: tierInfo.tier,
      billing_cycle: tierInfo.billingCycle,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", id)

  if (error) {
    console.error("[Webhook] Failed to update subscription:", error)
    return false
  }

  console.log("[Webhook] Subscription updated:", id)
  return true
}

/**
 * 处理订阅取消
 */
async function handleSubscriptionCanceled(data: any): Promise<boolean> {
  console.log("[Webhook] Subscription canceled:", data.id)

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", data.id)

  if (error) {
    console.error("[Webhook] Failed to cancel subscription:", error)
    return false
  }

  console.log("[Webhook] Subscription canceled:", data.id)
  return true
}

/**
 * 处理订阅过期
 */
async function handleSubscriptionExpired(data: any): Promise<boolean> {
  console.log("[Webhook] Subscription expired:", data.id)

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "expired",
      tier: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", data.id)

  if (error) {
    console.error("[Webhook] Failed to expire subscription:", error)
    return false
  }

  console.log("[Webhook] Subscription expired:", data.id)
  return true
}

