import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Lumi collects, uses, and protects your personal information.",
}

/**
 * 隐私政策页面
 * 
 * 符合 GDPR/CCPA 法规要求的隐私政策声明
 * 包含：数据收集、使用、存储、用户权利等关键信息
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl glow-purple" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl glow-box" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* 主内容 */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-4xl font-bold text-foreground mb-4 glow-text">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last Updated: October 17, 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-6">
            {/* 介绍 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Introduction</h2>
              <p className="text-foreground/90 leading-relaxed">
                Welcome to Lumi ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information. This Privacy Policy explains our practices regarding data collection when you use our AI-powered dream interpretation service.
              </p>
            </section>

            {/* 数据收集 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-foreground mb-2">1. Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 mb-4">
                <li><strong>Dream Descriptions:</strong> The dream content you submit for interpretation</li>
                <li><strong>Optional Information:</strong> Any additional context you choose to provide</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2">2. Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li><strong>Usage Data:</strong> How you interact with our service (via Vercel Analytics)</li>
                <li><strong>Device Information:</strong> Browser type, device type, operating system</li>
                <li><strong>Performance Data:</strong> Page load times and site performance metrics</li>
                <li><strong>Cookies:</strong> Small data files stored on your device (see Cookie Policy below)</li>
              </ul>
            </section>

            {/* 数据使用 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li><strong>Provide Service:</strong> Process your dream descriptions and generate AI-powered interpretations</li>
                <li><strong>Improve Experience:</strong> Analyze usage patterns to enhance our service quality</li>
                <li><strong>Technical Operations:</strong> Monitor site performance and diagnose technical issues</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
              </ul>
            </section>

            {/* Cookie 政策 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Cookie Policy</h2>
              <p className="text-foreground/90 leading-relaxed mb-3">
                We use cookies and similar tracking technologies to enhance your browsing experience. Here's what we use:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li><strong>Essential Cookies:</strong> Remember your cookie consent preference</li>
                <li><strong>Analytics Cookies:</strong> Understand how visitors interact with our site (Vercel Analytics)</li>
                <li><strong>Performance Cookies:</strong> Monitor site speed and performance (Vercel Speed Insights)</li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-3">
                You can control cookies through your browser settings or our cookie consent banner.
              </p>
            </section>

            {/* 数据共享 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Information Sharing and Disclosure</h2>
              <h3 className="text-xl font-semibold text-foreground mb-2">Third-Party Service Providers:</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li><strong>OpenRouter:</strong> AI service provider that processes dream interpretations</li>
                <li><strong>Vercel:</strong> Hosting and analytics platform</li>
                <li><strong>Google (via OpenRouter):</strong> AI model provider (Gemini 2.0 Flash)</li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-3">
                <strong>We do NOT:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>Sell your personal information to third parties</li>
                <li>Store your dream descriptions permanently (processed in real-time only)</li>
                <li>Share your data for advertising purposes</li>
              </ul>
            </section>

            {/* 数据安全 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Data Security</h2>
              <p className="text-foreground/90 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 mt-2">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure API connections with third-party services</li>
                <li>Regular security updates and monitoring</li>
                <li>No permanent storage of dream content</li>
              </ul>
            </section>

            {/* 用户权利 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Your Privacy Rights</h2>
              <p className="text-foreground/90 leading-relaxed mb-3">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Opt-Out:</strong> Decline analytics cookies via our consent banner</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-3">
                <strong>California Residents (CCPA):</strong> You have additional rights under the California Consumer Privacy Act.
              </p>
              <p className="text-foreground/90 leading-relaxed">
                <strong>EU Residents (GDPR):</strong> You have additional rights under the General Data Protection Regulation.
              </p>
            </section>

            {/* 数据保留 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Data Retention</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li><strong>Dream Descriptions:</strong> Processed in real-time and not stored by us</li>
                <li><strong>Analytics Data:</strong> Retained as anonymized aggregate data</li>
                <li><strong>Cookie Consent:</strong> Stored locally in your browser until you clear it</li>
              </ul>
            </section>

            {/* 儿童隐私 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Children's Privacy</h2>
              <p className="text-foreground/90 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            {/* 政策更新 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Changes to This Privacy Policy</h2>
              <p className="text-foreground/90 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* 联系方式 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Contact Us</h2>
              <p className="text-foreground/90 leading-relaxed mb-2">
                If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
              </p>
              <div className="bg-accent/5 border border-border rounded-lg p-4 text-foreground/90">
                <p><strong>Email:</strong> privacy@lumidreams.app</p>
                <p><strong>Website:</strong> www.lumidreams.app</p>
              </div>
            </section>

            {/* 免责声明 */}
            <section className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Important Disclaimer</h3>
              <p className="text-sm text-muted-foreground italic">
                Lumi is an entertainment and self-exploration tool. Our AI-powered dream interpretations are not a substitute for professional psychological counseling, therapy, or medical advice. If you are experiencing mental health concerns, please consult a qualified healthcare professional.
              </p>
            </section>
          </div>
        </div>

        {/* 返回按钮（底部） */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-box">
              Return to Dream Interpretation
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

