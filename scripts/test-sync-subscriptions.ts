/**
 * 订阅同步测试脚本
 * 
 * 用途：
 * - 测试订阅同步功能
 * - 验证 Creem API 调用
 * - 检查同步日志
 * 
 * 使用方法：
 * pnpm tsx scripts/test-sync-subscriptions.ts
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  console.log("\n🧪 [Test] 订阅同步测试开始\n")

  // 1. 检查环境变量
  console.log("📋 [Test] 检查环境变量...")
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CREEM_API_KEY",
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

  const { data: logs, error: logError } = await supabase
    .from("sync_logs")
    .select("count")
    .limit(1)

  if (logError) {
    console.error("❌ [Test] sync_logs 表不存在:", logError)
    console.log("\n💡 请运行以下 SQL 创建表:")
    console.log("   docs/3.定价支付/订阅同步系统.sql\n")
    process.exit(1)
  }
  console.log("✅ [Test] 数据库表检查通过\n")

  // 3. 检查活跃订阅
  console.log("📋 [Test] 检查活跃订阅...")
  const { data: activeSubscriptions, error: activeError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .in("status", ["active", "canceled"])
    .not("creem_subscription_id", "is", null)
    .limit(5)

  if (activeError) {
    console.error("❌ [Test] 查询活跃订阅失败:", activeError)
    process.exit(1)
  }

  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    console.log("⚠️  [Test] 没有找到活跃订阅")
    console.log("\n💡 提示：")
    console.log("   1. 确保数据库中有 status='active' 或 'canceled' 的订阅")
    console.log("   2. 订阅必须有 creem_subscription_id")
    console.log("\n   你可以手动创建一个测试订阅，或等待真实用户订阅\n")
  } else {
    console.log(`✅ [Test] 找到 ${activeSubscriptions.length} 个活跃订阅`)
    for (const sub of activeSubscriptions) {
      console.log(`   - ${sub.tier} (${sub.billing_cycle}) - Status: ${sub.status} - Creem ID: ${sub.creem_subscription_id}`)
    }
    console.log()
  }

  // 4. 测试同步 API
  console.log("📋 [Test] 测试同步 API...")
  console.log("   调用: http://localhost:3000/api/cron/sync-subscriptions?test=true\n")

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  
  try {
    const response = await fetch(`${apiUrl}/api/cron/sync-subscriptions?test=true`)
    const result = await response.json()

    if (response.ok) {
      console.log("✅ [Test] 同步任务执行成功")
      console.log("\n📊 结果:")
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.error("❌ [Test] 同步任务执行失败")
      console.error(JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error("❌ [Test] 无法连接到 API:", error)
    console.log("\n💡 请确保开发服务器正在运行: pnpm dev\n")
  }

  // 5. 检查同步日志
  console.log("\n📋 [Test] 检查同步日志...")
  const { data: syncLogs, error: syncError } = await supabase
    .from("sync_logs")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(10)

  if (syncError) {
    console.error("❌ [Test] 查询同步日志失败:", syncError)
  } else {
    console.log(`✅ [Test] 找到 ${syncLogs.length} 条同步日志`)
    if (syncLogs.length > 0) {
      console.log("\n最近的同步记录:")
      for (const log of syncLogs) {
        console.log(`   - ${log.sync_type} (${log.completed_at})`)
        console.log(`     检查: ${log.total_checked}, 同步: ${log.synced}, 更新: ${log.updated}, 错误: ${log.errors}`)
      }
    }
  }

  // 6. 检查是否需要同步
  console.log("\n📋 [Test] 检查是否需要同步...")
  const { data: shouldSync } = await supabase.rpc("should_sync", {
    p_sync_type: "subscriptions",
    p_hours_threshold: 6,
  })

  if (shouldSync) {
    console.log("⚠️  [Test] 需要同步（上次同步超过 6 小时）")
  } else {
    console.log("✅ [Test] 无需同步（最近刚同步过）")
  }

  console.log("\n✅ [Test] 测试完成！\n")
}

main().catch((error) => {
  console.error("\n❌ [Test] 测试失败:", error)
  process.exit(1)
})

