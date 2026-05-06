import { AuroraBackgroundHero } from "@/components/ui/aurora-background";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PharmaSection } from "@/components/landing/pharma-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <LandingHeader />

      {/* Hero with Aurora */}
      <AuroraBackgroundHero className="min-h-screen">
        <HeroSection />
      </AuroraBackgroundHero>

      {/* Stats */}
      <StatsSection />

      {/* Features */}
      <FeatureGrid />

      {/* How It Works */}
      <HowItWorks />

      {/* For Pharma */}
      <PharmaSection />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
