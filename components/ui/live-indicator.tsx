"use client";

import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  connected: boolean;
  className?: string;
  onReconnect?: () => void;
}

export function LiveIndicator({
  connected,
  className,
  onReconnect,
}: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            connected ? "bg-emerald-500" : "bg-red-500"
          )}
        />
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          connected ? "text-emerald-600" : "text-red-500"
        )}
      >
        {connected ? "Live" : "Disconnected"}
      </span>
      {!connected && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs font-medium text-[var(--secondary-600)] hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
