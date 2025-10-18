"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UserButton } from "@/components/user-button"
import { useUsageLimit } from "@/hooks/use-usage-limit"
import { useAuth } from "@/hooks/use-auth"
import { Sparkles, Loader2, AlertCircle, LogIn, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Home() {
  const [dream, setDream] = useState("")
  const [interpretation, setInterpretation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  const { isAuthenticated, signInWithGithub, signInWithGoogle } = useAuth()
  const { 
    canUse, 
    incrementUsage, 
    isLimitReached, 
    getLimitMessage,
    remainingCount 
  } = useUsageLimit()

  // 当未登录用户达到限制时，显示登录引导
  useEffect(() => {
    if (!isAuthenticated && isLimitReached) {
      setShowLoginPrompt(true)
    } else if (isAuthenticated) {
      // 用户登录后，自动关闭对话框
      setShowLoginPrompt(false)
    }
  }, [isAuthenticated, isLimitReached])

  const handleInterpret = async () => {
    if (!dream.trim()) {
      setError("What did you dream of, my friend? Please share your dream above.")
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

      if (!response.ok) {
        throw new Error("Failed to interpret dream")
      }

      const data = await response.json()
      setInterpretation(data.interpretation)
      
      // 成功解析后增加使用次数
      incrementUsage()
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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Logo and Navigation Bar */}
        <div className="flex items-start justify-between mb-8">
          {/* Logo Section */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative mb-4">
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
          {/* Sign In Button */}
          <div className="flex-shrink-0">
            <UserButton />
          </div>
        </div>

        {/* Usage Limit Alert */}
        {!isLimitReached && remainingCount <= 2 && remainingCount > 0 && (
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
            {!isLimitReached && (
              <span className="text-xs text-muted-foreground">
                {remainingCount} left today
              </span>
            )}
          </div>
          <Textarea
            id="dream-input"
            placeholder="What did you dream of, my friend? Feel free to share your dream here... It's a safe space."
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            className="min-h-[170px] text-base bg-background/50 border-border focus:border-primary resize-none"
            disabled={isLoading || isLimitReached}
          />

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

      {/* Login Prompt Dialog for Anonymous Users */}
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
    </main>
  )
}
