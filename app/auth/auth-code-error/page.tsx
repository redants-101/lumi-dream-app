/**
 * 认证错误页面
 * 当 OAuth 认证失败时显示
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mb-6">
            Sorry, we couldn't complete the authentication process. Please try again.
          </p>
          <Button asChild>
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

