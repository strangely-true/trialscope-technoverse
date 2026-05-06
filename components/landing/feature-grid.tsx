import Link from "next/link"
import { ArrowRight, HeartPulse, Activity, BrainCircuit } from "lucide-react"

const FEATURES = [
  { 
    title: "Patient App", 
    icon: HeartPulse, 
    color: "text-emerald-500", 
    bg: "bg-emerald-500/10", 
    border: "hover:border-emerald-500/50", 
    shadow: "hover:shadow-emerald-500/20", 
    desc: "Get matched to clinical trials that fit your condition. Simplified consent and support.", 
    href: "/register" 
  },
  { 
    title: "Coordinator Dashboard", 
    icon: Activity, 
    color: "text-sky-500", 
    bg: "bg-sky-500/10", 
    border: "hover:border-sky-500/50", 
    shadow: "hover:shadow-sky-500/20", 
    desc: "Real-time patient monitoring with RAG risk indicators, dropout prediction, and more.", 
    href: "/coordinator/login" 
  },
  { 
    title: "Pharma Portal", 
    icon: BrainCircuit, 
    color: "text-indigo-500", 
    bg: "bg-indigo-500/10", 
    border: "hover:border-indigo-500/50", 
    shadow: "hover:shadow-indigo-500/20", 
    desc: "Post trial criteria and let AI handle candidate discovery, fraud detection, and outreach.", 
    href: "/pharma/login" 
  },
]

export function FeatureGrid() {
  return (
    <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold tracking-tight">Three Portals, One Platform</h2>
        <p className="mt-4 text-xl text-muted-foreground">Unified access for everyone involved in clinical trials.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {FEATURES.map((item) => (
          <div key={item.title} className={`group relative rounded-3xl border border-border/40 bg-card/40 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${item.border} ${item.shadow}`}>
            <div className={`mb-6 inline-flex p-4 rounded-2xl ${item.bg} transition-transform group-hover:scale-110`}>
              <item.icon className={`size-8 ${item.color}`} />
            </div>
            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed mb-8">{item.desc}</p>
            <Link href={item.href} className={`inline-flex items-center font-semibold ${item.color} group-hover:underline underline-offset-4 decoration-2`}>
              Explore portal <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}