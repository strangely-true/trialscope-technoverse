"use client"

import { cn } from "@/lib/utils"

interface TrialGoLoaderProps {
  size?: "sm" | "md" | "lg"
  className?: string
  label?: string
  labelClassName?: string
}

/**
 * TrialGo Loader - Animated 3-box morphing loader
 *
 * Sizes:
 * - sm: 56px (for inline/button loading)
 * - md: 112px (for page/section loading)
 * - lg: 168px (for full-page loading)
 *
 * Usage contexts:
 * - Full-page loading: Center vertically + horizontally with "Loading..." text
 * - Inline data loading: sm size next to content area
 * - Form submission: sm size replacing button text
 * - Pipeline processing: md with step labels below
 */
export function TrialGoLoader({
  size = "md",
  className,
  label,
  labelClassName,
}: TrialGoLoaderProps) {
  const sizeMap = {
    sm: "h-12 w-12",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={cn("relative flex items-center justify-center", sizeMap[size], className)}>
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-[spin_1.5s_linear_infinite]" />
        
        {/* Middle spinning ring (reverse) */}
        <div className="absolute inset-2 rounded-full border-4 border-indigo-500/20 border-b-indigo-500 animate-[spin_2s_linear_infinite_reverse]" />
        
        {/* Inner pulsing DNA/Dot */}
        <div className="h-1/3 w-1/3 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse" />
        
        {/* Orbital dots */}
        <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
        </div>
      </div>
      
      {label && (
        <div className="flex flex-col items-center gap-1">
          <p
            className={cn(
              "text-sm font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white",
              labelClassName
            )}
          >
            {label}
          </p>
          <div className="flex gap-1">
            <div className="h-1 w-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
            <div className="h-1 w-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
            <div className="h-1 w-1 rounded-full bg-blue-600 animate-bounce" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Full-page loading variant
 * Centers the loader with optional text and adjusts styling for fullscreen context
 */
export function TrialGoLoaderFullPage({
  label = "Loading...",
  size = "md",
}: {
  label?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <TrialGoLoader size={size} label={label} />
    </div>
  )
}

/**
 * Inline loading variant
 * Small loader for inline/button context
 */
export function TrialGoLoaderInline({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin text-current", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}
