"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const DISEASES = [
  "Blood Cancer",
  "Diabetes",
  "Alzheimer's",
  "Parkinson's",
  "Multiple Sclerosis",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Rheumatoid Arthritis",
  "Lupus",
  "HIV",
  "COVID-19",
  "Other",
]

export default function CreateTrialPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    disease: "",
    stage: "",
    age_min: 18,
    age_max: 80,
    gender: "any",
    location_preference: "",
    exclusion_criteria: "",
    inclusion_criteria: "",
    patients_needed: 50,
    description: "",
  })
  const [consentMode, setConsentMode] = useState<"built-in" | "upload">(
    "built-in"
  )
  const [consentFile, setConsentFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")
    if (!token || role !== "pharma") {
      router.push("/login")
      return
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("trialgo_token")
      if (consentMode === "upload" && !consentFile) {
        throw new Error("Please choose a consent PDF or switch to the built-in template")
      }

      const res = await fetch("/api/trials/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to create trial")

      const trial = await res.json()
      const trialId = trial?.id
      if (!trialId) {
        throw new Error("Trial created, but the server did not return an id")
      }

      const consentFormData = new FormData()
      if (consentMode === "upload" && consentFile) {
        consentFormData.append("file", consentFile)
      } else {
        consentFormData.append("use_default_template", "true")
      }

      const consentResponse = await fetch(
        `/api/consent/upload?trial_id=${trialId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: consentFormData,
        }
      )

      if (!consentResponse.ok) {
        throw new Error("Trial created, but consent setup failed")
      }

      router.push(`/pharma/analytics?trial=${trialId}&created=1`)
    } catch {
      setError(
        "Could not complete trial creation and consent setup. Ensure the backend is running."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
        <Link
          href="/pharma/analytics"
          className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← Analytics
        </Link>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          Trial<span className="text-blue-600 dark:text-blue-400">Go</span>
        </span>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
          Create New Trial
        </h1>
        <p className="mb-8 text-slate-500 dark:text-slate-400">
          AI agents will automatically start recruiting matching candidates once
          the trial goes live.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Trial Title *
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Phase III Blood Cancer Immunotherapy Study"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Disease Area *
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                  value={form.disease}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, disease: e.target.value }))
                  }
                >
                  <option value="">Select disease...</option>
                  {DISEASES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Trial Stage
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={form.stage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stage: e.target.value }))
                  }
                >
                  {["", "I", "II", "III", "IV"].map((s) => (
                    <option key={s} value={s}>
                      {s || "Not applicable"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Min Age
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  type="number"
                  min={0}
                  max={120}
                  value={form.age_min}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, age_min: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Max Age
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  type="number"
                  min={0}
                  max={120}
                  value={form.age_max}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, age_max: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={form.gender}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gender: e.target.value }))
                  }
                >
                  {["any", "male", "female"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Patients Needed *
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                type="number"
                min={1}
                required
                value={form.patients_needed}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    patients_needed: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Inclusion Criteria
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                rows={3}
                placeholder="e.g. Diagnosed with Stage II-III blood cancer, ECOG performance status 0-2..."
                value={form.inclusion_criteria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, inclusion_criteria: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Exclusion Criteria
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                rows={2}
                placeholder="e.g. Prior CAR-T therapy, active autoimmune disease..."
                value={form.exclusion_criteria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, exclusion_criteria: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                rows={3}
                placeholder="Brief description of the trial objectives..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-1 font-bold text-slate-900 dark:text-white">
                    Consent Setup
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload a PDF or activate the built-in consent template as
                    part of the trial creation flow.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  Required for recruiting
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    consentMode === "built-in"
                      ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="consent-mode"
                    checked={consentMode === "built-in"}
                    onChange={() => setConsentMode("built-in")}
                    style={{ marginTop: "0.15rem" }}
                  />
                  <div>
                    <div className="mb-1 font-bold text-slate-900 dark:text-white">
                      Use built-in template
                    </div>
                    <div className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      Fastest path. TrialGo will activate the default consent
                      form immediately after the trial is created.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    consentMode === "upload"
                      ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="consent-mode"
                    checked={consentMode === "upload"}
                    onChange={() => setConsentMode("upload")}
                    style={{ marginTop: "0.15rem" }}
                  />
                  <div>
                    <div className="mb-1 font-bold text-slate-900 dark:text-white">
                      Upload consent PDF
                    </div>
                    <div className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      Use an approved PDF from your team and attach it to this
                      trial during launch.
                    </div>
                  </div>
                </label>
              </div>

              {consentMode === "upload" && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Consent PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setConsentFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-300"
                  />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    The PDF will be summarized and stored when the trial is
                    launched.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              🤖 Once created, AI Agents 1→12 will automatically begin
              recruiting and matching candidates.
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading
                ? "Launching Trial..."
                : "🚀 Launch Trial & Start Recruitment →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
