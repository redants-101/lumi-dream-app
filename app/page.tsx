"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useUsageLimitV2 } from "@/contexts/usage-limit-context"
import { useAuth } from "@/hooks/use-auth"
import { Sparkles, Loader2, AlertCircle, Crown, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { getPricingConfig, type SubscriptionTier } from "@/lib/pricing-config"
import { getWarningThresholds, type UserTier as UsageTier } from "@/lib/usage-limits"

export default function Home() {
  const [dream, setDream] = useState("")
  const [interpretation, setInterpretation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showLengthUpgradePrompt, setShowLengthUpgradePrompt] = useState(false)
  const [isMounted, setIsMounted] = useState(false)  // ✅ 跟踪客户端挂载状态
  const [isAuthCallback, setIsAuthCallback] = useState(() => {
    // ✅ 检测 OAuth 回调：URL 中有 code 参数且用户未登录说明正在处理登录回调
    // 注意：只有在未登录状态下检测到 code 才认为是回调
    if (typeof window === "undefined") return false
    const hasCode = new URLSearchParams(window.location.search).has('code')
    // 需要等 Auth Context 初始化后才能准确判断，所以初始值为 hasCode
    return hasCode
  })
  
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, signInWithGithub, signInWithGoogle } = useAuth()
  const { 
    canUse, 
    incrementUsage, 
    isLimitReached, 
    getLimitMessage,
    remainingCount,
    remainingDaily,
    remainingMonthly,
    usageCount,
    limitType,
    subscription,
    subscriptionLoading,  // ✅ 加载状态：用于显示 Skeleton
    syncFromResponse  // ✅ 混合模式：从 API 响应同步使用数据
  } = useUsageLimitV2()

  // ✅ 修复 Hydration 错误：跟踪客户端挂载状态
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // 获取当前用户的梦境长度限制和提醒阈值
  // ✅ 修复 Hydration 错误：使用 useMemo 确保稳定计算
  const userTier = useMemo(() => {
    if (!isAuthenticated) return "anonymous" as UsageTier
    return (subscription?.tier || "free") as UsageTier
  }, [isAuthenticated, subscription?.tier])
  
  const maxDreamLength = useMemo(() => {
    const tierForConfig = (userTier === "anonymous" ? "free" : userTier) as SubscriptionTier
    const config = getPricingConfig(tierForConfig)
    return config.limits.maxDreamLength
  }, [userTier])
  
  // ✅ 获取当前层级的提醒阈值
  const warningThresholds = useMemo(() => {
    return getWarningThresholds(userTier)
  }, [userTier])

  // 统一的限制提示逻辑
  useEffect(() => {
    // ✅ 关键修复：等待认证状态加载完成后再显示提示
    if (authLoading) {
      // 认证状态加载中，不显示任何提示
      return
    }

    // 未登录用户达到限制 → 提示登录
    if (!isAuthenticated && isLimitReached) {
      setShowLoginPrompt(true)
      setShowUpgradePrompt(false)
    } 
    // 已登录用户达到限制 → 提示升级
    else if (isAuthenticated && isLimitReached) {
      setShowLoginPrompt(false)
      setShowUpgradePrompt(true)
    }
    // 未达到限制 → 关闭所有提示
    else {
      setShowLoginPrompt(false)
      setShowUpgradePrompt(false)
    }
  }, [isAuthenticated, isLimitReached, authLoading])

  // ✅ OAuth 回调处理：认证状态更新后清除回调标记
  useEffect(() => {
    if (isAuthCallback && isAuthenticated) {
      // 登录成功，清除标记
      console.log("[Home] OAuth callback completed, clearing isAuthCallback")
      setIsAuthCallback(false)
    }
  }, [isAuthenticated, isAuthCallback])
  
  // ✅ 清除登出后残留的 code 参数：使用延迟确保不影响真正的 OAuth 回调
  useEffect(() => {
    if (isAuthCallback && !isAuthenticated) {
      // 等待 2 秒，如果仍未登录则清除（真正的 OAuth 回调通常在 1 秒内完成）
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          console.log("[Home] Clearing residual code (timeout: not logged in after 2s)")
          setIsAuthCallback(false)
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthCallback, isAuthenticated])

  const handleInterpret = async () => {
    if (!dream.trim()) {
      setError("What did you dream of, my friend? Please share your dream above.")
      return
    }

    // 检查梦境长度
    if (dream.length > maxDreamLength) {
      setError(`Your dream description is too long (${dream.length}/${maxDreamLength} characters). Please upgrade for longer dreams.`)
      setShowLengthUpgradePrompt(true)
      return
    }

    // 检查使用限制
    if (!canUse()) {
      setError(getLimitMessage())
      return
    }

    setIsLoading(true)
    setError("")
    setInterpretation("")

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dream }),
      })

      const result = await response.json()
      
      // 检查 API 响应状态
      if (!result.success) {
        // ✅ 混合模式关键：从错误响应同步真实使用数据
        if (result.error?.details?.currentUsage) {
          console.log("[Home] 🔄 Syncing usage from error response:", result.error.details.currentUsage)
          syncFromResponse({
            daily: result.error.details.currentUsage.daily || 0,
            monthly: result.error.details.currentUsage.monthly || 0
          })
        }
        
        // ✅ API 错误格式：{ success: false, error: { message: "...", code: "...", details: {...} } }
        throw new Error(result.error?.message || "Failed to interpret dream")
      }

      // ✅ API 成功格式：{ success: true, data: { interpretation: "..." }, metadata: {...} }
      setInterpretation(result.data.interpretation)
      
      // ✅ 混合模式关键：从成功响应同步真实使用数据
      let newRemainingDaily = remainingDaily - 1
      let newRemainingMonthly = remainingMonthly - 1
      
      if (result.metadata?.currentUsage) {
        console.log("[Home] 🔄 Syncing usage from success response:", result.metadata.currentUsage)
        syncFromResponse({
          daily: result.metadata.currentUsage.daily || 0,
          monthly: result.metadata.currentUsage.monthly || 0
        })
        
        // ✅ 使用 API 返回的最新数据计算剩余次数（确保显示准确）
        const limits = result.metadata.currentUsage.limits
        if (limits) {
          newRemainingDaily = limits.daily - result.metadata.currentUsage.daily
          newRemainingMonthly = limits.monthly - result.metadata.currentUsage.monthly
          console.log("[Home] 📊 Updated remaining: daily =", newRemainingDaily, "monthly =", newRemainingMonthly)
        }
      } else {
        // 如果没有返回使用数据（向后兼容），使用本地计数
        incrementUsage()
      }
      
      // ✅ 智能提示系统（双重限制：日 + 月，带优先级避免冲突）
      if (isAuthenticated) {
        
        let toastShown = false  // ✅ 防止重复提醒的标志
        
        // === 优先级 1: Pro 用户降级提示（最高优先级）===
        if (userTier === "pro" && newRemainingMonthly === 100) {
          setTimeout(() => {
            toast("Premium AI Complete! 🔥", {
              description: "You've used 100 interpretations with Claude Sonnet. Switching to Claude Haiku for remaining uses (still excellent quality!)",
              duration: 12000,
            })
          }, 2000)
          toastShown = true
        }
        
        // === 优先级 2: 月限制提醒（高优先级，引导付费）===
        if (!toastShown) {
          // 月限制 - 紧急提示（80%）
          if ('urgent' in warningThresholds.monthly && warningThresholds.monthly.urgent && newRemainingMonthly === warningThresholds.monthly.urgent) {
            setTimeout(() => {
              const upgradeText = userTier === "basic" ? "Pro for 200/month" : "Basic for 50/month"
              toast("Almost there! 💫", {
                description: `Only ${newRemainingMonthly} interpretations left this month. ${userTier === "pro" ? "Plan ahead for next month!" : `Upgrade to ${upgradeText}!`}`,
                action: userTier !== "pro" ? {
                  label: "Upgrade Now",
                  onClick: () => router.push("/pricing")
                } : undefined,
                duration: 10000,
              })
            }, 2000)
            toastShown = true
          }
          
          // 月限制 - 温和提示（50%）
          if (!toastShown && newRemainingMonthly === warningThresholds.monthly.gentle) {
            setTimeout(() => {
              toast("Great insight, right? 🌟", {
                description: `${newRemainingMonthly} interpretations left this month. ${userTier === "pro" ? "You're halfway through!" : "Upgrade for more!"}`,
                action: userTier !== "pro" ? {
                  label: "View Plans",
                  onClick: () => router.push("/pricing")
                } : undefined,
                duration: 8000,
              })
            }, 2000)
            toastShown = true
          }
        }
        
        // === 优先级 3: 日限制提醒（低优先级，仅当月提醒未触发）===
        if (!toastShown) {
          // 日限制 - 紧急提示（可选）
          if ('urgent' in warningThresholds.daily && warningThresholds.daily.urgent && newRemainingDaily === warningThresholds.daily.urgent) {
            setTimeout(() => {
              toast("Last one today! 🌙", {
                description: `Only ${newRemainingDaily} interpretation${newRemainingDaily > 1 ? 's' : ''} left today. Come back tomorrow for more!`,
                duration: 8000,
              })
            }, 2000)
            toastShown = true
          }
          
          // 日限制 - 温和提示
          if (!toastShown && newRemainingDaily === warningThresholds.daily.gentle) {
            setTimeout(() => {
              toast("Productive day! ☀️", {
                description: `${newRemainingDaily} interpretations left today. Daily limit resets at midnight.`,
                duration: 6000,
              })
            }, 2000)
            toastShown = true
          }
        }
      }
    } catch (err) {
      setError("It seems the connection is a bit foggy right now. Let's try again in a moment.")
      console.error("[v0] Error interpreting dream:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl glow-purple" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl glow-box" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-6">
            <Image
              src="/logo/Lumi-Rectangles2.jpeg"
              alt="Lumi - AI Dream Interpretation"
              width={280}
              height={100}
              priority
              className="rounded-lg"
            />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center">
            Illuminate the hidden meanings in your dreams with AI-powered insight
          </p>
        </div>

        {/* Usage Limit Alert - 动态阈值（日 + 月） */}
        {!isLimitReached && remainingCount > 0 && (
          (('urgent' in warningThresholds.daily) && warningThresholds.daily.urgent && remainingDaily <= warningThresholds.daily.urgent) || 
          (('urgent' in warningThresholds.monthly) && warningThresholds.monthly.urgent && remainingMonthly <= warningThresholds.monthly.urgent)
        ) && (
          // ✅ 等待 subscription 数据加载完成 + OAuth 回调处理完成
          !subscriptionLoading && !isAuthCallback && (!isAuthenticated || (subscription && subscription.tier))
        ) && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground">
              {getLimitMessage()}
            </AlertDescription>
          </Alert>
        )}

        {/* Dream Input Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-7 mb-7 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">I'm Listening... Tell Me More</h3>
            {/* ✅ 等待数据加载完成后再渲染使用限制信息 */}
            {!isLimitReached && isMounted && !subscriptionLoading && !isAuthCallback && (
              // ✅ 已登录用户必须有 subscription 数据才渲染，防止闪烁
              !isAuthenticated || (subscription && subscription.tier)
            ) && (() => {
              // 🔍 调试日志
              console.log("[Home] Rendering usage info:", { userTier, isAuthenticated, subscription: subscription?.tier, remainingDaily, remainingMonthly })
              return true
            })() && (
              <span className="text-xs text-muted-foreground">
                {userTier === "pro" ? (
                  // Pro 用户：显示档位 + 日/月剩余
                  remainingMonthly > 100 ? (
                    <span className="flex items-center gap-2">
                      <span className="text-primary flex items-center gap-1">
                        <span>🔥 Premium AI</span>
                        <span>({remainingMonthly - 100} premium)</span>
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span>{remainingDaily} today</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span>⚙️ Standard AI</span>
                        <span>({remainingMonthly} left)</span>
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span>{remainingDaily} today</span>
                    </span>
                  )
                ) : (
                  // 其他用户（anonymous/free/basic）：显示今日 + 本月剩余
                  <span className="flex items-center gap-1.5">
                    <span>{remainingDaily} today</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{remainingMonthly} this month</span>
                  </span>
                )}
              </span>
            )}
          </div>
          <Textarea
            id="dream-input"
            placeholder="What did you dream of, my friend? Feel free to share your dream here... It's a safe space."
            value={dream}
            onChange={(e) => {
              const newValue = e.target.value
              // 允许输入，但在超限时提示
              setDream(newValue)
              
              // 清除之前的错误
              if (error && newValue.length <= maxDreamLength) {
                setError("")
              }
              
              // 超限警告
              if (newValue.length > maxDreamLength) {
                setError(`Character limit exceeded (${newValue.length}/${maxDreamLength}). Upgrade for longer dreams!`)
              }
            }}
            className="min-h-[170px] text-base bg-background/50 border-border focus:border-primary resize-none"
            disabled={isLoading || isLimitReached}
          />
          
          {/* 字符计数器 */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={`${dream.length > maxDreamLength ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              {dream.length} / {maxDreamLength} characters
            </span>
            {dream.length > maxDreamLength && (
              <button
                onClick={() => setShowLengthUpgradePrompt(true)}
                className="text-primary hover:underline font-medium"
              >
                Upgrade for more space
              </button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleInterpret}
            disabled={isLoading || !dream.trim() || isLimitReached}
            className="w-full mt-5 h-13 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-box transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Lumi is reflecting on your dream...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Illuminate My Dream
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        {interpretation && (
          <>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Your Dream Interpretation</h2>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold text-foreground mb-4">Dream Analysis</h3>
                <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{interpretation}</div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Important Note</h3>
                <p className="text-sm text-muted-foreground italic">
                  This service is for entertainment and self-exploration only, not a substitute for professional
                  psychological counseling.
                </p>
              </div>
            </div>

            {/* 智能升级卡片 - 仅对已登录用户显示 */}
            {isAuthenticated && !isAuthCallback && subscription && subscription.tier && remainingCount <= 2 && remainingCount > 0 && (
              <Card className="mt-6 border-primary/50 bg-gradient-to-r from-primary/5 to-accent/5 glow-box animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-shrink-0">
                      <Crown className="w-10 h-10 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        Loving the insights?
                        <Sparkles className="w-5 h-5 text-primary" />
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        You have <span className="font-semibold text-primary">{remainingCount}</span> {remainingCount === 1 ? "interpretation" : "interpretations"} left today. 
                        Upgrade to <span className="font-semibold">Basic</span> for <span className="font-semibold text-primary">50 interpretations/month</span> with the same Claude AI quality.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>Just $4.99/month • Cancel anytime</span>
                      </div>
                    </div>
                    <Link href="/pricing">
                      <Button className="gap-2 whitespace-nowrap">
                        <Crown className="w-4 h-4" />
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty state when no interpretation yet */}
        {!interpretation && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <div className={`w-14 h-14 mx-auto mb-4 breathing ${!dream.trim() ? "grayscale" : ""}`}>
              <Image
                src="/logo/Lumi-Squares4.png"
                alt="Lumi Dream Drop"
                width={56}
                height={56}
                className="w-full h-full"
              />
            </div>
            <h2 className="text-lg font-semibold mb-2">Ready to Explore Your Inner World?</h2>
            <p className="text-base">Share your dream above, and let's illuminate its meaning together</p>
          </div>
        )}
      </div>

      {/* Login Prompt Dialog - 未登录用户达到限制 */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Unlock More Dream Interpretations
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              You've used all 5 free interpretations today. Sign in to get 5 more interpretations and continue exploring your dreams!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                setShowLoginPrompt(false)
                signInWithGoogle()
              }}
              size="lg"
              className="w-full gap-3 h-12 text-base"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
            <Button
              onClick={() => {
                setShowLoginPrompt(false)
                signInWithGithub()
              }}
              size="lg"
              variant="outline"
              className="w-full gap-3 h-12 text-base"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <div className="text-xs text-center text-muted-foreground">
              Sign in to unlock 5 more interpretations today and enjoy enhanced features
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowLoginPrompt(false)}
              className="w-full"
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Dialog - 已登录用户达到限制 */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Ready for More?
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              You've reached your daily limit. Upgrade to Basic for <span className="font-semibold text-primary">50 interpretations/month</span> and unlock unlimited potential.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* 特性列表 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>50 interpretations/month</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Same Claude AI quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Save interpretation history</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Export to PDF/Text</span>
              </div>
            </div>

            {/* CTA 按钮 */}
            <Button
              onClick={() => {
                setShowUpgradePrompt(false)
                router.push("/pricing")
              }}
              size="lg"
              className="w-full gap-2"
            >
              <Crown className="w-5 h-5" />
              Upgrade to Basic - $4.99/mo
            </Button>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <div className="text-xs text-center text-muted-foreground">
              14-day money-back guarantee • Cancel anytime
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowUpgradePrompt(false)}
              className="w-full"
            >
              Maybe Tomorrow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Length Upgrade Prompt Dialog - 梦境长度超限 */}
      <Dialog open={showLengthUpgradePrompt} onOpenChange={setShowLengthUpgradePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Need More Space?
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your dream is longer than the {maxDreamLength} character limit for {userTier === "free" ? "Free" : userTier.charAt(0).toUpperCase() + userTier.slice(1)} users. 
              Upgrade to share more detailed dreams!
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* 层级对比 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current ({userTier}):</span>
                  <span className="font-semibold">{maxDreamLength} characters</span>
                </div>
                
                {userTier === "free" && (
                  <>
                    <div className="flex items-center justify-between text-primary">
                      <span className="flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        Basic:
                      </span>
                      <span className="font-semibold">1,000 characters</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Pro:</span>
                      <span className="font-semibold">2,000 characters</span>
                    </div>
                  </>
                )}
                
                {userTier === "basic" && (
                  <div className="flex items-center justify-between text-primary">
                    <span className="flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Pro:
                    </span>
                    <span className="font-semibold">2,000 characters</span>
                  </div>
                )}
              </div>
            </div>

            {/* 升级好处 */}
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Upgrade benefits:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>{userTier === "free" ? "2x" : "2x"} longer dream descriptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>{userTier === "free" ? "50" : "200"} interpretations/month</span>
                </div>
                {userTier === "basic" && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Claude Sonnet AI (deepest insights)</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA 按钮 */}
            <Button
              onClick={() => {
                setShowLengthUpgradePrompt(false)
                router.push("/pricing")
              }}
              size="lg"
              className="w-full gap-2"
            >
              <Crown className="w-5 h-5" />
              {userTier === "free" ? "Upgrade to Basic - $4.99/mo" : "Upgrade to Pro - $9.99/mo"}
            </Button>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button
              variant="ghost"
              onClick={() => setShowLengthUpgradePrompt(false)}
              className="w-full"
            >
              I'll Shorten It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
