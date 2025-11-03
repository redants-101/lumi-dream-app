/**
 * 续费失败通知邮件模板
 * 当订阅续费支付失败时发送
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

interface RenewalFailedEmailProps {
  userName: string
  tier: "basic" | "pro"
  billingCycle: "monthly" | "yearly"
  failureDate: Date
  failureReason?: string
}

export const RenewalFailedEmail = ({
  userName = "Friend",
  tier = "basic",
  billingCycle = "monthly",
  failureDate = new Date(),
  failureReason = "Payment declined",
}: RenewalFailedEmailProps) => {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
  const cycleName = billingCycle === "monthly" ? "Monthly" : "Yearly"
  
  const failureDateStr = failureDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const previewText = `Your Lumi ${tierName} subscription renewal failed - Update payment method`

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
            {/* Alert Icon */}
            <Section style={alertSection}>
              <Text style={alertIcon}>⚠️</Text>
              <Heading style={h1}>Subscription Renewal Failed</Heading>
            </Section>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              We tried to renew your <strong>{tierName} {cycleName}</strong> subscription, but the payment could not be processed.
            </Text>

            {/* Failure Details Card */}
            <Section style={card}>
              <Text style={cardTitle}>Failure Details</Text>
              <Section style={detailRow}>
                <Text style={detailLabel}>Plan:</Text>
                <Text style={detailValue}>{tierName} {cycleName}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Attempted Date:</Text>
                <Text style={detailValue}>{failureDateStr}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Status:</Text>
                <Text style={{...detailValue, ...statusFailed}}>Payment Failed</Text>
              </Section>
              {failureReason && (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Reason:</Text>
                  <Text style={detailValue}>{failureReason}</Text>
                </Section>
              )}
            </Section>

            <Text style={paragraph}>
              <strong>What this means:</strong>
            </Text>

            <Section style={bulletList}>
              <Text style={bulletItem}>• Your subscription has been canceled</Text>
              <Text style={bulletItem}>• You've been downgraded to the Free tier</Text>
              <Text style={bulletItem}>• Your account is limited to 10 interpretations per month</Text>
            </Section>

            <Text style={paragraph}>
              <strong>Common reasons for payment failure:</strong>
            </Text>

            <Section style={bulletList}>
              <Text style={bulletItem}>• Expired credit card</Text>
              <Text style={bulletItem}>• Insufficient funds</Text>
              <Text style={bulletItem}>• Card was declined by your bank</Text>
              <Text style={bulletItem}>• Incorrect billing information</Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button
                style={buttonPrimary}
                href="https://www.lumidreams.app/dashboard"
              >
                Update Payment Method
              </Button>
            </Section>

            <Text style={paragraph}>
              If you update your payment method and resubscribe within the next 7 days, you can continue where you left off with no interruption.
            </Text>

            <Section style={divider} />

            <Text style={helpText}>
              <strong>Need help?</strong>
            </Text>
            
            <Text style={paragraph}>
              If you believe this was an error or need assistance updating your payment information, please contact us at <a href="mailto:support@lumidreams.app" style={link}>support@lumidreams.app</a>
            </Text>

            <Text style={paragraph}>
              We'd love to have you back! ✨
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              If you didn't expect this email or have questions, please contact our support team.
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

export default RenewalFailedEmail

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

const alertSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
}

const alertIcon = {
  fontSize: "48px",
  margin: "0 0 16px 0",
}

const h1 = {
  color: "#ef4444",
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
  color: "#ef4444",
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

const statusFailed = {
  color: "#ef4444",
}

const bulletList = {
  margin: "16px 0",
}

const bulletItem = {
  color: "#d1d5db",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 8px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const buttonPrimary = {
  backgroundColor: "#e6b980",
  borderRadius: "6px",
  color: "#0a0a1a",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  boxShadow: "0 0 20px rgba(230, 185, 128, 0.3)",
}

const divider = {
  borderTop: "1px solid #2d2d44",
  margin: "32px 0",
}

const helpText = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px 0",
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

