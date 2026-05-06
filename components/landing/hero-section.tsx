import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedCounter } from "@/components/ui/animated-counter"

const STATS = [
    { value: 10000, label: "Patients Matched" },
    { value: 500, label: "Active Trials" },
    { value: 98, label: "Satisfaction Rate", format: "percentage" as const, suffix: "%" },
]

export function HeroSection() {
    return (
        <main className="relative z-10 flex flex-col items-center justify-center pt-40 pb-20 px-6 text-center min-h-[90vh]">
            <Badge variant="outline" className="mb-8 cursor-default rounded-full border-secondary-600/30 bg-secondary-600/5 px-5 py-2 text-secondary-600 dark:text-secondary-400 backdrop-blur-md transition-transform hover:scale-105">
                <Sparkles className="mr-2 size-4" />
                The AI-Powered Clinical Matchmaker
            </Badge>

            <h1 className="max-w-5xl text-5xl font-extrabold tracking-tight text-text-primary dark:text-text-primary sm:text-7xl md:text-8xl leading-[1.1]">
                Medical research built <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-secondary-400 via-secondary-500 to-secondary-600 dark:from-secondary-300 dark:via-secondary-400 dark:to-secondary-500">
                    around impact.
                </span>
            </h1>

            <p className="mt-8 max-w-2xl mx-auto text-xl leading-relaxed text-text-secondary dark:text-text-secondary sm:text-2xl">
                Discover relevant studies, streamline coordinator workflows, and gain unprecedented visibility. Fully powered by 12 specialized AI agents.
            </p>

            <div className="mt-12 flex flex-col w-full sm:w-auto sm:flex-row gap-4 items-center justify-center">
                <Button asChild size="lg" className="h-14 w-full sm:w-auto rounded-full px-10 text-lg font-semibold shadow-blue transition-all hover:scale-105 hover:shadow-lg hover:bg-secondary-700 dark:hover:bg-secondary-600">
                    <Link href="/register">
                        I&apos;m a Patient
                        <ArrowRight className="ml-2 size-5" />
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 w-full sm:w-auto rounded-full border-border-default bg-surface-primary/50 dark:border-border-subtle dark:bg-slate-800/50 px-10 text-lg font-semibold backdrop-blur-md transition-all hover:scale-105 hover:bg-surface-secondary dark:hover:bg-slate-700">
                    <Link href="/pharma/login">
                        I&apos;m a Pharma Company
                    </Link>
                </Button>
            </div>

            {/* IMPACT METRICS */}
            <div id="impact" className="mt-24 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-default/40 dark:divide-border-subtle rounded-3xl border border-border-default/30 dark:border-border-subtle bg-surface-primary/40 dark:bg-slate-800/40 p-8 shadow-lg dark:shadow-slate-900/50 shadow-indigo-500/5 backdrop-blur-xl sm:p-10">
                {STATS.map((stat) => (
                    <div key={stat.label} className="group flex flex-col items-center justify-center py-4 sm:py-0 transition-transform hover:scale-105">
                        <p className="text-5xl font-extrabold tracking-tighter text-text-primary dark:text-text-primary sm:text-6xl">
                            <AnimatedCounter
                                targetNumber={stat.value}
                                format={stat.format || "number"}
                                suffix={stat.suffix || ""}
                                easing="easeOutExpo"
                            />
                        </p>
                        <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-text-muted dark:text-text-muted group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors">{stat.label}</p>
                    </div>
                ))}
            </div>
        </main>
    )
}
