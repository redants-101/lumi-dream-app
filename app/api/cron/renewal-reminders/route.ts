import { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendRenewalReminderEmail } from "@/lib/services/email-service"

/**
 * 续费提醒 Cron Job
 * 
 * 功能：
 * - 每天运行一次
 * - 检查即将到期的订阅（7天、3天、1天前）
 * - 发送提醒邮件
 * 
 * 访问方式：
 * - Vercel Cron: 自动触发
 * - 手动测试: GET /api/cron/renewal-reminders?test=true
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Secret（生产环境必须）
    const authHeader = request.headers.get("authorization")
    const isTestMode = request.nextUrl.searchParams.get("test") === "true"
    
    if (!isTestMode) {
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret) {
        console.error("[Cron] CRON_SECRET not configured")
        return Response.json({ error: "Cron secret not configured" }, { status: 500 })
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error("[Cron] Unauthorized access attempt")
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("\n🔔 [Renewal Reminders] Cron job started")
    console.log(`[Renewal Reminders] Mode: ${isTestMode ? "TEST" : "PRODUCTION"}`)
    console.log(`[Renewal Reminders] Time: ${new Date().toISOString()}`)

    const supabase = createServiceClient()
    
    // 计算提醒时间点（7天后、3天后、1天后）
    const now = new Date()
    const reminders = [
      { days: 7, type: "7_days" as const },
      { days: 3, type: "3_days" as const },
      { days: 1, type: "1_day" as const },
    ]

    let totalSent = 0
    let totalErrors = 0
    const results: any[] = []

    // 遍历每个提醒时间点
    for (const reminder of reminders) {
      console.log(`\n📅 [Renewal Reminders] Checking subscriptions expiring in ${reminder.days} days...`)
      
      // 计算目标日期范围（允许 1 小时误差）
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + reminder.days)
      
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      console.log(`[Renewal Reminders] Target date range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`)

      // 查询即将到期的订阅
      const { data: subscriptions, error: queryError } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          user:user_id (
            id,
            email,
            user_metadata
          )
        `)
        .eq("status", "active")
        .gte("current_period_end", startOfDay.toISOString())
        .lte("current_period_end", endOfDay.toISOString())

      if (queryError) {
        console.error(`[Renewal Reminders] Query error:`, queryError)
        totalErrors++
        continue
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[Renewal Reminders] No subscriptions expiring in ${reminder.days} days`)
        results.push({
          reminderType: reminder.type,
          count: 0,
          sent: 0,
        })
        continue
      }

      console.log(`[Renewal Reminders] Found ${subscriptions.length} subscriptions expiring in ${reminder.days} days`)

      // 发送提醒邮件
      let sentCount = 0
      for (const subscription of subscriptions) {
        try {
          const user = subscription.user as any
          
          if (!user || !user.email) {
            console.warn(`[Renewal Reminders] No email for user ${subscription.user_id}`)
            continue
          }

          // 检查是否已发送过此提醒
          const reminderKey = `${subscription.id}_${reminder.type}`
          const { data: existingReminder } = await supabase
            .from("renewal_reminders")
            .select("id")
            .eq("subscription_id", subscription.id)
            .eq("reminder_type", reminder.type)
            .single()

          if (existingReminder) {
            console.log(`[Renewal Reminders] Already sent ${reminder.type} reminder for subscription ${subscription.id}`)
            continue
          }

          console.log(`[Renewal Reminders] Sending ${reminder.type} reminder to ${user.email}...`)

          // 发送邮件
          const emailSent = await sendRenewalReminderEmail({
            to: user.email,
            userName: user.user_metadata?.full_name || user.email.split('@')[0],
            tier: subscription.tier,
            billingCycle: subscription.billing_cycle,
            expirationDate: new Date(subscription.current_period_end),
            daysUntilExpiration: reminder.days,
          })

          if (emailSent) {
            // 记录已发送的提醒
            await supabase.from("renewal_reminders").insert({
              subscription_id: subscription.id,
              user_id: subscription.user_id,
              reminder_type: reminder.type,
              sent_at: new Date().toISOString(),
              email_to: user.email,
            })

            sentCount++
            console.log(`✅ [Renewal Reminders] Sent ${reminder.type} reminder to ${user.email}`)
          }
        } catch (error) {
          console.error(`[Renewal Reminders] Error sending reminder:`, error)
          totalErrors++
        }
      }

      totalSent += sentCount
      results.push({
        reminderType: reminder.type,
        count: subscriptions.length,
        sent: sentCount,
      })

      console.log(`[Renewal Reminders] Sent ${sentCount}/${subscriptions.length} ${reminder.type} reminders`)
    }

    // 返回结果
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      mode: isTestMode ? "test" : "production",
      results,
      totalChecked: results.reduce((sum, r) => sum + r.count, 0),
      totalSent,
      totalErrors,
    }

    console.log("\n✅ [Renewal Reminders] Cron job completed")
    console.log(JSON.stringify(summary, null, 2))

    return Response.json(summary)
  } catch (error) {
    console.error("\n❌ [Renewal Reminders] Cron job failed:", error)
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

