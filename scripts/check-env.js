/**
 * 环境变量检查脚本
 * 用于验证所有必需的环境变量是否正确配置
 */

console.log("\n🔍 检查环境变量配置...\n")

const requiredVars = {
  "Creem API": [
    { name: "CREEM_API_KEY", format: "creem_sk_xxx 或 creem_test_sk_xxx" },
    { name: "CREEM_API_URL", format: "https://api.creem.io", optional: true },
    { name: "CREEM_WEBHOOK_SECRET", format: "whsec_xxx" },
  ],
  "Creem 产品 ID": [
    { name: "CREEM_BASIC_MONTHLY_PRODUCT_ID", format: "prod_xxx" },
    { name: "CREEM_BASIC_YEARLY_PRODUCT_ID", format: "prod_xxx" },
    { name: "CREEM_PRO_MONTHLY_PRODUCT_ID", format: "prod_xxx" },
    { name: "CREEM_PRO_YEARLY_PRODUCT_ID", format: "prod_xxx" },
  ],
  "应用配置": [
    { name: "NEXT_PUBLIC_APP_URL", format: "http://localhost:3000" },
  ],
  "Supabase": [
    { name: "NEXT_PUBLIC_SUPABASE_URL", format: "https://xxx.supabase.co" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", format: "eyJxxx..." },
  ],
}

let hasErrors = false
let missingCount = 0

for (const [category, vars] of Object.entries(requiredVars)) {
  console.log(`\n📦 ${category}:`)
  console.log("─".repeat(60))
  
  for (const { name, format, optional } of vars) {
    const value = process.env[name]
    
    if (!value) {
      if (optional) {
        console.log(`⚠️  ${name}: 未设置（可选，将使用默认值）`)
        console.log(`   格式: ${format}`)
      } else {
        console.log(`❌ ${name}: 未设置（必需）`)
        console.log(`   格式: ${format}`)
        hasErrors = true
        missingCount++
      }
    } else {
      // 隐藏敏感信息
      let displayValue = value
      if (name.includes("KEY") || name.includes("SECRET")) {
        displayValue = `${value.substring(0, 12)}...${value.slice(-4)}`
      } else if (value.length > 50) {
        displayValue = `${value.substring(0, 30)}...`
      }
      console.log(`✅ ${name}: ${displayValue}`)
    }
  }
}

console.log("\n" + "=".repeat(60))

if (hasErrors) {
  console.log(`\n❌ 发现 ${missingCount} 个缺失的环境变量！`)
  console.log("\n📝 解决步骤:")
  console.log("1. 在项目根目录创建 .env.local 文件")
  console.log("2. 复制 env.example 的内容到 .env.local")
  console.log("3. 从 Creem 后台获取实际的配置值")
  console.log("4. 替换所有 your_xxx_here 占位符")
  console.log("5. 重启开发服务器: pnpm dev")
  console.log("\n📚 详细文档: docs/3.定价支付/Creem快速开始指南.md\n")
  process.exit(1)
} else {
  console.log("\n✅ 所有环境变量配置正确！\n")
  process.exit(0)
}

