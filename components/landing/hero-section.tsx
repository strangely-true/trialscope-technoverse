import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STATS = [
    { value: "10,000+", label: "Patients Matched" },
    { value: "500+", label: "Active Trials" },
    { value: "98%", label: "Satisfaction Rate" },
]

export function HeroSection() {
    return (
        <main className="relative z-10 flex flex-col items-center justify-center pt-40 pb-20 px-6 text-center min-h-[90vh]">
            <Badge variant="outline" className="mb-8 cursor-default rounded-full border-primary/30 bg-primary/5 px-5 py-2 text-primary backdrop-blur-md transition-transform hover:scale-105">
                <Sparkles className="mr-2 size-4" />
                The AI-Powered Clinical Matchmaker
            </Badge>

            <h1 className="max-w-5xl text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl md:text-8xl leading-[1.1]">
                Medical research built <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 via-sky-400 to-emerald-400">
                    around impact.
                </span>
            </h1>

            <p className="mt-8 max-w-2xl mx-auto text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                Discover relevant studies, streamline coordinator workflows, and gain unprecedented visibility. Fully powered by 12 specialized AI agents.
            </p>

            <div className="mt-12 flex flex-col w-full sm:w-auto sm:flex-row gap-4 items-center justify-center">
                <Button asChild size="lg" className="h-14 w-full sm:w-auto rounded-full px-10 text-lg font-semibold shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.7)] hover:bg-primary/90">
                    <Link href="/register">
                        I&apos;m a Patient
                        <ArrowRight className="ml-2 size-5" />
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 w-full sm:w-auto rounded-full border-border/60 bg-background/50 px-10 text-lg font-semibold backdrop-blur-md transition-all hover:scale-105 hover:bg-muted/80">
                    <Link href="/pharma/login">
                        I&apos;m a Pharma Company
                    </Link>
                </Button>
            </div>

            {/* IMPACT METRICS */}
            <div id="impact" className="mt-24 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40 rounded-3xl border border-border/30 bg-background/40 p-8 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl sm:p-10">
                {STATS.map((stat) => (
                    <div key={stat.label} className="group flex flex-col items-center justify-center py-4 sm:py-0 transition-transform hover:scale-105">
                        <p className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 sm:text-6xl">{stat.value}</p>
                        <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{stat.label}</p>
                    </div>
                ))}
            </div>
        </main>
    )
}
