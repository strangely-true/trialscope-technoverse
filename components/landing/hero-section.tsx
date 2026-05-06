"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"

const STATS = [
  { value: 10000, label: "Patients Matched", suffix: "+" },
  { value: 500, label: "Active Trials", suffix: "+" },
  { value: 98, label: "Satisfaction Rate", format: "percentage" as const, suffix: "%" },
]

export function HeroSection() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-36 text-center">

      {/* Badge pill */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-700 shadow-sm transition-transform hover:scale-105">
        <Sparkles className="h-4 w-4" />
        The AI-Powered Clinical Matchmaker
      </div>

      {/* Main headline */}
      <h1 className="max-w-5xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-7xl md:text-[86px]">
        Medical research built{" "}
        <br className="hidden sm:block" />
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          around impact.
        </span>
      </h1>

      {/* Sub-headline */}
      <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
        Discover relevant studies, streamline coordinator workflows, and gain
        unprecedented visibility. Fully powered by{" "}
        <span className="font-semibold text-blue-700">12 specialized AI agents</span>.
      </p>

      {/* CTA Buttons */}
      <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
        <Link
          href="/register"
          className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-10 text-lg font-semibold text-white shadow-[0_10px_40px_rgba(37,99,235,0.2)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_15px_50px_rgba(37,99,235,0.3)] sm:w-auto"
        >
          I&apos;m a Patient
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/pharma/login"
          className="flex h-14 w-full items-center justify-center rounded-full border border-slate-200 bg-white/80 px-10 text-lg font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
        >
          I&apos;m a Pharma Company
        </Link>
      </div>

      {/* Trust badges */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />HIPAA Compliant</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />HL7 FHIR R4</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />18 Global Registries</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />12 AI Agents</span>
      </div>

      {/* Impact metrics */}
      <div
        id="impact"
        className="mt-20 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white/60 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:grid-cols-3"
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center px-8 py-10 transition-colors hover:bg-white/80 ${
              i < STATS.length - 1 ? "border-b border-slate-200 sm:border-b-0 sm:border-r" : ""
            }`}
          >
            <p className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              <AnimatedCounter
                targetNumber={stat.value}
                format={stat.format || "number"}
                suffix={stat.suffix || ""}
                easing="easeOutExpo"
              />
            </p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <div className="mt-16 flex flex-col items-center gap-2 text-slate-400">
        <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </main>
  )
}
