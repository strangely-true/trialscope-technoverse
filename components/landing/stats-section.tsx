"use client";

import { Globe, Bot, Radio, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useIntersection } from "@/hooks/use-intersection";
import { cn } from "@/lib/utils";

const STATS = [
  { icon: Globe, value: 18, label: "Registries", suffix: "" },
  { icon: Bot, value: 12, label: "AI Agents", suffix: "" },
  { icon: Radio, value: 40, label: "Endpoints", suffix: "+" },
  { icon: Zap, value: 0, label: "Real-time", suffix: "", isText: true, displayText: "Real-time" },
];

export function StatsSection() {
  const { ref, isVisible } = useIntersection({ threshold: 0.15 });

  return (
    <section ref={ref} className="relative z-10 py-20 bg-[var(--surface-primary)] dark:bg-slate-900">
      {/* Subtle divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[var(--secondary-300)] to-transparent opacity-40" />

      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-blue)] dark:bg-slate-800",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
              style={{
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary-50)] dark:bg-[var(--secondary-100)]">
                <stat.icon className="h-6 w-6 text-[var(--secondary-600)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {stat.isText ? (
                  stat.displayText
                ) : isVisible ? (
                  <>
                    <AnimatedCounter targetNumber={stat.value} format="number" />
                    {stat.suffix}
                  </>
                ) : (
                  "0"
                )}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
