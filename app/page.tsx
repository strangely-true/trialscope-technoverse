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
    <div className="min-h-screen bg-[#FAFBFC] text-slate-900">
      <LandingHeader />

      <AuroraBackgroundHero className="min-h-screen">
        <HeroSection />
      </AuroraBackgroundHero>

      <div className="bg-[#FAFBFC]">
        <StatsSection />
        <FeatureGrid />
        <HowItWorks />
        <PharmaSection />
      </div>

      <LandingFooter />
    </div>
  )
}
