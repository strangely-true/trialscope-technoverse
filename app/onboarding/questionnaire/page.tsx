"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const CONDITIONS = [
  "Blood Cancer", "Lung Cancer", "Breast Cancer", "Prostate Cancer",
  "Diabetes Type 1", "Diabetes Type 2", "Hypertension", "Alzheimer's",
  "Parkinson's", "Multiple Sclerosis", "Rheumatoid Arthritis", "Asthma",
  "COPD", "Epilepsy", "Heart Failure", "Chronic Kidney Disease",
  "Hepatitis B", "Hepatitis C", "HIV/AIDS", "Crohn's Disease",
  "Ulcerative Colitis", "Psoriasis", "Lupus", "Melanoma",
  "Ovarian Cancer", "Pancreatic Cancer", "Leukemia", "Lymphoma",
]

const STAGES = [
  "Early Stage", "Stage 1", "Stage 2", "Stage 3", "Stage 4",
  "Mild", "Moderate", "Severe", "Not Sure",
]

const DURATIONS = [
  "Less than 1 month", "1 to 6 months", "6 months to 1 year",
  "1 to 3 years", "More than 3 years",
]

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"]

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "China", "Brazil", "South Africa",
  "South Korea", "Mexico", "Italy", "Spain", "Netherlands", "Sweden",
  "Switzerland", "Singapore", "Thailand", "Malaysia", "Indonesia",
  "Philippines", "New Zealand", "Ireland", "Belgium", "Austria",
  "Denmark", "Norway", "Finland", "Poland", "Turkey", "Israel",
  "Saudi Arabia", "UAE", "Egypt", "Nigeria", "Kenya", "Bangladesh",
  "Pakistan", "Sri Lanka", "Nepal", "Iran", "Argentina", "Chile",
  "Colombia", "Peru", "Vietnam", "Taiwan", "Russia", "Ukraine",
]

const SEARCHING_MESSAGES = [
  "Searching ClinicalTrials.gov...",
  "Searching WHO ICTRP...",
  "Searching EU Clinical Trials Register...",
  "Searching CTRI India...",
  "Searching ANZCTR Australia...",
  "Searching ChiCTR China...",
  "Searching ISRCTN Registry...",
  "Searching DRKS Germany...",
  "Searching 12 more databases...",
  "Analysing results and scoring matches...",
]

interface FormData {
  primary_condition: string
  condition_stage: string
  condition_duration: string
  prior_treatments: string
  current_medications: string
  country: string
  age: string
  gender: string
  additional_notes: string
}

