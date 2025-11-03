/**
 * 续费提醒系统测试脚本
 * 
 * 用途：
 * - 本地测试续费提醒功能
 * - 验证邮件发送
 * - 检查数据库记录
 * 
 * 使用方法：
 * pnpm tsx scripts/test-renewal-reminders.ts
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  console.log("\n🧪 [Test] 续费提醒系统测试开始\n")

  // 1. 检查环境变量
  console.log("📋 [Test] 检查环境变量...")
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "CRON_SECRET",
  ]

  const missing: string[] = []
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    console.error("❌ [Test] 缺少环境变量:", missing.join(", "))
    process.exit(1)
  }
  console.log("✅ [Test] 所有环境变量已配置\n")

  // 2. 检查数据库表
  console.log("📋 [Test] 检查数据库表...")
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: subscriptions, error: subError } = await supabase
    .from("user_subscriptions")
    .select("count")
    .limit(1)

  if (subError) {
    console.error("❌ [Test] user_subscriptions 表不存在:", subError)
    process.exit(1)
  }

  const { data: reminders, error: remError } = await supabase
    .from("renewal_reminders")
    .select("count")
    .limit(1)

  if (remError) {
    console.error("❌ [Test] renewal_reminders 表不存在:", remError)
    console.log("\n💡 请运行以下 SQL 创建表:")
    console.log("   docs/3.定价支付/续费提醒系统完整.sql\n")
    process.exit(1)
  }
  console.log("✅ [Test] 数据库表检查通过\n")

  // 3. 创建测试订阅（即将到期）
  console.log("📋 [Test] 检查测试订阅...")
  
  // 计算 7 天后的日期
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  sevenDaysLater.setHours(12, 0, 0, 0)

  const { data: testSubs, error: testSubError } = await supabase
    .from("user_subscriptions")
    .select("*, user:user_id(email)")
    .eq("status", "active")
    .gte("current_period_end", new Date(sevenDaysLater.getTime() - 3600000).toISOString())
    .lte("current_period_end", new Date(sevenDaysLater.getTime() + 3600000).toISOString())
    .limit(5)

  if (testSubError) {
    console.error("❌ [Test] 查询测试订阅失败:", testSubError)
    process.exit(1)
  }

  if (!testSubs || testSubs.length === 0) {
    console.log("⚠️  [Test] 没有找到即将到期的订阅")
    console.log("\n💡 提示：")
    console.log("   1. 确保数据库中有 status='active' 的订阅")
    console.log("   2. 订阅的 current_period_end 应该在 7 天后")
    console.log("\n   你可以手动创建一个测试订阅，或等待真实用户订阅\n")
  } else {
    console.log(`✅ [Test] 找到 ${testSubs.length} 个即将到期的订阅`)
    for (const sub of testSubs) {
      const user = sub.user as any
      console.log(`   - ${sub.tier} (${sub.billing_cycle}) - ${user?.email} - 到期: ${sub.current_period_end}`)
    }
    console.log()
  }

  // 4. 测试 Cron Job API
  console.log("📋 [Test] 测试 Cron Job API...")
  console.log("   调用: http://localhost:3000/api/cron/renewal-reminders?test=true\n")

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  
  try {
    const response = await fetch(`${apiUrl}/api/cron/renewal-reminders?test=true`)
    const result = await response.json()

    if (response.ok) {
      console.log("✅ [Test] Cron Job 执行成功")
      console.log("\n📊 结果:")
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.error("❌ [Test] Cron Job 执行失败")
      console.error(JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error("❌ [Test] 无法连接到 API:", error)
    console.log("\n💡 请确保开发服务器正在运行: pnpm dev\n")
  }

  // 5. 检查提醒记录
  console.log("\n📋 [Test] 检查提醒记录...")
  const { data: reminderRecords, error: reminderError } = await supabase
    .from("renewal_reminders")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(10)

  if (reminderError) {
    console.error("❌ [Test] 查询提醒记录失败:", reminderError)
  } else {
    console.log(`✅ [Test] 找到 ${reminderRecords.length} 条提醒记录`)
    if (reminderRecords.length > 0) {
      console.log("\n最近的提醒记录:")
      for (const record of reminderRecords) {
        console.log(`   - ${record.reminder_type} → ${record.email_to} (${record.sent_at})`)
      }
    }
  }

  console.log("\n✅ [Test] 测试完成！\n")
}

main().catch((error) => {
  console.error("\n❌ [Test] 测试失败:", error)
  process.exit(1)
})

