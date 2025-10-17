"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Cookie } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * CookieConsent 组件
 * 
 * 符合 GDPR/CCPA 法规的 Cookie 同意横幅
 * 功能：
 * - 首次访问时显示同意提示
 * - 用户可以接受或拒绝 Cookie
 * - 使用 localStorage 记住用户选择
 * - 提供隐私政策链接（可自定义）
 */
export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 检查用户是否已经做出选择
    const consentStatus = localStorage.getItem("lumi-cookie-consent")
    
    if (!consentStatus) {
      // 延迟显示，确保动画效果
      const timer = setTimeout(() => {
        setShowConsent(true)
        // 再延迟一点点触发动画
        setTimeout(() => setIsVisible(true), 100)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  // 用户接受 Cookie
  const acceptCookies = () => {
    localStorage.setItem("lumi-cookie-consent", "accepted")
    setIsVisible(false)
    setTimeout(() => setShowConsent(false), 300) // 等待动画结束
    
    // 这里可以初始化分析工具（Vercel Analytics 已经在 layout 中加载）
    console.log("[Cookie Consent] User accepted cookies")
  }

  // 用户拒绝 Cookie
  const declineCookies = () => {
    localStorage.setItem("lumi-cookie-consent", "declined")
    setIsVisible(false)
    setTimeout(() => setShowConsent(false), 300)
    
    // 这里可以禁用非必要的分析工具
    console.log("[Cookie Consent] User declined cookies")
  }

  // 关闭横幅（等同于拒绝）
  const closeConsent = () => {
    declineCookies()
  }

  if (!showConsent) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="relative bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* 装饰性发光效果 */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl glow-box" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl glow-purple" />
          
          <div className="relative z-10 p-6 sm:p-8">
            {/* 关闭按钮 */}
            <button
              onClick={closeConsent}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close cookie consent"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Cookie 图标 */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* 文字内容 */}
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  We Value Your Privacy
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from. 
                  By clicking "Accept", you consent to our use of cookies. You can learn more in our{" "}
                  <a
                    href="/privacy"
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              {/* 按钮组 */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={declineCookies}
                  variant="outline"
                  className="w-full sm:w-auto border-border hover:bg-accent/10"
                >
                  Decline
                </Button>
                <Button
                  onClick={acceptCookies}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground glow-box"
                >
                  Accept Cookies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