export default function QuestionnairePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 8 // 7 questions + 1 summary
  const [form, setForm] = useState<FormData>({
    primary_condition: "",
    condition_stage: "",
    condition_duration: "",
    prior_treatments: "",
    current_medications: "",
    country: "",
    age: "",
    gender: "",
    additional_notes: "",
  })
  const [filteredConditions, setFilteredConditions] = useState<string[]>([])
  const [searching, setSearching] = useState(false)
  const [searchMsgIndex, setSearchMsgIndex] = useState(0)
  const [error, setError] = useState("")

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")
    if (!token) { router.push("/login"); return }
    if (role !== "patient") { router.push("/login"); return }

    // Pre-fill from existing questionnaire
    fetch("/api/questionnaire/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.questionnaire_data) {
          const q = data.questionnaire_data
          setForm({
            primary_condition: q.primary_condition || "",
            condition_stage: q.condition_stage || "",
            condition_duration: q.condition_duration || "",
            prior_treatments: q.prior_treatments || "",
            current_medications: q.current_medications || "",
            country: q.country || "",
            age: q.age ? String(q.age) : "",
            gender: q.gender || "",
            additional_notes: q.additional_notes || "",
          })
        }
      })
      .catch(() => {})
  }, [router])

  // Animated search messages
  useEffect(() => {
    if (!searching) return
    const interval = setInterval(() => {
      setSearchMsgIndex((prev) =>
        prev < SEARCHING_MESSAGES.length - 1 ? prev + 1 : prev
      )
    }, 2500)
    return () => clearInterval(interval)
  }, [searching])

  // Poll for results
  useEffect(() => {
    if (!searching) return
    const token = localStorage.getItem("trialgo_token")
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/questionnaire/status", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.external_matches_found > 0) {
          clearInterval(pollInterval)
          router.push("/trials")
        }
      } catch {}
    }, 3000)

    // Auto-redirect after 45 seconds regardless
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      router.push("/trials")
    }, 45000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [searching, router])

  const updateField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleConditionInput = (value: string) => {
    updateField("primary_condition", value)
    if (value.length > 1) {
      setFilteredConditions(
        CONDITIONS.filter((c) => c.toLowerCase().includes(value.toLowerCase()))
      )
    } else {
      setFilteredConditions([])
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return form.primary_condition.length > 0
      case 2: return form.condition_stage.length > 0
      case 3: return form.condition_duration.length > 0
      case 4: return true // optional
      case 5: return true // optional
      case 6: return form.country.length > 0
      case 7: return form.age.length > 0 && form.gender.length > 0
      default: return true
    }
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) { router.push("/login"); return }

    setSearching(true)
    setSearchMsgIndex(0)
    setError("")

    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age) || 0,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Submission failed")
      }
    } catch (err: any) {
      setError(err.message)
      setSearching(false)
    }
  }

  const searchQuery = [
    form.primary_condition,
    form.condition_stage,
    form.age ? `age ${form.age}` : "",
    form.gender,
    form.country,
  ]
    .filter(Boolean)
    .join(" ")

  const progress = Math.round((step / totalSteps) * 100)

  // ─── SEARCHING ANIMATION ─────────────────────────
  if (searching) {
    return (
      <div className="hero-bg flex min-h-screen items-center justify-center">
        <div className="glass-card mx-auto max-w-lg p-10 text-center">
          <div
            style={{
              width: "80px", height: "80px", margin: "0 auto 1.5rem",
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            🌍
          </div>
          <h2
            style={{
              fontFamily: "Space Grotesk", fontWeight: 700,
              fontSize: "1.4rem", marginBottom: "1.5rem",
            }}
          >
            Searching Global Databases
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
            {SEARCHING_MESSAGES.slice(0, searchMsgIndex + 1).map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  fontSize: "0.85rem",
                  color: i === searchMsgIndex ? "var(--primary)" : "var(--foreground-subtle)",
                  transition: "all 0.3s",
                }}
              >
                <span>{i < searchMsgIndex ? "✅" : "🔄"}</span>
                {msg}
              </div>
            ))}
          </div>
          <p
            style={{
              color: "var(--foreground-muted)", fontSize: "0.8rem",
              marginTop: "2rem",
            }}
          >
            This usually takes about 30 seconds...
          </p>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }`}</style>
      </div>
    )
  }

  // ─── STEP RENDER ──────────────────────────────────
  return (
    <div className="hero-bg min-h-screen">
      <nav
        style={{
          background: "rgba(5,20,36,0.9)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border)",
          padding: "1rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.1rem",
          }}
        >
          🧬 Trial<span className="text-cyan">Go</span>
        </Link>
        <span style={{ color: "var(--foreground-subtle)", fontSize: "0.85rem" }}>
          Patient Onboarding
        </span>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Progress bar */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--foreground-subtle)" }}>
            <span>Step {Math.min(step, 7)} of 7</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: "6px", background: "var(--surface-highest)", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%", width: `${progress}%`,
                background: "var(--gradient-primary)",
                transition: "width 0.4s ease", borderRadius: "3px",
              }}
            />
          </div>
        </div>

        <div className="glass-card p-8">
          {/* Step 1: Condition */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                What is your primary health condition?
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Tell us the disease or condition you are seeking a clinical trial for.
              </p>
              <input
                className="input-dark"
                placeholder="e.g. Blood Cancer, Diabetes, Lung Cancer..."
                value={form.primary_condition}
                onChange={(e) => handleConditionInput(e.target.value)}
                autoFocus
              />
              {filteredConditions.length > 0 && (
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {filteredConditions.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => { updateField("primary_condition", c); setFilteredConditions([]) }}
                      style={{
                        padding: "0.35rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem",
                        background: "rgba(0,200,150,0.1)", border: "1px solid var(--glass-border)",
                        color: "var(--primary)", cursor: "pointer",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Stage */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                What stage or severity is your condition?
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                This helps us find trials targeting your specific stage.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateField("condition_stage", s)}
                    style={{
                      padding: "0.75rem", borderRadius: "var(--radius)",
                      background: form.condition_stage === s ? "var(--primary)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.condition_stage === s ? "var(--primary)" : "var(--glass-border)"}`,
                      color: form.condition_stage === s ? "#000" : "var(--foreground)",
                      cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                How long have you had this condition?
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Duration helps match you with the right trial phase.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => updateField("condition_duration", d)}
                    style={{
                      padding: "0.85rem 1rem", borderRadius: "var(--radius)", textAlign: "left",
                      background: form.condition_duration === d ? "var(--primary)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.condition_duration === d ? "var(--primary)" : "var(--glass-border)"}`,
                      color: form.condition_duration === d ? "#000" : "var(--foreground)",
                      cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Prior treatments */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                What treatments have you already tried?
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                This helps exclude trials you may not be eligible for.
              </p>
              <textarea
                className="input-dark"
                placeholder="e.g. chemotherapy, radiation, medication name, or type None"
                value={form.prior_treatments}
                onChange={(e) => updateField("prior_treatments", e.target.value)}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
          )}

          {/* Step 5: Current medications */}
          {step === 5 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                Are you currently taking any medications?
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Some trials may require specific medication history.
              </p>
              <textarea
                className="input-dark"
                placeholder="e.g. metformin, ibuprofen, or type None"
                value={form.current_medications}
                onChange={(e) => updateField("current_medications", e.target.value)}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
          )}

          {/* Step 6: Country */}
          {step === 6 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                Where are you located?
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                We'll prioritise trials near your location.
              </p>
              <select
                className="input-dark"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 7: Age, Gender, Notes */}
          {step === 7 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                Tell us a bit about yourself
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Almost done! This helps refine your matches.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.8rem", color: "var(--foreground-muted)" }}>Age</label>
                  <input
                    className="input-dark"
                    type="number"
                    placeholder="e.g. 34"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    min={1}
                    max={120}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.8rem", color: "var(--foreground-muted)" }}>Gender</label>
                  <select
                    className="input-dark"
                    value={form.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.8rem", color: "var(--foreground-muted)" }}>Additional Notes (optional)</label>
                <textarea
                  className="input-dark"
                  placeholder="Anything else you'd like us to know..."
                  value={form.additional_notes}
                  onChange={(e) => updateField("additional_notes", e.target.value)}
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {/* Step 8: Summary */}
          {step === 8 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                Ready to find your trials
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                We will search over 20 global clinical trial databases to find the best match for your condition. This takes about 30 seconds.
              </p>

              <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                  Search Query Preview
                </div>
                <div style={{ fontFamily: "Space Grotesk", fontWeight: 600, color: "var(--primary)" }}>
                  &quot;{searchQuery}&quot;
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem", color: "var(--foreground-muted)", marginBottom: "1.5rem" }}>
                <div>🏥 <strong>Condition:</strong> {form.primary_condition}</div>
                <div>📊 <strong>Stage:</strong> {form.condition_stage || "N/A"}</div>
                <div>🌍 <strong>Country:</strong> {form.country}</div>
                <div>🎂 <strong>Age:</strong> {form.age}</div>
                <div>⚧ <strong>Gender:</strong> {form.gender}</div>
                <div>⏱ <strong>Duration:</strong> {form.condition_duration || "N/A"}</div>
              </div>

              {error && (
                <p style={{ color: "var(--red-alert)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "1rem", fontSize: "1.05rem" }}
              >
                🔍 FIND MY TRIALS
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {step <= 7 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="btn-ghost"
                style={{ padding: "0.6rem 1.25rem", opacity: step === 1 ? 0.3 : 1 }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                disabled={!canProceed()}
                className="btn-primary"
                style={{ padding: "0.6rem 1.5rem", opacity: canProceed() ? 1 : 0.4 }}
              >
                {step === 7 ? "Review →" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
