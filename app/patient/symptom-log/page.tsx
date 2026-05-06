"use client"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface SymptomLog {
  symptoms: Record<string, string>
}

function SymptomLogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trialId = searchParams.get("trial") || ""

  const [symptoms, setSymptoms] = useState<Record<string, string>>({
    fatigue: "0",
    pain: "0",
    nausea: "0",
    headache: "0",
    mood: "normal",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setSymptoms((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!trialId) {
      setError("No trial specified")
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("trialgo_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch("/api/patient/symptom-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trial_id: parseInt(trialId),
          symptoms_json: symptoms,
        }),
      })

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.status}`)
      }

      setSuccess("Symptom log recorded successfully!")
      setSymptoms({
        fatigue: "0",
        pain: "0",
        nausea: "0",
        headache: "0",
        mood: "normal",
        notes: "",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      console.error("Symptom log error:", err)
      setError(err.message || "Failed to record symptom log")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-bg min-h-screen">
      {/* Nav */}
      <nav
        style={{
          background: "rgba(5,20,36,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/dashboard"
          style={{ color: "var(--primary)", textDecoration: "none" }}
        >
          ← Back to Dashboard
        </Link>
        <button
          onClick={() => {
            localStorage.clear()
            router.push("/login")
          }}
          style={{
            color: "var(--foreground-muted)",
            fontSize: "0.85rem",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="glass p-8">
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            📝 Weekly Symptom Log
          </h1>
          <p style={{ color: "var(--foreground-muted)", marginBottom: "2rem" }}>
            Record your weekly symptoms and how you're feeling during the trial.
          </p>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--red-alert)",
                padding: "1rem",
                borderRadius: "var(--radius)",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                color: "var(--green-alert)",
                padding: "1rem",
                borderRadius: "var(--radius)",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "1.5rem" }}>
              {/* Fatigue */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  😴 Fatigue Level (0-10)
                </label>
                <input
                  type="range"
                  name="fatigue"
                  min="0"
                  max="10"
                  value={symptoms.fatigue}
                  onChange={handleChange}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span
                  style={{
                    color: "var(--foreground-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Current: {symptoms.fatigue}
                </span>
              </div>

              {/* Pain */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  🤕 Pain Level (0-10)
                </label>
                <input
                  type="range"
                  name="pain"
                  min="0"
                  max="10"
                  value={symptoms.pain}
                  onChange={handleChange}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span
                  style={{
                    color: "var(--foreground-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Current: {symptoms.pain}
                </span>
              </div>

              {/* Nausea */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  🤢 Nausea Level (0-10)
                </label>
                <input
                  type="range"
                  name="nausea"
                  min="0"
                  max="10"
                  value={symptoms.nausea}
                  onChange={handleChange}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span
                  style={{
                    color: "var(--foreground-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Current: {symptoms.nausea}
                </span>
              </div>

              {/* Headache */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  🤕 Headache Level (0-10)
                </label>
                <input
                  type="range"
                  name="headache"
                  min="0"
                  max="10"
                  value={symptoms.headache}
                  onChange={handleChange}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span
                  style={{
                    color: "var(--foreground-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Current: {symptoms.headache}
                </span>
              </div>

              {/* Mood */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  😊 Overall Mood
                </label>
                <select
                  name="mood"
                  value={symptoms.mood}
                  onChange={handleChange}
                  className="input-dark"
                  style={{ width: "100%" }}
                >
                  <option value="great">Great</option>
                  <option value="normal">Normal</option>
                  <option value="stressed">Stressed</option>
                  <option value="anxious">Anxious</option>
                  <option value="depressed">Depressed</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  📌 Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={symptoms.notes}
                  onChange={handleChange}
                  className="input-dark"
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    fontFamily: "inherit",
                  }}
                  placeholder="Any other symptoms or observations this week..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                marginTop: "2rem",
                padding: "0.8rem",
                fontSize: "1rem",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit Symptom Log →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SymptomLogPage() {
  return (
    <Suspense
      fallback={
        <div className="hero-bg flex min-h-screen items-center justify-center">
          <div
            style={{ color: "var(--foreground-muted)", textAlign: "center" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading symptom log...
          </div>
        </div>
      }
    >
      <SymptomLogContent />
    </Suspense>
  )
}
