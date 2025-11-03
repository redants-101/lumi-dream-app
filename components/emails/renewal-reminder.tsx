/**
 * 续费提醒邮件模板
 * 使用 React Email 组件
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface RenewalReminderEmailProps {
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
  expirationDate: Date
  daysUntilExpiration: number
}

export const RenewalReminderEmail = ({
  userName = "Friend",
  tier = "basic",
  billingCycle = "monthly",
  expirationDate = new Date(),
  daysUntilExpiration = 7,
}: RenewalReminderEmailProps) => {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
  const cycleName = billingCycle === "monthly" ? "Monthly" : "Yearly"
  
  const expirationDateStr = expirationDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const previewText = `Your Lumi ${tierName} subscription expires in ${daysUntilExpiration} day${daysUntilExpiration > 1 ? "s" : ""}`

  // 根据天数选择合适的标题和说明
  let title = ""
  let description = ""
  let urgency = ""

  if (daysUntilExpiration === 1) {
    title = "⏰ Your subscription expires tomorrow"
    description = "This is your final reminder - your subscription will renew automatically in 24 hours."
    urgency = "Tomorrow"
  } else if (daysUntilExpiration === 3) {
    title = "🔔 Your subscription expires in 3 days"
    description = "Your subscription will automatically renew in 3 days. No action needed on your part!"
    urgency = "In 3 Days"
  } else {
    title = "📅 Your subscription expires in 7 days"
    description = "Just a heads up - your subscription will automatically renew in one week."
    urgency = "In 7 Days"
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Brand */}
          <Section style={header}>
            <Heading style={logo}>✨ Lumi</Heading>
            <Text style={tagline}>Dream Interpretation</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>{title}</Heading>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>{description}</Text>

            {/* Subscription Details Card */}
            <Section style={card}>
              <Text style={cardTitle}>Subscription Details</Text>
              <Section style={detailRow}>
                <Text style={detailLabel}>Plan:</Text>
                <Text style={detailValue}>{tierName} {cycleName}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Renewal Date:</Text>
                <Text style={detailValue}>{expirationDateStr}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Status:</Text>
                <Text style={{...detailValue, ...statusActive}}>Renews {urgency}</Text>
              </Section>
            </Section>

            <Text style={paragraph}>
              Your saved payment method will be charged automatically. You don't need to do anything!
            </Text>

            {/* CTA Buttons */}
            <Section style={buttonContainer}>
              <Button
                style={buttonPrimary}
                href="https://www.lumidreams.app/dashboard"
              >
                View Dashboard
              </Button>
            </Section>

            <Text style={paragraph}>
              Need to update your payment method or manage your subscription?
            </Text>

            <Section style={buttonContainer}>
              <Button
                style={buttonSecondary}
                href="https://www.lumidreams.app/dashboard"
              >
                Manage Subscription
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Thank you for being a valued Lumi user! ✨
            </Text>
            <Text style={footerText}>
              If you have any questions, reply to this email or visit our support page.
            </Text>
            <Text style={footerLinks}>
              <a href="https://www.lumidreams.app/privacy" style={link}>Privacy Policy</a>
              {" • "}
              <a href="https://www.lumidreams.app/terms" style={link}>Terms of Service</a>
              {" • "}
              <a href="https://www.lumidreams.app/contact" style={link}>Contact Us</a>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Lumi Dream Interpreter. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default RenewalReminderEmail

// Styles
const main = {
  backgroundColor: "#0a0a1a",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
}

const header = {
  textAlign: "center" as const,
  marginBottom: "40px",
}

const logo = {
  color: "#e6b980",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0",
  textAlign: "center" as const,
}

const tagline = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "8px 0 0 0",
  textAlign: "center" as const,
}

const content = {
  backgroundColor: "#1a1a2e",
  borderRadius: "12px",
  padding: "40px",
  border: "1px solid #2d2d44",
}

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
}

const greeting = {
  color: "#ffffff",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
}

const paragraph = {
  color: "#d1d5db",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
}

const card = {
  backgroundColor: "#0f0f1e",
  border: "1px solid #2d2d44",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
}

const cardTitle = {
  color: "#e6b980",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
}

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
}

const detailLabel = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "0",
}

const detailValue = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
}

const statusActive = {
  color: "#10b981",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const buttonPrimary = {
  backgroundColor: "#e6b980",
  borderRadius: "6px",
  color: "#0a0a1a",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  boxShadow: "0 0 20px rgba(230, 185, 128, 0.3)",
}

const buttonSecondary = {
  backgroundColor: "transparent",
  border: "1px solid #2d2d44",
  borderRadius: "6px",
  color: "#d1d5db",
  fontSize: "15px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
}

const footer = {
  marginTop: "40px",
  textAlign: "center" as const,
}

const footerText = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px 0",
}

const footerLinks = {
  color: "#9ca3af",
  fontSize: "13px",
  margin: "16px 0 8px 0",
}

const link = {
  color: "#e6b980",
  textDecoration: "none",
}

const footerCopyright = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "8px 0 0 0",
}

