"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { useIntersection } from "@/hooks/use-intersection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  "AI-powered candidate discovery across 18 registries",
  "Social media lead detection on Reddit & Twitter",
  "Automated outreach with personalized messaging",
  "FHIR R4 compliant data export for interoperability",
];

export function PharmaSection() {
  const { ref, isVisible } = useIntersection({ threshold: 0.15 });

  return (
    <section ref={ref} className="relative z-10 py-24 bg-slate-50 border-y border-slate-200">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left: Text */}
          <div
            className={cn(
              "transition-all duration-700",
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            )}
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for Pharma Teams
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Accelerate recruitment timelines with AI-driven candidate matching
              and automated outreach pipelines.
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((benefit, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3"
                  style={{ transitionDelay: `${i * 100 + 300}ms` }}
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Check className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-600">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            <Button asChild className="mt-8 rounded-full px-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" size="lg">
              <Link href="/login">
                Explore Pharma Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right: Dashboard mockup */}
          <div
            className={cn(
              "transition-all duration-700 delay-200",
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            )}
          >
            <div className="relative rounded-2xl border border-white/40 bg-white/60 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
              {/* Mock dashboard header */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-slate-500">
                  Pharma Analytics Dashboard
                </span>
              </div>

              {/* Mock stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Enrolled", value: "847" },
                  { label: "Match Score", value: "78%" },
                  { label: "Dropout Risk", value: "12%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-200/50 bg-white/40 p-3 text-center backdrop-blur-sm transition-all hover:bg-white/60"
                  >
                    <p className="text-lg font-bold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mock chart area */}
              <div className="h-32 rounded-lg bg-gradient-to-t from-blue-500/10 to-transparent flex items-end px-4 pb-4 gap-2">
                {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
