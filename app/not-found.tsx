import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <AuroraBackground intensity="subtle" className="min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-[120px] font-bold leading-none text-[var(--secondary-500)] opacity-20 sm:text-[180px]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="mt-2 text-lg text-[var(--text-muted)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild variant="default" className="rounded-full px-6">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full px-6"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </AuroraBackground>
  );
}
