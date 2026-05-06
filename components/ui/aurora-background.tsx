"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

/**
 * Light-mode hero background — soft blue radial glow on white
 */
export function AuroraBackgroundHero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative w-full overflow-hidden bg-white", className)}
      style={{
        background: "linear-gradient(180deg, #EFF6FF 0%, #FAFBFC 60%, #FFFFFF 100%)",
      }}
    >
      {/* Top-left aurora blob */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "55%",
          height: "70%",
          background: "radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Top-right aurora blob */}
      <div
        style={{
          position: "absolute",
          top: "-5%",
          right: "-10%",
          width: "50%",
          height: "60%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom glow */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "30%",
          background: "radial-gradient(ellipse, rgba(37,99,235,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function AuroraBackground({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative w-full overflow-hidden bg-[#FAFBFC]", className)}>{children}</div>
}

export function AuroraBackgroundAuth({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative min-h-screen w-full overflow-hidden", className)}
      style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #FAFBFC 50%, #F0F9FF 100%)" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "50%",
          background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function AuroraBackgroundError({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative min-h-screen w-full bg-[#FAFBFC]", className)}>{children}</div>
}
