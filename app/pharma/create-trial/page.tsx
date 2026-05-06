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
    <div className="hero-bg min-h-screen">
      <nav
        style={{
          background: "rgba(5,20,36,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Link
          href="/pharma/analytics"
          style={{ color: "var(--foreground-subtle)", fontSize: "0.85rem" }}
        >
          ← Analytics
        </Link>
        <span style={{ color: "var(--glass-border)" }}>|</span>
        <span style={{ fontFamily: "Space Grotesk", fontWeight: 700 }}>
          🧬 Trial<span className="text-cyan">Go</span>
        </span>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1
          style={{
            fontFamily: "Space Grotesk",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Create New Trial
        </h1>
        <p style={{ color: "var(--foreground-muted)", marginBottom: "2rem" }}>
          AI agents will automatically start recruiting matching candidates once
          the trial goes live.
        </p>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--foreground-muted)",
                }}
              >
                Trial Title *
              </label>
              <input
                className="input-dark"
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
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  Disease Area *
                </label>
                <select
                  className="input-dark"
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
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  Trial Stage
                </label>
                <select
                  className="input-dark"
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
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  Min Age
                </label>
                <input
                  className="input-dark"
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
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  Max Age
                </label>
                <input
                  className="input-dark"
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
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  Gender
                </label>
                <select
                  className="input-dark"
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
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--foreground-muted)",
                }}
              >
                Patients Needed *
              </label>
              <input
                className="input-dark"
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
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--foreground-muted)",
                }}
              >
                Inclusion Criteria
              </label>
              <textarea
                className="input-dark"
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
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--foreground-muted)",
                }}
              >
                Exclusion Criteria
              </label>
              <textarea
                className="input-dark"
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
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--foreground-muted)",
                }}
              >
                Description
              </label>
              <textarea
                className="input-dark"
                rows={3}
                placeholder="Brief description of the trial objectives..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
            </div>

            <div
              style={{
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "1rem",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 700,
                      marginBottom: "0.2rem",
                    }}
                  >
                    Consent Setup
                  </div>
                  <p
                    style={{
                      color: "var(--foreground-subtle)",
                      fontSize: "0.8rem",
                    }}
                  >
                    Upload a PDF or activate the built-in consent template as
                    part of the trial creation flow.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "999px",
                    border: "1px solid var(--glass-border)",
                    color: "var(--foreground-subtle)",
                  }}
                >
                  Required for recruiting
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    border: `1px solid ${consentMode === "built-in"
                        ? "var(--cyan-500)"
                        : "var(--glass-border)"
                      }`,
                    borderRadius: "var(--radius)",
                    padding: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="consent-mode"
                    checked={consentMode === "built-in"}
                    onChange={() => setConsentMode("built-in")}
                    style={{ marginTop: "0.15rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>
                      Use built-in template
                    </div>
                    <div
                      style={{
                        color: "var(--foreground-subtle)",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                      }}
                    >
                      Fastest path. TrialGo will activate the default consent
                      form immediately after the trial is created.
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    border: `1px solid ${consentMode === "upload"
                        ? "var(--cyan-500)"
                        : "var(--glass-border)"
                      }`,
                    borderRadius: "var(--radius)",
                    padding: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="consent-mode"
                    checked={consentMode === "upload"}
                    onChange={() => setConsentMode("upload")}
                    style={{ marginTop: "0.15rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>
                      Upload consent PDF
                    </div>
                    <div
                      style={{
                        color: "var(--foreground-subtle)",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                      }}
                    >
                      Use an approved PDF from your team and attach it to this
                      trial during launch.
                    </div>
                  </div>
                </label>
              </div>

              {consentMode === "upload" && (
                <div style={{ marginTop: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.4rem",
                      fontSize: "0.85rem",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    Consent PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setConsentFile(e.target.files?.[0] ?? null)}
                    style={{ width: "100%", color: "var(--foreground-muted)" }}
                  />
                  <p
                    style={{
                      color: "var(--foreground-subtle)",
                      fontSize: "0.8rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    The PDF will be summarized and stored when the trial is
                    launched.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p style={{ color: "var(--red-alert)", fontSize: "0.875rem" }}>
                {error}
              </p>
            )}
            <div
              className="glass"
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "var(--radius)",
                fontSize: "0.8rem",
                color: "var(--foreground-muted)",
              }}
            >
              🤖 Once created, AI Agents 1→12 will automatically begin
              recruiting and matching candidates.
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ justifyContent: "center" }}
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
