"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TrialSummary {
  id: number
  title: string
  disease: string
  stage: string
}

export default function ConsentPage() {
  const router = useRouter()
  const [trials, setTrials] = useState<TrialSummary[]>([])
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loadingTrials, setLoadingTrials] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/pharma/login")
      return
    }

    setLoadingTrials(true)
    fetch("/api/pharma/trials", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Trials fetch failed: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        const trialList = Array.isArray(data) ? data : []
        setTrials(trialList)
        const trialParam = Number(
          new URLSearchParams(window.location.search).get("trial")
        )
        const preferredTrial =
          trialList.find((trial) => trial.id === trialParam)?.id ??
          trialList[0]?.id ??
          null
        setSelectedTrialId(preferredTrial)
      })
      .catch((err) => {
        console.error("Consent page trial load error:", err)
        setError("Failed to load your trials")
        setTrials([])
      })
      .finally(() => setLoadingTrials(false))
  }, [router])

  const submitConsent = async (useBuiltInTemplate = false) => {
    const token = localStorage.getItem("trialgo_token")
    if (!token || !selectedTrialId || (!file && !useBuiltInTemplate)) {
      setError("Choose a trial and PDF, or use the built-in template")
      return
    }

    setUploading(true)
    setMessage("")
    setError("")
    try {
      const formData = new FormData()
      if (file) {
        formData.append("file", file)
      } else {
        formData.append("use_default_template", "true")
      }

      const response = await fetch(
        `/api/consent/upload?trial_id=${selectedTrialId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const data = await response.json()
      setMessage(
        data.simplified_summary ||
        (useBuiltInTemplate
          ? "Built-in consent template activated successfully"
          : "Consent PDF uploaded successfully")
      )
      setFile(null)
    } catch (err) {
      console.error("Consent upload error:", err)
      setError("Could not upload the consent PDF")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
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
          href="/pharma/analytics"
          style={{ fontFamily: "Space Grotesk", fontWeight: 700 }}
        >
          🧬 Trial<span className="text-cyan">Go</span>{" "}
          <span
            style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem" }}
          >
            / Consent
          </span>
        </Link>
        <Link
          href="/pharma/analytics"
          className="btn-ghost"
          style={{ padding: "0.5rem 1rem" }}
        >
          Back to Analytics
        </Link>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            Upload Consent PDF
          </h1>
          <p style={{ color: "var(--foreground-muted)", marginTop: "0.35rem" }}>
            Send a trial consent document to Agent 6 for summarisation and S3
            storage.
          </p>
        </div>

        <div className="glass-card p-6">
          {loadingTrials ? (
            <div
              className="py-14 text-center"
              style={{ color: "var(--foreground-muted)" }}
            >
              Loading your trials...
            </div>
          ) : trials.length === 0 ? (
            <div
              className="py-14 text-center"
              style={{ color: "var(--foreground-muted)" }}
            >
              No trials available. Create a trial first, then come back here.
            </div>
          ) : (
            <div className="grid gap-5">
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Trial
                </label>
                <select
                  value={selectedTrialId ?? ""}
                  onChange={(e) =>
                    setSelectedTrialId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--foreground)",
                    borderRadius: "var(--radius)",
                    padding: "0.9rem 1rem",
                  }}
                >
                  {trials.map((trial) => (
                    <option key={trial.id} value={trial.id}>
                      #{trial.id} {trial.title} · {trial.disease}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Consent PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={{ width: "100%", color: "var(--foreground-muted)" }}
                />
                <p style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                  Leave this empty to activate the built-in consent template instead.
                </p>
              </div>

              {message ? (
                <div
                  className="rounded-xl bg-[rgba(45,212,191,0.08)] p-4 text-sm"
                  style={{ border: "1px solid var(--green-alert)", color: "var(--green-alert)" }}
                >
                  {message}
                </div>
              ) : null}
              {error ? (
                <div
                  className="rounded-xl bg-[rgba(248,113,113,0.08)] p-4 text-sm"
                  style={{ border: "1px solid var(--red-alert)", color: "var(--red-alert)" }}
                >
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => submitConsent()}
                  disabled={uploading}
                  className="btn-primary"
                  style={{ padding: "0.9rem 1.2rem" }}
                >
                  {uploading ? "Uploading..." : "Upload and Summarize"}
                </button>
                <button
                  onClick={() => submitConsent(true)}
                  disabled={uploading}
                  className="btn-ghost"
                  style={{ padding: "0.9rem 1.2rem" }}
                >
                  Use Built-in Template
                </button>
                <Link
                  href="/pharma/analytics"
                  className="btn-ghost"
                  style={{ padding: "0.9rem 1.2rem" }}
                >
                  Cancel
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
