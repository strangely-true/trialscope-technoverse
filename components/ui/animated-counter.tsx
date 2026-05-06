"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  targetNumber: number;
  duration?: number;
  format?: "number" | "abbreviated" | "percentage";
  suffix?: string;
  prefix?: string;
  className?: string;
  easing?: "linear" | "easeOut" | "easeOutExpo";
}

/**
 * Animated Counter Component
 *
 * Counts from 0 to targetNumber when element enters viewport.
 * Uses IntersectionObserver + requestAnimationFrame for smooth performance.
 *
 * Features:
 * - Viewport-aware: Only animates when visible
 * - Multiple format options: plain number, abbreviated (1.2K), percentage (87%)
 * - Configurable easing functions
 * - Custom prefix/suffix support
 * - Automatic animation only runs once
 *
 * Usage:
 * ```tsx
 * <AnimatedCounter
 *   targetNumber={1234}
 *   format="abbreviated"
 *   duration={1200}
 *   easing="easeOutExpo"
 * />
 *
 * <AnimatedCounter
 *   targetNumber={87}
 *   format="percentage"
 *   suffix="%"
 * />
 * ```
 */
export function AnimatedCounter({
  targetNumber,
  duration = 1200,
  format = "number",
  suffix = "",
  prefix = "",
  className = "",
  easing = "easeOutExpo",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Easing functions
  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - (1 - t) * (1 - t),
    easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  };

  const easeFn = easingFunctions[easing];

  // Format display value
  const formatValue = (value: number): string => {
    switch (format) {
      case "abbreviated":
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + "M";
        }
        if (value >= 1000) {
          return (value / 1000).toFixed(1) + "K";
        }
        return Math.round(value).toString();

      case "percentage":
        return Math.round(value).toString();

      case "number":
      default:
        return Math.round(value).toLocaleString();
    }
  };

  // Start animation
  const startAnimation = () => {
    if (hasAnimated || !elementRef.current) return;

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(progress);

      const currentValue = targetNumber * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
        setDisplayValue(targetNumber);
      }
    };

    requestAnimationFrame(animate);
  };

  // Setup Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
            // Stop observing after animation starts
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
}

/**
 * Stat Card with Animated Counter
 *
 * Pre-styled component for displaying statistics with animated counters
 */
export function StatCard({
  label,
  targetNumber,
  format = "number",
  suffix,
  icon,
}: {
  label: string;
  targetNumber: number;
  format?: "number" | "abbreviated" | "percentage";
  suffix?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-secondary p-6 text-center shadow-sm dark:border-border-focus dark:bg-slate-800">
      {icon && <div className="text-2xl">{icon}</div>}
      <div className="text-3xl font-bold text-text-primary dark:text-text-primary">
        <AnimatedCounter
          targetNumber={targetNumber}
          format={format}
          suffix={suffix}
          easing="easeOutExpo"
        />
      </div>
      <p className="text-sm text-text-muted dark:text-text-muted">{label}</p>
    </div>
  );
}

/**
 * Progress Counter
 *
 * Animated counter for progress/metrics display
 */
export function ProgressCounter({
  current,
  total,
  label,
  showPercentage = true,
}: {
  current: number;
  total: number;
  label: string;
  showPercentage?: boolean;
}) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary dark:text-text-secondary">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
            <AnimatedCounter targetNumber={percentage} format="percentage" suffix="%" />
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-secondary-500 to-secondary-600 transition-all duration-500 dark:from-secondary-400 dark:to-secondary-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted dark:text-text-muted">
        <span>
          <AnimatedCounter targetNumber={current} format="number" />
        </span>
        <span>{total}</span>
      </div>
    </div>
  );
}
