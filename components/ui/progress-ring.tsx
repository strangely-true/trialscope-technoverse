"use client";

import { cn } from "@/lib/utils";
import { useIntersection } from "@/hooks/use-intersection";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

function getColor(value: number) {
  if (value >= 80) return { stroke: "#10B981", text: "text-emerald-600" };
  if (value >= 60) return { stroke: "#F59E0B", text: "text-amber-600" };
  return { stroke: "#94A3B8", text: "text-slate-500" };
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  showLabel = true,
}: ProgressRingProps) {
  const { ref, isVisible } = useIntersection({ triggerOnce: true });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const { stroke, text } = getColor(value);

  return (
    <div ref={ref} className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isVisible ? offset : circumference}
          style={{
            transition: "stroke-dashoffset 0.8s ease-out",
          }}
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            "absolute text-sm font-bold",
            text
          )}
        >
          {value}%
        </span>
      )}
    </div>
  );
}
