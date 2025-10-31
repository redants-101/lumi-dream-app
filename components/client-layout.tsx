/**
 * 客户端 Layout 组件
 * 包含所有需要客户端状态的 Provider
 */

"use client"

import { UsageLimitProvider } from "@/contexts/usage-limit-context"
import { Navigation } from "@/components/navigation"
import { CookieConsent } from "@/components/cookie-consent"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UsageLimitProvider>
      <Navigation />
      <Suspense fallback={null}>{children}</Suspense>
      <Toaster />
      <CookieConsent />
    </UsageLimitProvider>
  )
}

