/**
 * 测试邮件发送功能
 * 运行命令：npx tsx scripts/test-email.ts
 */

import { Resend } from "resend"

async function testEmail() {
  console.log("📧 Testing email configuration...")
  
  // 检查环境变量
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  
  console.log("\n配置信息:")
  console.log("- API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : "❌ 未配置")
  console.log("- From Email:", fromEmail)
  
  if (!apiKey) {
    console.error("\n❌ 错误: RESEND_API_KEY 未配置")
    console.error("请在 .env.local 中添加:")
    console.error("RESEND_API_KEY=re_xxxxx")
    process.exit(1)
  }
  
  // 初始化 Resend
  const resend = new Resend(apiKey)
  
  // 发送测试邮件
  console.log("\n📤 发送测试邮件...")
  
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: "delivered@resend.dev", // Resend 测试邮箱
      subject: "Lumi Email Service Test",
      html: `
        <h1>✅ Email Service Working!</h1>
        <p>This is a test email from Lumi Dream App.</p>
        <p>If you receive this email, your email service is configured correctly.</p>
        <hr>
        <p>
          <strong>Configuration:</strong><br>
          From: ${fromEmail}<br>
          Time: ${new Date().toISOString()}
        </p>
      `,
      text: "Email Service Test - Your Resend configuration is working correctly!"
    })
    
    if (error) {
      console.error("\n❌ 发送失败:", error)
      process.exit(1)
    }
    
    console.log("\n✅ 邮件发送成功!")
    console.log("- Email ID:", data?.id)
    console.log("\n📬 检查方式:")
    console.log("1. 访问 Resend Dashboard: https://resend.com/emails")
    console.log("2. 查看 'Emails' 标签")
    console.log("3. 应该能看到刚发送的测试邮件")
    
    if (fromEmail === "onboarding@resend.dev") {
      console.log("\n⚠️ 注意:")
      console.log("- 当前使用测试邮箱 (onboarding@resend.dev)")
      console.log("- 邮件只能发送到 'delivered@resend.dev'")
      console.log("- 生产环境需要验证自己的域名")
    }
    
  } catch (err) {
    console.error("\n❌ 错误:", err)
    process.exit(1)
  }
}

// 运行测试
testEmail()

