"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: number; direction: "up" | "down" };
  badge?: { text: string; variant: "success" | "warning" | "danger" };
  miniChart?: React.ReactNode;
  loading?: boolean;
  animate?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  badge,
  miniChart,
  loading = false,
  animate = true,
  className,
}: StatCardProps) {
  const trendColor =
    trend?.direction === "up" ? "text-emerald-600" : "text-red-500";

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 dark:bg-slate-800",
          className
        )}
      >
        <div className="mb-3 h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
        <div className="mb-2 h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
        <div className="h-8 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-blue)] dark:bg-slate-800",
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary-50)] dark:bg-[var(--secondary-100)]">
          <Icon className="h-5 w-5 text-[var(--secondary-600)]" />
        </div>
      )}

      {/* Title */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </p>

      {/* Value */}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[var(--text-primary)]">
          {animate && typeof value === "number" ? (
            <AnimatedCounter targetNumber={value} format="number" />
          ) : (
            value
          )}
        </span>

        {/* Badge */}
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              badge.variant === "success" &&
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              badge.variant === "warning" &&
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              badge.variant === "danger" &&
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className={cn("mt-2 flex items-center gap-1 text-sm", trendColor)}>
          {trend.direction === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span className="font-medium">
            {trend.direction === "up" ? "+" : ""}
            {trend.value}%
          </span>
        </div>
      )}

      {/* Mini chart */}
      {miniChart && <div className="mt-3">{miniChart}</div>}
    </div>
  );
}
