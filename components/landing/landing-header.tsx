"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ActivitySquare, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const navLinks = [
    { href: "#impact", label: "Impact", key: "impact" },
    { href: "/register", label: "For Patients", key: "patients" },
    { href: "/login", label: "For Pharma", key: "pharma" },
    { href: "/login", label: "Coordinator", key: "coordinator" },
  ]

  return (
    <header
      className={`fixed left-0 right-0 top-6 z-50 transition-all duration-500`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <div 
          className={cn(
            "flex w-full items-center justify-between rounded-full border border-slate-200/50 bg-white/60 px-6 py-2.5 backdrop-blur-xl shadow-xl transition-all duration-500",
            scrolled ? "bg-white/80 py-2" : "py-3"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <img src="/trialgo.png" alt="TrialGo Logo" className="h-8 w-8 rounded-lg transition-transform group-hover:scale-110" />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Trial<span className="text-blue-600">Go</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mx-auto mt-4 max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 p-6 backdrop-blur-xl shadow-xl md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
              <Link 
                href="/login" 
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-slate-950 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}