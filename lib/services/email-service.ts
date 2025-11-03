/**
 * 邮件发送服务
 * 使用 Resend API 发送邮件
 */

import { Resend } from "resend"
import { RenewalReminderEmail } from "@/components/emails/renewal-reminder"
import { RenewalFailedEmail } from "@/components/emails/renewal-failed"

// 初始化 Resend 客户端
const resend = new Resend(process.env.RESEND_API_KEY)

// 发件人配置
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@lumidreams.app"
const FROM_NAME = "Lumi Dream Interpreter"

/**
 * 续费提醒邮件参数
 */
export interface RenewalReminderParams {
  to: string
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
  expirationDate: Date
  daysUntilExpiration: number
}

/**
 * 发送续费提醒邮件
 */
export async function sendRenewalReminderEmail(params: RenewalReminderParams): Promise<boolean> {
  try {
    // 检查 API Key
    if (!process.env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY not configured")
      return false
    }

    console.log(`[Email] Sending renewal reminder to ${params.to}...`)

    // 生成邮件主题
    const subject = getEmailSubject(params.daysUntilExpiration, params.tier)

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: RenewalReminderEmail(params),
      // 备用纯文本版本
      text: getTextContent(params),
    })

    if (error) {
      console.error("[Email] Failed to send email:", error)
      return false
    }

    console.log(`[Email] Email sent successfully. ID: ${data?.id}`)
    return true
  } catch (error) {
    console.error("[Email] Error sending email:", error)
    return false
  }
}

/**
 * 生成邮件主题
 */
function getEmailSubject(daysUntilExpiration: number, tier: string): string {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
  
  if (daysUntilExpiration === 1) {
    return `⏰ Your Lumi ${tierName} subscription expires tomorrow`
  } else if (daysUntilExpiration === 3) {
    return `🔔 Your Lumi ${tierName} subscription expires in 3 days`
  } else if (daysUntilExpiration === 7) {
    return `📅 Your Lumi ${tierName} subscription expires in 7 days`
  } else {
    return `🔔 Your Lumi ${tierName} subscription is expiring soon`
  }
}

/**
 * 生成纯文本邮件内容（备用）
 */
function getTextContent(params: RenewalReminderParams): string {
  const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1)
  const cycleName = params.billingCycle === "monthly" ? "Monthly" : "Yearly"
  const expirationDateStr = params.expirationDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return `
Hi ${params.userName},

This is a friendly reminder that your Lumi ${tierName} ${cycleName} subscription will expire in ${params.daysUntilExpiration} day${params.daysUntilExpiration > 1 ? "s" : ""}.

Expiration Date: ${expirationDateStr}

Your subscription will automatically renew, so you don't need to take any action. Your saved payment method will be charged on the renewal date.

If you need to update your payment method or have any questions, please visit your dashboard:
https://www.lumidreams.app/dashboard

Thank you for being a valued Lumi user! ✨

Best regards,
The Lumi Team

---

If you wish to cancel your subscription, you can do so anytime from your dashboard.
  `.trim()
}

/**
 * 续费失败通知邮件参数
 */
export interface RenewalFailedParams {
  to: string
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
  failureDate: Date
  failureReason?: string
}

/**
 * 发送续费失败通知邮件
 */
export async function sendRenewalFailedEmail(params: RenewalFailedParams): Promise<boolean> {
  try {
    // 检查 API Key
    if (!process.env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY not configured")
      return false
    }

    console.log(`[Email] Sending renewal failed notification to ${params.to}...`)

    const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1)

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `⚠️ Your Lumi ${tierName} subscription renewal failed`,
      react: RenewalFailedEmail(params),
      // 备用纯文本版本
      text: getRenewalFailedTextContent(params),
    })

    if (error) {
      console.error("[Email] Failed to send renewal failed email:", error)
      return false
    }

    console.log(`[Email] Renewal failed email sent successfully. ID: ${data?.id}`)
    return true
  } catch (error) {
    console.error("[Email] Error sending renewal failed email:", error)
    return false
  }
}

/**
 * 生成续费失败邮件纯文本内容（备用）
 */
function getRenewalFailedTextContent(params: RenewalFailedParams): string {
  const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1)
  const cycleName = params.billingCycle === "monthly" ? "Monthly" : "Yearly"
  const failureDateStr = params.failureDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return `
Hi ${params.userName},

SUBSCRIPTION RENEWAL FAILED

We tried to renew your ${tierName} ${cycleName} subscription, but the payment could not be processed.

Failure Details:
- Plan: ${tierName} ${cycleName}
- Attempted Date: ${failureDateStr}
- Status: Payment Failed
${params.failureReason ? `- Reason: ${params.failureReason}` : ""}

What this means:
• Your subscription has been canceled
• You've been downgraded to the Free tier
• Your account is limited to 10 interpretations per month

Common reasons for payment failure:
• Expired credit card
• Insufficient funds
• Card was declined by your bank
• Incorrect billing information

To reactivate your subscription, please update your payment method:
https://www.lumidreams.app/dashboard

If you update your payment method and resubscribe within the next 7 days, 
you can continue where you left off with no interruption.

Need help?
If you believe this was an error or need assistance, please contact us at:
support@lumidreams.app

We'd love to have you back! ✨

Best regards,
The Lumi Team

---

If you didn't expect this email or have questions, please contact our support team.
  `.trim()
}

/**
 * 发送订阅激活确认邮件
 */
export async function sendSubscriptionConfirmationEmail(params: {
  to: string
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
}): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY not configured")
      return false
    }

    const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1)
    const cycleName = params.billingCycle === "monthly" ? "Monthly" : "Yearly"

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `🎉 Welcome to Lumi ${tierName}!`,
      text: `
Hi ${params.userName},

Welcome to Lumi ${tierName} ${cycleName}!

Your subscription is now active. You can start enjoying all the premium features right away.

Visit your dashboard: https://www.lumidreams.app/dashboard

Thank you for subscribing!

Best regards,
The Lumi Team
      `.trim(),
    })

    if (error) {
      console.error("[Email] Failed to send confirmation email:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[Email] Error sending confirmation email:", error)
    return false
  }
}

