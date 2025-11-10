import { NextRequest } from "next/server"
import { creemClient, parseTierFromProductId } from "@/lib/creem-config"
import { createServiceClient } from "@/lib/supabase/service"
import { sendRenewalFailedEmail, sendSubscriptionConfirmationEmail } from "@/lib/services/email-service"

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

      case "subscription.paid":
        // ✅ 只处理续费，首次购买跳过（由 checkout.completed 处理）
        handled = await handleSubscriptionPaid(eventData)
        break

      case "subscription.active":
        // ✅ 订阅激活事件（首次购买时触发）
        console.log("[Webhook] 📝 Subscription activated - ignoring (handled by checkout.completed)")
        handled = true  // 标记为成功，但不处理（避免重复）
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
        console.log("[Webhook] Available event types: checkout.completed, subscription.paid, subscription.active, subscription.created, subscription.updated, subscription.canceled, subscription.expired")
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

  // ✅ 幂等性检查：防止重复处理同一次购买
  const supabase = createServiceClient()
  const paymentId = data.id
  
  const { data: existingHistory } = await supabase
    .from("subscription_history")
    .select("id, event_type, creem_payment_id")
    .eq("creem_payment_id", paymentId)
    .maybeSingle()
  
  if (existingHistory) {
    console.log(`[Webhook] ✅ Payment ${paymentId} already processed`)
    console.log(`[Webhook] Previous event: ${existingHistory.event_type}`)
    console.log("[Webhook] Skipping duplicate processing to maintain idempotency")
    return true  // 返回成功，但不重复处理
  }
  
  console.log(`[Webhook] ✅ New payment ${paymentId}, proceeding with processing`)

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

  // ✅ 查询现有订阅，判断是新购、续费还是升级/降级
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single()

  // 判断订阅类型
  let eventType: string
  let isUpgrade = false
  let isDowngrade = false
  let isCycleChange = false
  let isSamePlan = false

  if (!existingSubscription) {
    // 首次购买
    eventType = "subscription_created"
    console.log("📝 [Webhook] Event type: New subscription")
  } else {
    const oldTier = existingSubscription.tier
    const oldCycle = existingSubscription.billing_cycle
    const newTier = tierInfo.tier
    const newCycle = tierInfo.billingCycle

    // 判断是否为相同套餐
    isSamePlan = (oldTier === newTier && oldCycle === newCycle)

    if (isSamePlan) {
      // 相同套餐：续费或延长
      eventType = "subscription_renewed"
      console.log("🔄 [Webhook] Event type: Subscription renewal (same plan)")
    } else if (oldTier === newTier && oldCycle !== newCycle) {
      // 相同层级，不同周期
      isCycleChange = true
      eventType = "subscription_cycle_changed"
      console.log(`🔄 [Webhook] Event type: Billing cycle changed (${oldCycle} → ${newCycle})`)
    } else {
      // 不同层级：判断升级或降级
      const tierLevel: Record<string, number> = { free: 0, basic: 1, pro: 2 }
      if (tierLevel[newTier] > tierLevel[oldTier]) {
        isUpgrade = true
        eventType = "subscription_upgraded"
        console.log(`⬆️ [Webhook] Event type: Upgraded (${oldTier} → ${newTier})`)
      } else {
        isDowngrade = true
        eventType = "subscription_downgraded"
        console.log(`⬇️ [Webhook] Event type: Downgraded (${oldTier} → ${newTier})`)
      }
    }

    // ✅ 关键修复：如果不是相同套餐，需要取消旧订阅（防止双重续费）
    if (!isSamePlan && existingSubscription.creem_subscription_id && existingSubscription.creem_subscription_id !== subscription_id) {
      console.log("\n🔄 [Webhook] Canceling old subscription to prevent duplicate renewals")
      console.log(`   Old subscription: ${existingSubscription.creem_subscription_id} (${oldTier} ${oldCycle})`)
      console.log(`   New subscription: ${subscription_id} (${newTier} ${newCycle})`)
      
      try {
        // 调用 Creem API 取消旧订阅
        await creemClient.cancelSubscription(existingSubscription.creem_subscription_id)
        console.log(`✅ [Webhook] Old subscription canceled: ${existingSubscription.creem_subscription_id}`)
      } catch (cancelError) {
        console.error(`⚠️ [Webhook] Failed to cancel old subscription:`, cancelError)
        // 不阻止新订阅激活，但记录错误
        // 管理员可以手动处理
      }
    }
  }

  // ✅ 计算订阅周期时间（复购延长逻辑）
  const periodStart = new Date()
  let periodEnd: Date

  if (isSamePlan && existingSubscription) {
    // ✅ 相同套餐：从现有结束时间延长
    const existingEnd = new Date(existingSubscription.current_period_end)
    const now = new Date()

    if (existingEnd > now) {
      // 如果现有订阅未过期，从结束时间延长
      periodEnd = new Date(existingEnd)
      const daysToAdd = tierInfo.billingCycle === "yearly" ? 365 : 30
      periodEnd.setDate(periodEnd.getDate() + daysToAdd)
      
      console.log(`✅ [Webhook] Extending subscription from existing end date`)
      console.log(`   Old end: ${existingEnd.toISOString()}`)
      console.log(`   New end: ${periodEnd.toISOString()}`)
      console.log(`   Added: ${daysToAdd} days`)
    } else {
      // 如果已过期，从现在开始
      periodEnd = new Date(
        periodStart.getTime() +
        (tierInfo.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
      )
      console.log(`✅ [Webhook] Starting new period (old subscription expired)`)
    }
  } else {
    // 新购或升级/降级：从现在开始计算
    periodEnd = new Date(
      periodStart.getTime() +
      (tierInfo.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
    )
    console.log(`✅ [Webhook] Starting new ${tierInfo.billingCycle} period`)
  }

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
  
  // ✅ 记录订阅历史（使用详细的事件类型）
  try {
    // 生成详细的描述
    let description: string
    if (eventType === "subscription_created") {
      description = `${tierInfo.tier} ${tierInfo.billingCycle} subscription created`
    } else if (eventType === "subscription_renewed") {
      description = `${tierInfo.tier} ${tierInfo.billingCycle} subscription renewed (extended)`
    } else if (eventType === "subscription_upgraded") {
      description = `Upgraded from ${existingSubscription?.tier} to ${tierInfo.tier}`
    } else if (eventType === "subscription_downgraded") {
      description = `Downgraded from ${existingSubscription?.tier} to ${tierInfo.tier}`
    } else if (eventType === "subscription_cycle_changed") {
      description = `Changed ${tierInfo.tier} from ${existingSubscription?.billing_cycle} to ${tierInfo.billingCycle}`
    } else {
      description = `${tierInfo.tier} ${tierInfo.billingCycle} subscription updated`
    }

    const { error: historyError } = await supabase
      .from("subscription_history")
      .insert({
        subscription_id: result[0].id,
        user_id: userId,
        event_type: eventType,  // ✅ 使用详细的事件类型
        tier: tierInfo.tier,
        billing_cycle: tierInfo.billingCycle,
        amount: getSubscriptionAmount(tierInfo.tier, tierInfo.billingCycle),
        currency: 'USD',
        creem_subscription_id: subscription_id,
        creem_payment_id: data.id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        description: description,
        status: 'completed',
        event_date: new Date().toISOString(),
        // ✅ 记录旧订阅信息（如果存在）
        metadata: existingSubscription ? {
          old_tier: existingSubscription.tier,
          old_billing_cycle: existingSubscription.billing_cycle,
          old_period_end: existingSubscription.current_period_end,
        } : undefined,
      })
    
    if (historyError) {
      console.error("⚠️ [Webhook] Failed to record subscription history:", historyError)
      // 不影响主流程
    } else {
      console.log("✅ [Webhook] Subscription history recorded")
      console.log(`   Event type: ${eventType}`)
      console.log(`   Description: ${description}`)
    }
  } catch (historyError) {
    console.error("⚠️ [Webhook] Error recording history:", historyError)
  }
  
  // ✅ 发送订阅确认邮件
  try {
    console.log("[Webhook] Querying user info for confirmation email...")
    
    // 从 Supabase auth.users 表查询用户信息
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error("⚠️ [Webhook] Failed to query user info:", userError)
      console.log("[Webhook] Trying alternative method: from user_subscriptions...")
      
      // 备选方案：从 customer_email 获取
      if (customer_email) {
        console.log("[Webhook] Using customer email from Creem:", customer_email)
        
        const emailSent = await sendSubscriptionConfirmationEmail({
          to: customer_email,
          userName: customer_email.split('@')[0], // 使用邮箱前缀作为名称
          tier: tierInfo.tier as "basic" | "pro",
          billingCycle: tierInfo.billingCycle as "monthly" | "yearly",
        })
        
        if (emailSent) {
          console.log("✅ [Webhook] Confirmation email sent to:", customer_email)
        } else {
          console.error("⚠️ [Webhook] Failed to send confirmation email")
        }
      } else {
        console.error("⚠️ [Webhook] No email found, skipping confirmation email")
      }
    } else {
      // 获取用户信息
      const user = userData.user
      const userEmail = user.email
      const userName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       userEmail?.split('@')[0] || 
                       "Friend"
      
      console.log("[Webhook] Sending confirmation email to:", userEmail)
      console.log("[Webhook] User name:", userName)
      
      if (userEmail) {
        const emailSent = await sendSubscriptionConfirmationEmail({
          to: userEmail,
          userName: userName,
          tier: tierInfo.tier as "basic" | "pro",
          billingCycle: tierInfo.billingCycle as "monthly" | "yearly",
        })
        
        if (emailSent) {
          console.log("✅ [Webhook] Confirmation email sent successfully to:", userEmail)
        } else {
          console.error("⚠️ [Webhook] Failed to send confirmation email to:", userEmail)
        }
      } else {
        console.error("⚠️ [Webhook] No email found for user:", userId)
      }
    }
  } catch (emailError) {
    console.error("⚠️ [Webhook] Error sending confirmation email:", emailError)
    // 邮件发送失败不影响订阅激活，只记录错误
  }
  
  return true  // ✅ 返回 true 表示成功
}

