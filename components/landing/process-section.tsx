export function ProcessSection() {
    const AGENTS = [
      { id: 1, name: "Scraper", desc: "ClinicalTrials.gov, WHO, Reddit & Twitter" },
      { id: 2, name: "NLP Extractor", desc: "ICD-10 entity extraction from social posts" },
      { id: 3, name: "Matcher", desc: "Cosine similarity scoring against trial criteria" },
      { id: 12, name: "Fraud Detector", desc: "Bot, duplicate & impossible symptom checks" },
      { id: 4, name: "Outreach", desc: "Personalised multi-channel candidate messages" },
      { id: 9, name: "Trust Chatbot", desc: "LLM-powered patient Q&A via WebSocket" },
      { id: 6, name: "Consent AI", desc: "PDF → plain English bullet-point summaries" },
      { id: 11, name: "Multilingual", desc: "8 Indian languages via NLLB-200 / GPT" },
      { id: 5, name: "History & FHIR", desc: "De-identification & FHIR R4 bundle creation" },
      { id: 7, name: "Dropout Predictor", desc: "Daily LogisticRegression engagement scoring" },
      { id: 10, name: "Re-engagement", desc: "SMS/email based on RED/AMBER risk tier" },
      { id: 8, name: "Anomaly Detector", desc: "Z-score biometric outlier detection" },
    ]
  
    return (
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="mb-4 inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-500">
            Under The Hood
          </div>
          <h2 className="text-4xl font-bold tracking-tight">12 Agents Working For You</h2>
          <p className="text-xl text-muted-foreground mt-4">Every step from discovery to enrollment is handled by a specialised AI agent</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {AGENTS.map((a, i) => (
            <div key={a.id} className="relative rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-muted/30" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-linear-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent font-extrabold text-xl">
                  #{a.id.toString().padStart(2, "0")}
                </span>
                <span className="font-semibold text-lg">{a.name}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }