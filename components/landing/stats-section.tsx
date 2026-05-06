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
    <section ref={ref} className="relative z-10 py-20 bg-white border-y border-slate-200">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/10",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
              style={{
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
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
              <p className="mt-1 text-sm font-medium text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
