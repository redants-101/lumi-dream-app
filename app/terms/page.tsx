import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Lumi Dream Interpreter",
}

export default function TermsPage() {
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@lumidreams.app"
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumidreams.app"
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Introduction</h2>
              <p className="text-foreground/90 leading-relaxed">
                These Terms of Service ("Terms") govern your use of Lumi, an AI-powered dream interpretation service. By accessing or using Lumi, you agree to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Subscription and Billing</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>Paid plans are billed on a recurring basis (monthly or yearly) until canceled.</li>
                <li>Renewals are processed automatically on the renewal date using your saved payment method.</li>
                <li>Pricing is displayed clearly on our <Link href="/pricing" className="text-primary">Pricing</Link> page.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Cancellations and Refunds</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>You may cancel at any time from the <Link href="/dashboard" className="text-primary">Dashboard</Link>.</li>
                <li>Upon cancellation, access continues until the end of the current billing period.</li>
                <li>We offer a 14-day money-back guarantee for first-time purchases of paid plans. To request a refund, contact <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary">{SUPPORT_EMAIL}</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Chargebacks and Disputes</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>If you believe a charge was made in error, please contact us first at <a href="mailto:support@lumidreams.app" className="text-primary">support@lumidreams.app</a>.</li>
                <li>Unauthorized chargebacks may result in account suspension pending resolution.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Acceptable Use</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>Use Lumi in a lawful, fair, and non-deceptive manner.</li>
                <li>Lumi does not permit prohibited content or activities (e.g., NSFW/pornographic content, illegal or regulated products, or deceptive practices).</li>
                <li>Lumi is intended for entertainment and self-exploration purposes and is not a substitute for professional advice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Intellectual Property</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>All site content, branding, and materials are owned by Lumi or its licensors.</li>
                <li>You may not reproduce, distribute, or create derivative works without prior permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Limitation of Liability</h2>
              <p className="text-foreground/90 leading-relaxed">
                To the maximum extent permitted by law, Lumi shall not be liable for indirect, incidental, or consequential damages arising from your use of the service. Interpretations are generated by AI and may not be accurate or complete.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Privacy</h2>
              <p className="text-foreground/90 leading-relaxed">
                For details on how we collect and process data, please review our <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
              <div className="bg-accent/5 border border-border rounded-lg p-4 text-foreground/90">
                <p><strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary">{SUPPORT_EMAIL}</a></p>
                <p><strong>Website:</strong> {SITE_URL}</p>
              </div>
            </section>

            <section className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Disclaimer</h3>
              <p className="text-sm text-muted-foreground italic">
                Lumi is an entertainment and self-exploration tool. Our AI-powered interpretations are not a substitute for professional psychological counseling, therapy, or medical advice.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Return to Dream Interpretation
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
