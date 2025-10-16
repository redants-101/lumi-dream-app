import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
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
  keywords: [
    "dream interpretation",
    "AI dream analysis",
    "dream meanings",
    "dream decoder",
    "sleep psychology",
    "subconscious mind",
    "dream journal",
    "lucid dreaming",
  ],
  authors: [{ name: "Lumi Dream Team" }],
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
        url: "/logo/Lumi-Rectangles.png",
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
    images: ["/logo/Lumi-Rectangles.png"],
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
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
