"use client";

import { UserPlus, BrainCircuit, HeartPulse } from "lucide-react";
import { useIntersection } from "@/hooks/use-intersection";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: 1,
    icon: UserPlus,
    title: "Register & Profile",
    description:
      "Create your medical profile in minutes. Our guided questionnaire captures your conditions, medications, and preferences.",
  },
  {
    number: 2,
    icon: BrainCircuit,
    title: "AI Matches You",
    description:
      "Our 12 specialized agents scan 18 registries, analyze your profile, and find perfect trial matches with confidence scores.",
  },
  {
    number: 3,
    icon: HeartPulse,
    title: "Enroll & Monitor",
    description:
      "Sign consent digitally, track your health with weekly logs, and stay supported with our AI chatbot throughout your journey.",
  },
];

export function HowItWorks() {
  const { ref, isVisible } = useIntersection({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className="relative z-10 bg-[#FAFBFC] py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How TrialGo Works
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            From registration to enrollment in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 md:block">
            <div
              className={cn(
                "mx-auto h-full w-2/3 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 transition-all duration-1000",
                isVisible ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
              )}
            />
          </div>

          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={cn(
                "relative flex flex-col items-center text-center transition-all duration-500",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              {/* Step number circle */}
              <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-lg font-bold text-blue-600 shadow-sm transition-transform hover:scale-110">
                {step.number}
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <step.icon className="h-8 w-8 text-blue-600" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
