"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl dark:border-slate-800 dark:bg-slate-800/50">
          <div className="mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl shadow-lg shadow-blue-500/20">
            🌍
          </div>
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
            Searching Global Databases
          </h2>
          <div className="flex flex-col gap-3 text-left">
            {SEARCHING_MESSAGES.slice(0, searchMsgIndex + 1).map((msg, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  i === searchMsgIndex ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-400"
                }`}
              >
                <span>{i < searchMsgIndex ? "✅" : "🔄"}</span>
                {msg}
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
            This usually takes about 30 seconds...
          </p>
        </div>
      </div>
    )
  }

  // ─── STEP RENDER ──────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Image src="/trialgo.png" alt="TrialGo" width={28} height={28} className="h-7 w-7" />
          Trial<span className="text-blue-600 dark:text-blue-400">Go</span>
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Patient Onboarding
        </span>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Step {Math.min(step, 7)} of 7</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-800/50">
          {/* Step 1: Condition */}
          {step === 1 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                What is your primary health condition?
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Tell us the disease or condition you are seeking a clinical trial for.
              </p>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                placeholder="e.g. Blood Cancer, Diabetes, Lung Cancer..."
                value={form.primary_condition}
                onChange={(e) => handleConditionInput(e.target.value)}
                autoFocus
              />
              {filteredConditions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filteredConditions.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => { updateField("primary_condition", c); setFilteredConditions([]) }}
                      className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
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
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                What stage or severity is your condition?
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                This helps us find trials targeting your specific stage.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateField("condition_stage", s)}
                    className={`rounded-xl border p-4 text-sm font-semibold transition-all duration-200 ${
                      form.condition_stage === s
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
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
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                How long have you had this condition?
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Duration helps match you with the right trial phase.
              </p>
              <div className="flex flex-col gap-3">
                {DURATIONS.map((d) => (
                   <button
                    key={d}
                    onClick={() => updateField("condition_duration", d)}
                    className={`rounded-xl border p-4 text-left text-sm font-semibold transition-all duration-200 ${
                      form.condition_duration === d
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
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
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                What treatments have you already tried?
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                This helps exclude trials you may not be eligible for.
              </p>
              <textarea
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                placeholder="e.g. chemotherapy, radiation, medication name, or type None"
                value={form.prior_treatments}
                onChange={(e) => updateField("prior_treatments", e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Step 5: Current medications */}
          {step === 5 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                Are you currently taking any medications?
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Some trials may require specific medication history.
              </p>
              <textarea
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                placeholder="e.g. metformin, ibuprofen, or type None"
                value={form.current_medications}
                onChange={(e) => updateField("current_medications", e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Step 6: Country */}
          {step === 6 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                Where are you located?
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                We&apos;ll prioritise trials near your location.
              </p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
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
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                Tell us a bit about yourself
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Almost done! This helps refine your matches.
              </p>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Age</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                    type="number"
                    placeholder="e.g. 34"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    min={1}
                    max={120}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Gender</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                    value={form.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Additional Notes (optional)</label>
                <textarea
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
                  placeholder="Anything else you'd like us to know..."
                  value={form.additional_notes}
                  onChange={(e) => updateField("additional_notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 8: Summary */}
          {step === 8 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                Ready to find your trials
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                We will search over 20 global clinical trial databases to find the best match for your condition. This takes about 30 seconds.
              </p>

              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                  Search Query Preview
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  &quot;{searchQuery}&quot;
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-600 dark:border-slate-700/50 dark:bg-slate-900/30 dark:text-slate-400">
                <div><span className="mr-2">🏥</span><strong className="text-slate-900 dark:text-white">Condition:</strong> {form.primary_condition}</div>
                <div><span className="mr-2">📊</span><strong className="text-slate-900 dark:text-white">Stage:</strong> {form.condition_stage || "N/A"}</div>
                <div><span className="mr-2">🌍</span><strong className="text-slate-900 dark:text-white">Country:</strong> {form.country}</div>
                <div><span className="mr-2">🎂</span><strong className="text-slate-900 dark:text-white">Age:</strong> {form.age}</div>
                <div><span className="mr-2">⚧</span><strong className="text-slate-900 dark:text-white">Gender:</strong> {form.gender}</div>
                <div><span className="mr-2">⏱</span><strong className="text-slate-900 dark:text-white">Duration:</strong> {form.condition_duration || "N/A"}</div>
              </div>

              {error && (
                <p className="mb-4 text-sm font-medium text-red-500">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                🔍 FIND MY TRIALS
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {step <= 7 && (
            <div className="mt-10 flex justify-between">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className={`rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-semibold transition-all ${
                  step === 1
                    ? "cursor-not-allowed opacity-30 text-slate-400"
                    : "text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                disabled={!canProceed()}
                className={`rounded-lg px-8 py-2.5 text-sm font-bold text-white transition-all ${
                  canProceed()
                    ? "bg-blue-600 shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg active:scale-95"
                    : "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
                }`}
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
