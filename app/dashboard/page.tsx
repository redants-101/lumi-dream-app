"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useUsageLimitV2 } from "@/contexts/usage-limit-context"  // ✅ 使用全局 Context
import { getPricingConfig } from "@/lib/pricing-config"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [canceling, setCanceling] = useState(false)
  
  // ✅ 验证用户登录状态（防止未登录用户访问）
  useEffect(() => {
    if (!user) {
      console.log("[Dashboard] Redirecting unauthenticated user to home")
      router.push("/")
    }
  }, [user, router])
  
  // ✅ 使用统一的 Hook（复用 Home 页面数据，0 次额外 API 调用）
  const { 
    subscription, 
    subscriptionLoading,
    usageData,
    limits,
    userTier,
    refreshUserInfo,  // ✅ 用于取消订阅后刷新
  } = useUsageLimitV2()

  // ✅ 早期返回：未登录用户不渲染任何内容
  if (!user) {
    return null  // 等待重定向
  }

  // ✅ 计算使用统计（从 usageData 获取）
  const usageStats = {
    thisMonth: usageData?.monthlyCount || 0,
    total: usageData?.monthlyCount || 0,  // 暂时使用月计数代替总计数
  }

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      const response = await fetch("/api/subscription/manage", {
        method: "DELETE",
      })

      const result = await response.json()

      // ✅ 适配统一响应格式：{ success: true, data: {...}, metadata: {...} }
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to cancel subscription")
      }

      toast.success("Subscription canceled. Changes will take effect at the end of the current period.")
      setShowCancelDialog(false)
      
      // ✅ 刷新用户数据（不刷新整个页面）
      await refreshUserInfo()
    } catch (error) {
      console.error("[Cancel Error]:", error)
      toast.error("Failed to cancel subscription. Please try again.")
    } finally {
      setCanceling(false)
    }
  }

  // ✅ 完善的加载状态判断
  if (subscriptionLoading || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-8">My Subscription</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ✅ 使用 userTier 获取配置（更可靠）
  const config = subscription ? getPricingConfig(subscription.tier) : null
  
  // ✅ 使用 Hook 提供的 limits（更准确）
  const remaining = limits ? limits.monthly - usageStats.thisMonth : 0
  const usagePercentage = limits && limits.monthly > 0
    ? (usageStats.thisMonth / limits.monthly) * 100
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and view usage statistics
          </p>
        </div>

        {/* 订阅概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 当前套餐 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config?.displayName}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {subscription?.billing_cycle === "yearly" ? "Yearly" : subscription?.billing_cycle === "monthly" ? "Monthly" : "Free"}
              </p>
              {subscription?.status && (
                <Badge
                  variant={subscription.status === "active" ? "default" : "secondary"}
                  className="mt-2"
                >
                  {subscription.status === "active" ? "Active" : subscription.status}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* 本月使用 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageStats.thisMonth} / {limits?.monthly || 0}
              </div>
              <Progress value={usagePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {remaining} interpretations remaining
              </p>
            </CardContent>
          </Card>

          {/* 到期时间 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {subscription?.current_period_end ? (
                <>
                  <div className="text-2xl font-bold">
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Next billing date</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">Forever</div>
                  <p className="text-xs text-muted-foreground mt-1">Free tier</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 套餐详情 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>Features and benefits you're currently enjoying</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {config?.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-4">
          {subscription?.tier === "free" ? (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Upgrade to Unlock More Features
                </CardTitle>
                <CardDescription>
                  Upgrade to a paid plan for more interpretations and advanced features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/pricing")} size="lg">
                  View Pricing Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>Manage your subscription settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Upgrade Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to a higher tier
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/pricing")}
                    disabled={subscription?.tier === "pro"}
                  >
                    {subscription?.tier === "pro" ? "Highest Tier" : "Upgrade"}
                  </Button>
                </div>

                {subscription?.status === "active" && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cancel Subscription</p>
                      <p className="text-sm text-muted-foreground">
                        You'll be downgraded to free tier after the current period ends
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 取消订阅确认对话框 */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
              <AlertDialogDescription>
                After cancellation, you can still use the service until the end of your current billing period (
                {subscription?.current_period_end &&
                  new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                ). Then you'll be automatically downgraded to the free tier.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {canceling ? "Processing..." : "Confirm Cancellation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

