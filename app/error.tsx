"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-slate-100 p-4 text-left text-xs text-red-600 dark:bg-slate-800 dark:text-red-400">
          {error.message}
        </pre>
      )}
      <Button onClick={reset} className="mt-6 rounded-full px-6">
        <RotateCcw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
