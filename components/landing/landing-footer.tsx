import { ActivitySquare } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="relative z-10 py-12 border-t border-border/40 text-center bg-background/50 backdrop-blur-md">
      <div className="flex items-center justify-center gap-2 mb-4">
          <ActivitySquare className="size-5 text-primary" />
          <span className="font-bold text-lg">TrialGo</span>
      </div>
      <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TrialGo. Medical Research & AI Optimization.</p>
    </footer>
  )
}