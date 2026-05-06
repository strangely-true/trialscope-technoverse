"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ActivitySquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/40 py-3 shadow-lg" : "bg-transparent py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-xl transition-transform group-hover:scale-110">
            <ActivitySquare className="size-6 text-primary" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Trial<span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">Go</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#impact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Impact</Link>
          <Link href="/register" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For Patients</Link>
          <Link href="/pharma/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For Pharma</Link>
          <Link href="/coordinator/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Coordinator</Link>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button asChild className="rounded-full px-6 transition-all hover:scale-105 shadow-md shadow-primary/20">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}