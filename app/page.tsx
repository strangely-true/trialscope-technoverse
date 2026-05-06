import { LandingHeader } from "@/components/landing/landing-header"
import { HeroSection } from "@/components/landing/hero-section"
import { FeatureGrid } from "@/components/landing/feature-grid"
import { ProcessSection } from "@/components/landing/process-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] opacity-[0.10] blur-[100px] bg-[conic-gradient(at_center_center,rgba(56,189,248,1),rgba(99,102,241,1),rgba(56,189,248,1))] animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,hsl(var(--background))_80%)]" />
      </div>

      <LandingHeader />
      <HeroSection />
      <FeatureGrid />
      <ProcessSection />
      <LandingFooter />
    </div>
  )
}

