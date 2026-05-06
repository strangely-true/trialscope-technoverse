import { AuroraBackgroundHero } from "@/components/ui/aurora-background"
import { LandingHeader } from "@/components/landing/landing-header"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FeatureGrid } from "@/components/landing/feature-grid"
import { HowItWorks } from "@/components/landing/how-it-works"
import { PharmaSection } from "@/components/landing/pharma-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata = {
  title: "TrialGo — AI-Powered Clinical Trial Recruitment",
  description:
    "Discover relevant clinical studies, streamline coordinator workflows, and gain unprecedented visibility. Powered by 12 specialized AI agents.",
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#FAFBFC] text-slate-900 overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute -right-[10%] top-[40%] h-[600px] w-[600px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute left-[20%] top-[70%] h-[400px] w-[400px] rounded-full bg-violet-500/20 blur-[120px]" />
      </div>

      <LandingHeader />

      <AuroraBackgroundHero className="min-h-screen relative z-10">
        <HeroSection />
      </AuroraBackgroundHero>

      <div className="relative z-10">
        <StatsSection />
        <FeatureGrid />
        <HowItWorks />
        <PharmaSection />
      </div>

      <LandingFooter />
    </div>
  )
}
