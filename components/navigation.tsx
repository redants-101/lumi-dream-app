"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserButton } from "@/components/user-button"
import { Menu, Sparkles, Github, LogIn } from "lucide-react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

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

/**
 * 全局导航栏组件
 * 包含桌面端导航和移动端抽屉菜单
 */
export function Navigation() {
  const [open, setOpen] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signInWithGithub, signInWithGoogle } = useAuth()

  // 导航链接配置
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard", requiresAuth: true },
  ]

  // 检查链接是否激活
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  // 处理导航链接点击
  const handleNavClick = (e: React.MouseEvent, href: string, requiresAuth?: boolean) => {
    // 如果需要认证但用户未登录，拦截跳转并显示登录对话框
    if (requiresAuth && !user) {
      e.preventDefault()
      setShowLoginDialog(true)
      setOpen(false) // 关闭移动端菜单
      return
    }
  }

  // 处理登录成功后跳转
  const handleSignIn = (provider: (redirectPath?: string) => void) => {
    setShowLoginDialog(false)
    // 登录成功后跳转到 Dashboard
    provider("/dashboard")
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
      {/* 外层全宽容器 */}
      <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8">
        {/* 内层内容区域 - 与主要内容宽度一致 (max-w-6xl) */}
        <div className="w-full max-w-6xl flex items-center justify-between h-16">
          {/* Logo - 左侧 */}
          <Link 
            href="/" 
            className="flex items-center gap-3 font-bold text-xl hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 breathing">
              <Image
                src="/logo/Lumi-Squares4.png"
                alt="Lumi"
                width={32}
                height={32}
                className="w-full h-full"
              />
            </div>
            <span className="glow-text">Lumi</span>
          </Link>

          {/* Desktop Navigation - 中间，均匀分布 */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href, link.requiresAuth)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - 右侧，与左侧对称 */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA Button */}
            <div className="hidden md:block">
              {pathname !== "/pricing" && (
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    View Pricing
                  </Button>
                </Link>
              )}
            </div>

            {/* User Button */}
            <UserButton />

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 breathing">
                      <Image
                        src="/logo/Lumi-Squares4.png"
                        alt="Lumi"
                        width={24}
                        height={24}
                        className="w-full h-full"
                      />
                    </div>
                    Lumi
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href, link.requiresAuth)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary px-2 py-2 rounded-md",
                        isActive(link.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Mobile CTA */}
                  {pathname !== "/pricing" && (
                    <Link href="/pricing" onClick={() => setOpen(false)}>
                      <Button className="w-full gap-2 mt-4">
                        <Sparkles className="w-4 h-4" />
                        View Pricing
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* 登录对话框 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Sign In to Continue</DialogTitle>
            <DialogDescription className="text-center">
              You need to sign in to access your Dashboard
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
    </nav>
  )
}

