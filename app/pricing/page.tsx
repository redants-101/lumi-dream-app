"use client"

import { useState, useEffect } from "react"
import { Check, Sparkles, Moon, Zap, Github, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

// ✅ 订阅信息类型
interface CurrentSubscription {
  tier: string
  billing_cycle: string
  status: string
  current_period_end: string
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const { user, signInWithGithub, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  
  // ✅ 客户端挂载状态（防止 Hydration 错误）
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // ✅ 当前订阅信息
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  
  // ✅ 换周期警告对话框
  const [showCycleChangeWarning, setShowCycleChangeWarning] = useState(false)
  const [cycleChangeTarget, setCycleChangeTarget] = useState<{
    tier: string
    cycle: "monthly" | "yearly"
  } | null>(null)
  
  // ✅ 升级警告对话框
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState<{
    tier: string
    cycle: "monthly" | "yearly"
  } | null>(null)
  
  // 保存用户选择的套餐信息（登录后继续）
  const [pendingSubscription, setPendingSubscription] = useState<{
    tier: string
    cycle: "monthly" | "yearly"
  } | null>(null)

  // ✅ 获取当前订阅信息
  useEffect(() => {
    async function fetchCurrentSubscription() {
      if (!user) {
        setCurrentSubscription(null)
        return
      }

      setLoadingSubscription(true)
      try {
        const response = await fetch("/api/subscription/manage")
        const result = await response.json()

        if (result.success && result.data.tier !== "free") {
          setCurrentSubscription(result.data)
          console.log("[Pricing] Current subscription:", result.data)
        } else {
          setCurrentSubscription(null)
        }
      } catch (error) {
        console.error("[Pricing] Failed to fetch subscription:", error)
        setCurrentSubscription(null)
      } finally {
        setLoadingSubscription(false)
      }
    }

    fetchCurrentSubscription()
  }, [user])

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
        handleSubscribeWithCheck(pendingSubscription.tier, pendingSubscription.cycle)
        setPendingSubscription(null)
      }, 500)
    }
  }, [user, pendingSubscription])

  // ✅ 带检查的订阅处理（检查是否需要显示警告）
  const handleSubscribeWithCheck = (tier: string, cycle: "monthly" | "yearly") => {
    // 1. 检查是否为换周期（Basic/Pro 用户）
    if (isCycleChange(tier, cycle)) {
      setCycleChangeTarget({ tier, cycle })
      setShowCycleChangeWarning(true)
      return
    }
    
    // 2. ✅ 检查是否为升级（Basic → Pro，需要警告）
    if (isUpgradeTier(tier)) {
      setUpgradeTarget({ tier, cycle })
      setShowUpgradeWarning(true)
      return
    }
    
    // 3. Free 用户或其他：直接购买（无警告）
    handleSubscribe(tier, cycle)
  }

  // ✅ 确认换周期
  const handleConfirmCycleChange = () => {
    setShowCycleChangeWarning(false)
    if (cycleChangeTarget) {
      handleSubscribe(cycleChangeTarget.tier, cycleChangeTarget.cycle)
      setCycleChangeTarget(null)
    }
  }

  // ✅ 确认升级
  const handleConfirmUpgrade = () => {
    setShowUpgradeWarning(false)
    if (upgradeTarget) {
      handleSubscribe(upgradeTarget.tier, upgradeTarget.cycle)
      setUpgradeTarget(null)
    }
  }

  const handleSubscribe = async (tier: string, cycle: "monthly" | "yearly") => {
    // Free 套餐：特殊处理
    if (tier === "free") {
      if (!user) {
        // Anonymous 用户：显示登录对话框
        console.log("[Pricing] Anonymous user clicking Free plan, showing login dialog")
        setPendingSubscription({ tier, cycle })
        setShowLoginDialog(true)
        return
      } else {
        // 已登录用户（Free/Basic/Pro）：跳转到首页（输入框会自动聚焦）
        console.log("[Pricing] Redirecting to home")
        router.push("/")
        return
      }
    }

    // ✅ Basic/Pro 套餐：统一检查用户登录
    if (!user) {
      console.log("[Pricing] User not logged in, showing login dialog")
      setPendingSubscription({ tier, cycle })
      setShowLoginDialog(true)
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

  // ✅ 计算剩余天数
  const getRemainingDays = () => {
    if (!currentSubscription) return 0
    
    const endDate = new Date(currentSubscription.current_period_end)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  // ✅ 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // ✅ 检查是否为当前套餐
  const isCurrentPlan = (tier: string, cycle: "monthly" | "yearly") => {
    return (
      currentSubscription &&
      currentSubscription.tier === tier &&
      currentSubscription.billing_cycle === cycle
    )
  }

  // ✅ 检查是否为换周期
  const isCycleChange = (tier: string, cycle: "monthly" | "yearly") => {
    return (
      currentSubscription &&
      currentSubscription.tier === tier &&
      currentSubscription.billing_cycle !== cycle
    )
  }

  // ✅ 检查是否为升级
  const isUpgradeTier = (tier: string) => {
    if (!currentSubscription || currentSubscription.tier === "free") {
      return false  // Free 用户不算升级
    }
    
    const tierLevel: Record<string, number> = { 
      free: 0, 
      basic: 1, 
      pro: 2 
    }
    
    return tierLevel[tier] > tierLevel[currentSubscription.tier]
  }

  // ✅ 获取按钮文案（根据用户角色动态设置）
  const getButtonText = (tier: string) => {
    // ✅ 服务器端或未挂载时，使用默认文案（防止 Hydration 错误）
    if (!mounted) {
      return "Subscribe Now"
    }

    // Free 套餐：始终显示 "Get Started"
    if (tier === "free") {
      return "Get Started"
    }

    // 未登录用户（Anonymous）：显示 "Subscribe Now"
    if (!user) {
      return "Subscribe Now"
    }

    // Free 用户：显示 "Upgrade to X"
    if (!currentSubscription || currentSubscription.tier === "free") {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
      return `Upgrade to ${tierName}`
    }

    // Basic/Pro 用户
    const tierLevel: Record<string, number> = { free: 0, basic: 1, pro: 2 }
    const currentLevel = tierLevel[currentSubscription.tier] || 0
    const targetLevel = tierLevel[tier] || 0

    if (targetLevel > currentLevel) {
      // 升级
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
      return `Upgrade to ${tierName}`
    } else if (targetLevel < currentLevel) {
      // 降级
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
      return `Downgrade to ${tierName}`
    } else {
      // 同层级（不应该出现，因为会被其他逻辑处理）
      return "Subscribe Now"
    }
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
            
            // ✅ 当前套餐判断
            const isCurrentTier = isCurrentPlan(tier.tier, billingCycle)
            const isCycleChangeOption = isCycleChange(tier.tier, billingCycle)
            const remainingDays = getRemainingDays()

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

                  {/* ✅ 当前订阅提示 */}
                  {isCurrentTier && currentSubscription && (
                    <Alert className="bg-primary/10 border-primary">
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <div className="font-semibold mb-1">Current Plan</div>
                        <div>
                          {remainingDays} day{remainingDays !== 1 ? "s" : ""} remaining
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Renews on {formatDate(currentSubscription.current_period_end)}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* ✅ 换周期警告提示 */}
                  {isCycleChangeOption && currentSubscription && (
                    <Alert className="bg-yellow-500/10 border-yellow-500">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-sm">
                        <div className="font-semibold mb-1">Change Billing Cycle</div>
                        <div className="text-xs">
                          Switching will start a new subscription. Your remaining {remainingDays} day{remainingDays !== 1 ? "s" : ""} won't be refunded.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* ✅ CTA 按钮 */}
                  <div className="space-y-2">
                    {isCurrentTier ? (
                      // ✅ 当前套餐：只显示管理按钮（不显示自动续费提示）
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => router.push("/dashboard")}
                      >
                        Manage Subscription
                      </Button>
                    ) : isCycleChangeOption ? (
                      // 换周期：显示警告样式按钮
                      <Button
                        variant="outline"
                        className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                        size="lg"
                        onClick={() => handleSubscribeWithCheck(tier.tier, billingCycle)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : `Switch to ${billingCycle === "monthly" ? "Monthly" : "Yearly"}`}
                      </Button>
                    ) : (
                      // 其他套餐：正常购买按钮
                      <Button
                        variant={tier.ctaVariant}
                        className="w-full"
                        size="lg"
                        onClick={() => handleSubscribeWithCheck(tier.tier, billingCycle)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : getButtonText(tier.tier)}
                      </Button>
                    )}
                  </div>
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

      {/* ✅ 换周期警告对话框 */}
      <Dialog open={showCycleChangeWarning} onOpenChange={setShowCycleChangeWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <DialogTitle className="text-center text-xl">
              Change Billing Cycle?
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 pt-2 px-6">
            {currentSubscription && cycleChangeTarget && (
              <>
                <p className="text-base text-muted-foreground">
                  You're switching from{" "}
                  <strong className="text-foreground">
                    {currentSubscription.tier.charAt(0).toUpperCase() + currentSubscription.tier.slice(1)}{" "}
                    {currentSubscription.billing_cycle === "monthly" ? "Monthly" : "Yearly"}
                  </strong>
                  {" "}to{" "}
                  <strong className="text-foreground">
                    {cycleChangeTarget.tier.charAt(0).toUpperCase() + cycleChangeTarget.tier.slice(1)}{" "}
                    {cycleChangeTarget.cycle === "monthly" ? "Monthly" : "Yearly"}
                  </strong>
                </p>
                
                <Alert className="bg-yellow-500/10 border-yellow-500 text-left">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-sm">
                    <div className="font-semibold mb-2">Important:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• This will start a <strong>new subscription immediately</strong></li>
                      <li>• Your remaining <strong>{getRemainingDays()} days</strong> won't be refunded</li>
                      <li>• The new billing cycle starts <strong>today</strong></li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <p className="text-xs text-muted-foreground">
                  Current subscription expires: {formatDate(currentSubscription.current_period_end)}
                </p>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCycleChangeWarning(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCycleChange}
              className="w-full sm:w-auto"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ 升级警告对话框 */}
      <Dialog open={showUpgradeWarning} onOpenChange={setShowUpgradeWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <DialogTitle className="text-center text-xl">
              Upgrade to {upgradeTarget?.tier === "pro" ? "Pro" : "Basic"}?
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 pt-2 px-6">
            {currentSubscription && upgradeTarget && (
              <>
                <p className="text-base text-muted-foreground">
                  You're upgrading from{" "}
                  <strong className="text-foreground">
                    {currentSubscription.tier.charAt(0).toUpperCase() + currentSubscription.tier.slice(1)}{" "}
                    {currentSubscription.billing_cycle === "monthly" ? "Monthly" : "Yearly"}
                  </strong>
                  {" "}to{" "}
                  <strong className="text-foreground">
                    {upgradeTarget.tier.charAt(0).toUpperCase() + upgradeTarget.tier.slice(1)}{" "}
                    {upgradeTarget.cycle === "monthly" ? "Monthly" : "Yearly"}
                  </strong>
                </p>
                
                <Alert className="bg-yellow-500/10 border-yellow-500 text-left">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-sm">
                    <div className="font-semibold mb-2">Important:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• Your upgraded plan starts <strong>immediately</strong></li>
                      <li>• Your remaining <strong>{getRemainingDays()} days</strong> of {currentSubscription.tier.charAt(0).toUpperCase() + currentSubscription.tier.slice(1)} won't be refunded</li>
                      <li>• You'll be charged the {upgradeTarget.tier.charAt(0).toUpperCase() + upgradeTarget.tier.slice(1)} rate starting today</li>
                      <li>• Your old subscription will be canceled automatically</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <p className="text-xs text-muted-foreground">
                  Current subscription expires: {formatDate(currentSubscription.current_period_end)}
                </p>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeWarning(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              className="w-full sm:w-auto"
            >
              Continue Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

