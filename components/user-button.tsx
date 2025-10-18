/**
 * 用户认证按钮组件
 * 显示登录/登出按钮和用户信息
 */

"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, LogOut, User, Loader2, LogIn } from "lucide-react"

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

// 登录选择对话框组件
function SignInDialog({ 
  signInWithGithub, 
  signInWithGoogle 
}: { 
  signInWithGithub: () => void
  signInWithGoogle: () => void 
}) {
  const [open, setOpen] = useState(false)

  const handleSignIn = (provider: () => void) => {
    setOpen(false)
    provider()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 glow-box" size="default">
          <LogIn className="h-5 w-5" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Choose Your Sign In Method</DialogTitle>
          <DialogDescription className="text-center">
            Select your preferred way to sign in to Lumi
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
  )
}

export function UserButton() {
  const { user, isLoading, isAuthenticated, signInWithGithub, signInWithGoogle, signOut } = useAuth()

  // 加载状态
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    )
  }

  // 未登录状态 - 显示登录按钮
  if (!isAuthenticated) {
    return <SignInDialog signInWithGithub={signInWithGithub} signInWithGoogle={signInWithGoogle} />
  }

  // 已登录状态 - 显示用户菜单
  const userMetadata = user?.user_metadata
  const avatarUrl = userMetadata?.avatar_url
  const userName = userMetadata?.full_name || userMetadata?.user_name || "User"
  const userEmail = user?.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

