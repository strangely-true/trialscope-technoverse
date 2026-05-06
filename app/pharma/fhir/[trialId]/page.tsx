"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useParams, usePathname } from "next/navigation"

interface TrialSummary {
  id: number
  title: string
  disease: string
  stage: string
  description?: string
  patients_needed?: number
}

interface AnalyticsSummary {
  enrolled: number
  patients_needed: number
  enrollment_rate_pct: number
  risk_distribution: Record<string, number>
  total_anomalies: number
}

interface CandidateRow {
  id: number
  candidate_id: number
  match_score: number
  match_tier: string
  status: string
  candidate?: {
    source?: string
    user_handle?: string
    extracted_symptoms?: any
    confidence_score?: number
  }
}

export default function PharmaFHIRPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const rawTrialId = useMemo(() => {
    const paramValue = Array.isArray(params?.trialId)
      ? params?.trialId?.[0]
      : params?.trialId
    if (paramValue) return paramValue
    if (!pathname) return undefined
    const parts = pathname.split("/").filter(Boolean)
    return parts[parts.length - 1]
  }, [params, pathname])
  const trialId = useMemo(() => {
    if (!rawTrialId) return null
    const value = Number(rawTrialId)
    return Number.isFinite(value) && value > 0 ? value : null
  }, [rawTrialId])
  const [trial, setTrial] = useState<TrialSummary | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [fhirBundle, setFhirBundle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/pharma/login")
      return
    }

    if (trialId === null) {
      setError("Invalid trial selected")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    Promise.all([
      fetch(`/api/trials/${trialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (!response.ok)
          throw new Error(`Trial fetch failed: ${response.status}`)
        return response.json()
      }),
      fetch(`/api/pharma/analytics/${trialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (!response.ok)
          throw new Error(`Analytics fetch failed: ${response.status}`)
        return response.json()
      }),
      fetch(`/api/pharma/candidates/${trialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (!response.ok)
          throw new Error(`Candidates fetch failed: ${response.status}`)
        return response.json()
      }),
      fetch(`/api/pharma/fhir-export/${trialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (!response.ok)
          throw new Error(`FHIR export failed: ${response.status}`)
        return response.json()
      }),
    ])
      .then(([trialData, analyticsData, candidateData, fhirData]) => {
        setTrial(trialData)
        setAnalytics(analyticsData)
        setCandidates(Array.isArray(candidateData) ? candidateData : [])
        setFhirBundle(fhirData)
      })
      .catch((err) => {
        console.error("FHIR export page error:", err)
        setError("Failed to load FHIR export data")
        setTrial(null)
        setAnalytics(null)
        setCandidates([])
      })
      .finally(() => setLoading(false))
  }, [router, trialId, rawTrialId])

  const downloadBundle = () => {
    const payload = fhirBundle || {
      trial,
      analytics,
      candidates,
      generated_at: new Date().toISOString(),
      note: "FHIR data was unavailable. This is a fallback snapshot.",
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `trial_${trialId}_fhir_bundle.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const bundlePreview = fhirBundle || {
    resourceType: "Bundle",
    type: "collection",
    trial_id: trialId,
    trial_title: trial?.title,
    enrolled: analytics?.enrolled ?? 0,
    status: "Generating FHIR data...",
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
            / FHIR Export
          </span>
        </Link>
        <Link
          href={`/pharma/candidates/${trialId}`}
          className="btn-ghost"
          style={{ padding: "0.5rem 1rem" }}
        >
          View Candidates
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "2rem",
                fontWeight: 700,
              }}
            >
              FHIR Bundle Export
            </h1>
            <p
              style={{ color: "var(--foreground-muted)", marginTop: "0.35rem" }}
            >
              {trial
                ? `${trial.title} · ${trial.disease}`
                : trialId
                  ? `Trial #${trialId}`
                  : "Trial"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadBundle}
              className="btn-primary"
              style={{ padding: "0.75rem 1rem" }}
              disabled={!trialId}
            >
              Download Snapshot JSON
            </button>
            {trialId ? (
              <Link
                href={`/consent?trial=${trialId}`}
                className="btn-ghost"
                style={{ padding: "0.75rem 1rem" }}
              >
                Upload Consent PDF
              </Link>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading export snapshot...
          </div>
        ) : error ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-error)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            {error}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6">
              <h2
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Export Summary
              </h2>
              <div className="grid gap-3 text-sm">
                <div>
                  <span className="text-[color:var(--foreground-subtle)]">
                    Trial:
                  </span>{" "}
                  {trial?.title || "N/A"}
                </div>
                <div>
                  <span className="text-[color:var(--foreground-subtle)]">
                    Stage:
                  </span>{" "}
                  {trial?.stage || "N/A"}
                </div>
                <div>
                  <span className="text-[color:var(--foreground-subtle)]">
                    Patients needed:
                  </span>{" "}
                  {analytics?.patients_needed ?? trial?.patients_needed ?? 0}
                </div>
                <div>
                  <span className="text-[color:var(--foreground-subtle)]">
                    Enrolled:
                  </span>{" "}
                  {analytics?.enrolled ?? 0}
                </div>
                <div>
                  <span className="text-[color:var(--foreground-subtle)]">
                    Enrollment rate:
                  </span>{" "}
                  {analytics?.enrollment_rate_pct ?? 0}%
                </div>
              </div>
              <p className="mt-4 text-sm text-[color:var(--foreground-muted)]">
                The backend creates and stores FHIR bundles during patient
                history submission. This page shows the live export snapshot
                that can be downloaded immediately.
              </p>
            </div>

            <div className="glass-card p-6">
              <h2
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Bundle Preview
              </h2>
              <pre
                style={{
                  maxHeight: "420px",
                  overflow: "auto",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius)",
                  padding: "1rem",
                  fontSize: "0.8rem",
                  color: "var(--foreground-muted)",
                }}
              >
                {JSON.stringify(bundlePreview, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
