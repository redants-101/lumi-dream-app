"use client"

import { useState, useEffect } from "react"
import { Check, Sparkles, Moon, Zap, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PRICING_PAGE_DATA, calculateYearlySavings } from "@/lib/pricing-config"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Google 图标组件（SVG）
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const { user, signInWithGithub, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  
  // 保存用户选择的套餐信息（登录后继续）
  const [pendingSubscription, setPendingSubscription] = useState<{
    tier: string
    cycle: "monthly" | "yearly"
  } | null>(null)

  // ✅ 监听用户登录状态变化，登录后自动继续订阅流程
  useEffect(() => {
    if (user && pendingSubscription) {
      console.log("[Pricing] 🎉 User logged in successfully!")
      console.log("[Pricing] 🚀 Auto-continuing subscription:", pendingSubscription)
      
      // 显示友好的提示
      toast.success("Welcome back! Redirecting to checkout...", {
        duration: 2000,
      })
      
      // 短暂延迟，让用户看到欢迎消息
      setTimeout(() => {
        handleSubscribe(pendingSubscription.tier, pendingSubscription.cycle)
        setPendingSubscription(null)
      }, 500)
    }
  }, [user, pendingSubscription])

  const handleSubscribe = async (tier: string, cycle: "monthly" | "yearly") => {
    // ✅ 统一检查：如果用户未登录，显示登录对话框
    if (!user) {
      console.log("[Pricing] User not logged in, showing login dialog")
      setPendingSubscription({ tier, cycle })
      setShowLoginDialog(true)
      return
    }

    // ✅ 用户已登录，根据不同套餐执行不同操作
    
    // Free 套餐：跳转到首页
    if (tier === "free") {
      router.push("/")
      toast.success("You're using the free tier. Start interpreting your dreams!")
      return
    }

    // Basic 和 Pro 套餐：创建支付会话
    setLoadingPlan(`${tier}-${cycle}`)

    try {
      console.log("[Pricing] Creating checkout session for:", tier, cycle)
      
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          billingCycle: cycle,
        }),
      })

      const result = await response.json()

      // ✅ 适配统一响应格式：{ success: true, data: {...}, metadata: {...} }
      if (!result.success) {
        // 处理未登录错误（双重保险）
        if (response.status === 401) {
          console.log("[Pricing] Session expired, showing login dialog")
          setPendingSubscription({ tier, cycle })
          setShowLoginDialog(true)
          return
        }
        
        throw new Error(result.error?.message || "Failed to create checkout session")
      }

      const checkoutUrl = result.data.checkoutUrl
      
      // 重定向到 Creem 支付页面
      console.log("[Pricing] Redirecting to checkout:", checkoutUrl)
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("[Checkout Error]:", error)
      toast.error("Failed to create checkout session. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  // ✅ 处理登录（登录后会自动触发 useEffect 继续订阅流程）
  const handleSignIn = (provider: (redirectPath?: string) => void) => {
    setShowLoginDialog(false)
    
    // ✅ 调试日志：追踪 Pricing 页面登录
    console.log("=== [Pricing SignIn] ===")
    console.log("Redirect Path: /pricing")
    console.log("Pending Subscription:", pendingSubscription)
    console.log("========================")
    
    // 登录成功后会返回当前页面，useEffect 会自动继续订阅流程
    provider("/pricing")
  }

  // 获取图标组件
  const getIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return <Moon className="w-8 h-8 text-primary" />
      case "basic":
        return <Sparkles className="w-8 h-8 text-primary" />
      case "pro":
        return <Zap className="w-8 h-8 text-primary" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12 space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight glow-text">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            From free to professional, all powered by Claude AI's warm psychological insights
          </p>
          
          {/* 计费周期切换 */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Label htmlFor="billing-toggle" className={cn(
              "text-base",
              billingCycle === "monthly" && "font-semibold"
            )}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            />
            <Label htmlFor="billing-toggle" className={cn(
              "text-base",
              billingCycle === "yearly" && "font-semibold"
            )}>
              Yearly
              <Badge variant="secondary" className="ml-2">
                Save 18%
              </Badge>
            </Label>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PRICING_PAGE_DATA.tiers.map((tier) => {
            const price = billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice
            const monthlyEquivalent = billingCycle === "yearly" ? (tier.yearlyPrice / 12).toFixed(2) : tier.monthlyPrice
            const savings = billingCycle === "yearly" ? calculateYearlySavings(tier.tier) : 0
            const isLoading = loadingPlan === `${tier.tier}-${billingCycle}`

            return (
              <Card
                key={tier.tier}
                className={cn(
                  "relative transition-all duration-300 hover:shadow-xl",
                  tier.recommended && "border-primary border-2 glow-box scale-105"
                )}
              >
                {/* 推荐标签 */}
                {tier.recommended && "badge" in tier && tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-10">
                  {/* 图标 */}
                  <div className="flex justify-center mb-4">
                    {getIcon(tier.tier)}
                  </div>

                  {/* 套餐名称 */}
                  <CardTitle className="text-2xl mb-2">{tier.displayName}</CardTitle>

                  {/* 价格 */}
                  <div className="space-y-2">
                    {price === 0 ? (
                      <div className="text-4xl font-bold">Free</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold">
                          ${billingCycle === "monthly" ? price : monthlyEquivalent}
                          <span className="text-base text-muted-foreground font-normal">/mo</span>
                        </div>
                        {billingCycle === "yearly" && (
                          <div className="text-sm text-muted-foreground">
                            ${price}/year - Save ${savings}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <CardDescription className="mt-4">
                    {tier.tier === "free" && "Experience Claude AI for free"}
                    {tier.tier === "basic" && "Best value for daily use"}
                    {tier.tier === "pro" && "Ultimate experience for deep exploration"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* 功能列表 */}
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA 按钮 */}
                  <Button
                    variant={tier.ctaVariant}
                    className="w-full"
                    size="lg"
                    onClick={() => handleSubscribe(tier.tier, billingCycle)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : tier.ctaText}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ 部分 */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {PRICING_PAGE_DATA.faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 额外说明 */}
        <div className="mt-16 mb-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <p>All plans can be canceled anytime • 14-day money-back guarantee</p>
          <p className="mt-2">Supports Alipay, WeChat Pay, and Credit Cards</p>
        </div>
      </div>

      {/* ✅ 登录对话框 - 优化版 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Sign In to Continue</DialogTitle>
            <DialogDescription className="text-center space-y-2">
              {pendingSubscription?.tier === "free" ? (
                <span>Please sign in to start using Lumi for free</span>
              ) : (
                <>
                  <span className="block">
                    You're subscribing to{" "}
                    <strong className="text-primary">
                      {pendingSubscription?.tier === "basic" ? "Basic" : "Pro"}
                    </strong>
                    {" "}plan
                    {pendingSubscription?.cycle === "yearly" && " (Yearly)"}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-2">
                    ✨ After signing in, you'll be redirected to secure payment
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => handleSignIn(signInWithGoogle)}
              variant="outline"
              size="lg"
              className="w-full gap-3 h-12 text-base hover:bg-accent/10 transition-all"
            >
              <GoogleIcon className="h-6 w-6" />
              Continue with Google
            </Button>
            <Button
              onClick={() => handleSignIn(signInWithGithub)}
              variant="outline"
              size="lg"
              className="w-full gap-3 h-12 text-base hover:bg-accent/10 transition-all"
            >
              <Github className="h-6 w-6" />
              Continue with GitHub
            </Button>
          </div>
          <div className="text-xs text-center text-muted-foreground px-4 pb-2">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

