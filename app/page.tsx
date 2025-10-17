"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2 } from "lucide-react"

export default function Home() {
  const [dream, setDream] = useState("")
  const [interpretation, setInterpretation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInterpret = async () => {
    if (!dream.trim()) {
      setError("What did you dream of, my friend? Please share your dream above.")
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
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-4 mb-5">
            {/* Logo 图片 */}
            <div className="relative">
              <Image
                src="/logo/Lumi-Rectangles2.jpeg"
                alt="Lumi - AI Dream Interpretation"
                width={280}
                height={100}
                priority
                className="rounded-lg"
              />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Illuminate the hidden meanings in your dreams with AI-powered insight
          </p>
        </div>

        {/* Dream Input Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-7 mb-7 shadow-xl">
          <h2 className="text-2xl font-bold text-foreground mb-5">Share Your Dream</h2>
          <h3 className="text-base font-semibold text-foreground mb-4">I'm Listening... Tell Me More</h3>
          <Textarea
            id="dream-input"
            placeholder="What did you dream of, my friend? Feel free to share your dream here... It's a safe space."
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            className="min-h-[170px] text-base bg-background/50 border-border focus:border-primary resize-none"
            disabled={isLoading}
          />

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}

          <Button
            onClick={handleInterpret}
            disabled={isLoading || !dream.trim()}
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
            <div className={`w-14 h-14 mx-auto mb-4 transition-all duration-300 ${!dream.trim() ? "opacity-50 grayscale" : "opacity-100"}`}>
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
    </main>
  )
}
