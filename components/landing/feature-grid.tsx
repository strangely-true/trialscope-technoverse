"use client";

import { Target, FileCheck, Shield, Search, FileJson, Languages } from "lucide-react";
import { useIntersection } from "@/hooks/use-intersection";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Target,
    title: "Smart Matching",
    description:
      "AI matches patients to trials using cosine similarity scoring against eligibility criteria.",
  },
  {
    icon: FileCheck,
    title: "Consent Simplified",
    description:
      "PDF consent forms converted to plain-English summaries with digital signature support.",
  },
  {
    icon: Shield,
    title: "Dropout Prevention",
    description:
      "Daily engagement scoring with automated re-engagement via SMS and email for at-risk patients.",
  },
  {
    icon: Search,
    title: "Anomaly Detection",
    description:
      "Z-score biometric outlier detection for heart rate, glucose, blood pressure, and more.",
  },
  {
    icon: FileJson,
    title: "FHIR Export",
    description:
      "HL7 FHIR R4 standard data export including Patient, Condition, Observation, and Medication resources.",
  },
  {
    icon: Languages,
    title: "Multilingual",
    description:
      "Support for 9+ languages via NLLB-200 and GPT translation for inclusive global recruitment.",
  },
];

export function FeatureGrid() {
  const { ref, isVisible } = useIntersection({ threshold: 0.1 });

  return (
    <section ref={ref} className="relative z-10 py-24 px-6 bg-white">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything You Need for Trial Success
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Comprehensive tools for patients, coordinators, and pharma teams
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={cn(
                "group rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition-transform group-hover:scale-110 group-hover:bg-blue-600">
                <feature.icon className="h-6 w-6 text-blue-600 transition-colors group-hover:text-white" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {feature.description}
              </p>

              {/* Hover accent */}
              <div className="mt-4 h-0.5 w-0 rounded-full bg-blue-500 transition-all duration-300 group-hover:w-12" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