/**
 * 获取订阅金额
 */
function getSubscriptionAmount(tier: string, billingCycle: string): number {
  const pricing: Record<string, Record<string, number>> = {
    basic: { monthly: 4.99, yearly: 49.00 },
    pro: { monthly: 9.99, yearly: 99.00 },
  }
  return pricing[tier]?.[billingCycle] || 0
}

/**
 * 处理订阅支付成功（续费专用）
 * @returns {Promise<boolean>} 返回 true 表示成功处理，false 表示失败
 */
async function handleSubscriptionPaid(data: any): Promise<boolean> {
  console.log("\n💰 [Webhook] Subscription payment received:", data.id)
  
  const subscriptionId = data.id
  const supabase = createServiceClient()
  
  // ✅ 检查是否为首次支付（首次购买由 checkout.completed 处理）
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id, tier, billing_cycle, creem_subscription_id")
    .eq("creem_subscription_id", subscriptionId)
    .maybeSingle()
  
  if (!existingSubscription) {
    console.log("[Webhook] 💳 First payment detected (no existing subscription)")
    console.log("[Webhook] This will be handled by checkout.completed event")
    console.log("[Webhook] Skipping subscription.paid to avoid duplication")
    return true  // 标记为成功，但不处理
  }
  
  // ✅ 已有订阅，这是真正的续费
  console.log("[Webhook] 🔄 Renewal payment for existing subscription")
  console.log(`[Webhook] Subscription: ${existingSubscription.tier} ${existingSubscription.billing_cycle}`)
  
  // 调用 handleCheckoutCompleted 处理续费
  return await handleCheckoutCompleted(data)
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
 * 处理订阅过期（通常是续费失败导致）
 */
async function handleSubscriptionExpired(data: any): Promise<boolean> {
  console.log("\n⚠️ [Webhook] Subscription expired:", data.id)
  console.log("[Webhook] Full data:", JSON.stringify(data, null, 2))

  const supabase = createServiceClient()
  
  // 1. 查询订阅信息（包含用户信息）
  const { data: subscription, error: queryError } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      user:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq("creem_subscription_id", data.id)
    .single()

  if (queryError || !subscription) {
    console.error("[Webhook] Failed to query subscription:", queryError)
    return false
  }

  const user = subscription.user as any
  console.log("[Webhook] User:", user?.email)
  console.log("[Webhook] Tier:", subscription.tier)

  // 2. 更新订阅状态
  const { error: updateError } = await supabase
    .from("user_subscriptions")
    .update({
      status: "expired",
      tier: "free",  // 降级为 Free
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", data.id)

  if (updateError) {
    console.error("[Webhook] Failed to expire subscription:", updateError)
    return false
  }

  console.log("✅ [Webhook] Subscription expired and downgraded to Free")

  // 3. 发送续费失败通知邮件
  if (user && user.email) {
    console.log("[Webhook] Sending renewal failed notification...")
    
    try {
      const emailSent = await sendRenewalFailedEmail({
        to: user.email,
        userName: user.user_metadata?.full_name || user.email.split('@')[0],
        tier: subscription.tier as "basic" | "pro",
        billingCycle: subscription.billing_cycle as "monthly" | "yearly",
        failureDate: new Date(),
        failureReason: data.reason || "Payment could not be processed",
      })

      if (emailSent) {
        console.log("✅ [Webhook] Renewal failed notification sent to:", user.email)
      } else {
        console.error("⚠️ [Webhook] Failed to send renewal failed notification")
      }
    } catch (emailError) {
      console.error("[Webhook] Error sending renewal failed email:", emailError)
      // 不阻止 webhook 处理，邮件发送失败不影响订阅状态更新
    }
  } else {
    console.warn("[Webhook] No user email found, skipping notification")
  }

  console.log("[Webhook] Subscription expired processing completed")
  return true
}

