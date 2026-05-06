"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
  showRadialGradient?: boolean;
}

/**
 * Aurora Background Component
 *
 * Creates an animated aurora gradient background with optional radial gradient mask.
 * Perfect for hero sections, auth pages, and loading states.
 *
 * Intensity levels:
 * - subtle: 30% opacity (error pages, subtle backgrounds)
 * - medium: 50% opacity (auth pages, login/register)
 * - strong: 70% opacity (landing hero, feature sections)
 *
 * Features:
 * - Blue-indigo monochrome gradient (no purple/violet)
 * - Smooth 15s infinite animation
 * - Dark mode support (aurora becomes more visible)
 * - Optional radial gradient mask for depth
 * - High performance with will-change and pointer-events optimizations
 */
export function AuroraBackground({
  children,
  className,
  intensity = "medium",
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  const intensityMap = {
    subtle: "opacity-30",
    medium: "opacity-50",
    strong: "opacity-70",
  };

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Aurora gradient background */}
      <div
        className={cn(
          "absolute inset-0 z-0 pointer-events-none will-change-transform",
          "bg-gradient-to-b from-secondary-100 via-secondary-50 to-background",
          "dark:from-secondary-600 dark:via-secondary-700 dark:to-slate-900",
          intensityMap[intensity]
        )}
        style={{
          animation: "aurora 15s ease-in-out infinite",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Optional radial gradient mask for depth */}
      {showRadialGradient && (
        <div
          className={cn(
            "absolute inset-0 z-0 pointer-events-none",
            "bg-radial-gradient opacity-40 dark:opacity-60"
          )}
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Optional subtle noise/grain overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='2' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundSize: "400px 400px",
          opacity: 0.5,
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

/**
 * Landing hero variant - strongest aurora effect
 */
export function AuroraBackgroundHero({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AuroraBackground
      intensity="strong"
      showRadialGradient={true}
      className={className}
    >
      {children}
    </AuroraBackground>
  );
}

/**
 * Auth page variant - medium aurora effect
 */
export function AuroraBackgroundAuth({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AuroraBackground
      intensity="medium"
      showRadialGradient={true}
      className={className}
    >
      {children}
    </AuroraBackground>
  );
}

/**
 * Error page variant - subtle aurora effect
 */
export function AuroraBackgroundError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AuroraBackground
      intensity="subtle"
      showRadialGradient={false}
      className={className}
    >
      {children}
    </AuroraBackground>
  );
}
