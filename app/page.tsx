"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Moon, Loader2 } from "lucide-react"

export default function Home() {
  const [dream, setDream] = useState("")
  const [interpretation, setInterpretation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInterpret = async () => {
    if (!dream.trim()) {
      setError("Please describe your dream first")
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
    } catch (err) {
      setError("Something went wrong. Please try again.")
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

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <Moon className="w-12 h-12 text-primary glow-text" />
              <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold text-foreground glow-text">Lumi</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Illuminate the hidden meanings in your dreams with AI-powered insight
          </p>
        </div>

        {/* Dream Input Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">Share Your Dream</h2>
          <h3 className="text-lg font-semibold text-foreground mb-4">Describe Your Dream</h3>
          <Textarea
            id="dream-input"
            placeholder="I was walking through a forest at night, and the trees were glowing with a soft blue light..."
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            className="min-h-[200px] text-base bg-background/50 border-border focus:border-primary resize-none"
            disabled={isLoading}
          />

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}

          <Button
            onClick={handleInterpret}
            disabled={isLoading || !dream.trim()}
            className="w-full mt-6 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-box transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Lumi is thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Start Interpretation
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
          <div className="text-center py-12 text-muted-foreground">
            <Moon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Ready to Explore Your Dreams?</h2>
            <p className="text-lg">Share your dream above to begin your journey of discovery</p>
          </div>
        )}
      </div>
    </main>
  )
}
