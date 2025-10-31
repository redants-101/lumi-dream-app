"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import confetti from "canvas-confetti"
import { toast } from "sonner"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [verificationFailed, setVerificationFailed] = useState(false)

  useEffect(() => {
    // 触发庆祝动画
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#a855f7", "#ec4899", "#f59e0b"],
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#a855f7", "#ec4899", "#f59e0b"],
      })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // ✅ 轮询验证订阅状态
    let attempts = 0
    const maxAttempts = 10 // 最多轮询 10 次（10 秒）
    
    const checkSubscription = async () => {
      try {
        console.log(`[Success] Checking subscription (attempt ${attempts + 1}/${maxAttempts})`)
        
        const response = await fetch("/api/subscription/manage")
        
        if (!response.ok) {
          throw new Error("Failed to fetch subscription")
        }
        
        const result = await response.json()
        console.log("[Success] Subscription result:", result)
        
        // ✅ 适配统一响应格式：{ success: true, data: {...}, metadata: {...} }
        if (result.success && result.data.tier !== "free") {
          // ✅ 订阅已激活
          console.log("[Success] ✅ Subscription activated:", result.data.tier)
          setSubscriptionTier(result.data.tier)
          setLoading(false)
          toast.success("Subscription activated successfully!")
          return
        }
        
        // 订阅未激活，继续等待
        attempts++
        if (attempts < maxAttempts) {
          console.log("[Success] Subscription not ready, retrying in 1s...")
          setTimeout(checkSubscription, 1000) // 1秒后重试
        } else {
          // ⚠️ 超时，但可能是 webhook 延迟
          console.warn("[Success] ⚠️ Verification timeout, but subscription might still activate")
          setLoading(false)
          setVerificationFailed(true)
          toast.warning("Subscription verification is taking longer than expected. Please check your dashboard.")
        }
      } catch (error) {
        console.error("[Success] Error checking subscription:", error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkSubscription, 1000)
        } else {
          setLoading(false)
          setVerificationFailed(true)
          toast.error("Failed to verify subscription. Please check your dashboard.")
        }
      }
    }
    
    // 延迟 2 秒后开始检查（给 webhook 处理时间）
    setTimeout(checkSubscription, 2000)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center glow-box">
        <CardHeader className="pb-4">
          {loading ? (
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          ) : verificationFailed ? (
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-yellow-500" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          )}
          
          <CardTitle className="text-3xl">
            {loading 
              ? "Activating..." 
              : verificationFailed 
                ? "Payment Received" 
                : "Payment Successful!"}
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            {loading
              ? "We're activating your subscription..."
              : verificationFailed
                ? "Your payment is being processed. It may take a few minutes to activate."
                : `Your ${subscriptionTier?.toUpperCase()} subscription is now active!`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!loading && (
            <>
              <div className="bg-muted rounded-lg p-4 text-sm text-left space-y-2">
                {verificationFailed ? (
                  <>
                    <p>✅ Payment completed</p>
                    <p>⏳ Activation in progress</p>
                    <p>📧 You'll receive a confirmation email</p>
                  </>
                ) : (
                  <>
                    <p>✨ Subscription activated</p>
                    <p>📧 Confirmation email sent</p>
                    <p>🎉 Premium features unlocked</p>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push("/")}
                  size="lg"
                  className="w-full"
                >
                  Start Interpreting Dreams
                </Button>
                
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  View My Subscription
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
