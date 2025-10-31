import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import { ClientLayout } from "@/components/client-layout"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.lumidreams.app"),
  title: {
    default: "Lumi - AI Dream Interpretation",
    template: "%s | Lumi",
  },
  description: "Discover the hidden meanings in your dreams with AI-powered interpretation. Illuminate your subconscious with Lumi's warm, empathetic dream analysis.",
  icons: {
    icon: [
      { url: "/logo/Lumi-Squares4.png", type: "image/png" },
      { url: "/logo/Lumi-Squares4.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/Lumi-Squares4.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo/Lumi-Squares4.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    // 核心服务词（差异化 + AI 特色）
    "AI dream interpretation",
    "dream interpretation",
    // 用户行为词（自然语言搜索）
    "interpret dreams",
    "dream analysis",
    // 价值输出词（转化导向）
    "dream insights",
    "dream meanings",
    // 专业背景词（建立信任）
    "psychological dream analysis",
    "AI-powered insights",
    // 相关功能词（扩展流量）
    "dream journal",
    "sleep psychology",
  ],
  authors: [{ name: "Lumi Dreams Team" }],
  creator: "Lumi",
  publisher: "Lumi",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Lumi - AI Dream Interpretation",
    description: "Discover the hidden meanings in your dreams with AI-powered interpretation",
    siteName: "Lumi",
    images: [
      {
        url: "/logo/Lumi-Rectangles2.jpeg",
        width: 1200,
        height: 630,
        alt: "Lumi - AI Dream Interpretation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumi - AI Dream Interpretation",
    description: "Discover the hidden meanings in your dreams with AI-powered interpretation",
    images: ["/logo/Lumi-Rectangles2.jpeg"],
    creator: "@lumidreams",
  },
  alternates: {
    canonical: "/",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${nunito.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
