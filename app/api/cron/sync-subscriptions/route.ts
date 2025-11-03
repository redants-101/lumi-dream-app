import { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { creemClient } from "@/lib/creem-config"

/**
 * 订阅状态同步 Cron Job
 * 
 * 功能：
 * - 每天运行一次（或更频繁）
 * - 从 Creem 获取所有活跃订阅的状态
 * - 对比本地数据库状态
 * - 更新不一致的记录
 * - 记录同步日志
 * 
 * 访问方式：
 * - Vercel Cron: 自动触发
 * - 手动测试: GET /api/cron/sync-subscriptions?test=true
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Secret（生产环境必须）
    const authHeader = request.headers.get("authorization")
    const isTestMode = request.nextUrl.searchParams.get("test") === "true"
    
    if (!isTestMode) {
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret) {
        console.error("[Sync] CRON_SECRET not configured")
        return Response.json({ error: "Cron secret not configured" }, { status: 500 })
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error("[Sync] Unauthorized access attempt")
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("\n🔄 [Subscription Sync] Cron job started")
    console.log(`[Sync] Mode: ${isTestMode ? "TEST" : "PRODUCTION"}`)
    console.log(`[Sync] Time: ${new Date().toISOString()}`)

    const supabase = createServiceClient()
    
    // 1. 查询所有应该活跃的订阅（状态为 active 或 canceled）
    const { data: subscriptions, error: queryError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .in("status", ["active", "canceled"])
      .not("creem_subscription_id", "is", null)

    if (queryError) {
      console.error("[Sync] Failed to query subscriptions:", queryError)
      return Response.json({ error: "Database query failed" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[Sync] No subscriptions to sync")
      return Response.json({
        success: true,
        message: "No subscriptions to sync",
        synced: 0,
        updated: 0,
        errors: 0,
      })
    }

    console.log(`[Sync] Found ${subscriptions.length} subscriptions to check`)

    let syncedCount = 0
    let updatedCount = 0
    let errorCount = 0
    const updates: any[] = []

    // 2. 遍历每个订阅，从 Creem 获取最新状态
    for (const subscription of subscriptions) {
      try {
        console.log(`\n[Sync] Checking subscription: ${subscription.creem_subscription_id}`)
        
        // 从 Creem 获取订阅状态
        const creemSubscription = await creemClient.getSubscription(
          subscription.creem_subscription_id
        )

        syncedCount++

        // 3. 对比状态
        const needsUpdate = shouldUpdateSubscription(subscription, creemSubscription)
        
        if (needsUpdate) {
          console.log(`[Sync] Status mismatch detected for ${subscription.creem_subscription_id}`)
          console.log(`[Sync] Local: ${subscription.status}, Creem: ${creemSubscription.status}`)
          
          // 4. 更新本地数据库
          const updateData = mapCreemToLocal(creemSubscription)
          
          const { error: updateError } = await supabase
            .from("user_subscriptions")
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id)

          if (updateError) {
            console.error(`[Sync] Failed to update subscription ${subscription.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ [Sync] Updated subscription ${subscription.id}`)
            updatedCount++
            
            updates.push({
              subscriptionId: subscription.id,
              userId: subscription.user_id,
              oldStatus: subscription.status,
              newStatus: updateData.status,
              creemId: subscription.creem_subscription_id,
            })
          }
        } else {
          console.log(`[Sync] Subscription ${subscription.creem_subscription_id} is in sync`)
        }
      } catch (error) {
        console.error(`[Sync] Error syncing subscription ${subscription.creem_subscription_id}:`, error)
        errorCount++
      }
    }

    // 5. 记录同步日志
    try {
      await supabase.from("sync_logs").insert({
        sync_type: "subscriptions",
        total_checked: subscriptions.length,
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
        updates: updates.length > 0 ? updates : null,
        completed_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("[Sync] Failed to record sync log:", logError)
      // 不影响主流程
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      mode: isTestMode ? "test" : "production",
      summary: {
        totalChecked: subscriptions.length,
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
      },
      updates: updates.length > 0 ? updates : undefined,
    }

    console.log("\n✅ [Subscription Sync] Cron job completed")
    console.log(JSON.stringify(result, null, 2))

    return Response.json(result)
  } catch (error) {
    console.error("\n❌ [Subscription Sync] Cron job failed:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * 判断是否需要更新本地订阅
 */
function shouldUpdateSubscription(local: any, creem: any): boolean {
  // 检查状态是否不一致
  if (local.status !== creem.status) {
    return true
  }

  // 检查周期结束时间是否不一致（允许 1 小时误差）
  if (local.current_period_end && creem.current_period_end) {
    const localDate = new Date(local.current_period_end)
    const creemDate = new Date(creem.current_period_end)
    const diffMs = Math.abs(localDate.getTime() - creemDate.getTime())
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours > 1) {
      return true
    }
  }

  // 检查层级是否不一致（理论上不应该变，但以防万一）
  // Creem 可能返回 product_id，需要解析
  // 这里简化处理，主要检查状态

  return false
}

/**
 * 将 Creem 订阅数据映射到本地格式
 */
function mapCreemToLocal(creemSubscription: any): any {
  return {
    status: creemSubscription.status, // active, canceled, expired
    current_period_start: creemSubscription.current_period_start,
    current_period_end: creemSubscription.current_period_end,
    // 保留其他字段不变
  }
}

