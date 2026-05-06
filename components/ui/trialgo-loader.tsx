"use client";

import { cn } from "@/lib/utils";

interface TrialGoLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  labelClassName?: string;
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
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={cn("trialgo-loader", size, className)}>
        <div className="loader-box1" />
        <div className="loader-box2" />
        <div className="loader-box3" />
      </div>
      {label && (
        <p
          className={cn(
            "text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse",
            labelClassName
          )}
        >
          {label}
        </p>
      )}
    </div>
  );
}

/**
 * Full-page loading variant
 * Centers the loader with optional text and adjusts styling for fullscreen context
 */
export function TrialGoLoaderFullPage({
  label = "Loading...",
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <TrialGoLoader size={size} label={label} />
    </div>
  );
}

/**
 * Inline loading variant
 * Small loader for inline/button context
 */
export function TrialGoLoaderInline() {
  return <TrialGoLoader size="sm" />;
}
