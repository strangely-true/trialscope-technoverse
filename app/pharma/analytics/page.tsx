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

interface Analytics {
  enrolled: number
  patients_needed: number
  enrollment_rate_pct: number
  risk_distribution: Record<string, number>
  total_anomalies: number
}

export default function PharmaAnalyticsPage() {
  const router = useRouter()
  const [trials, setTrials] = useState<TrialSummary[]>([])
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loadingTrials, setLoadingTrials] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/pharma/login")
      return
    }

    setLoadingTrials(true)
    setError("")

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

        const queryTrial = Number(
          new URLSearchParams(window.location.search).get("trial")
        )
        const preferredTrial =
          trialList.find((trial) => trial.id === queryTrial)?.id ??
          trialList[0]?.id ??
          null
        setSelectedTrialId(preferredTrial)
        if (!preferredTrial) {
          setAnalytics(null)
        }
      })
      .catch((err) => {
        console.error("Trial list fetch error:", err)
        setError("Failed to load your trials")
        setTrials([])
        setSelectedTrialId(null)
        setAnalytics(null)
      })
      .finally(() => setLoadingTrials(false))
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token || !selectedTrialId) {
      return
    }

    setLoadingAnalytics(true)
    setError("")

    fetch(`/api/pharma/analytics/${selectedTrialId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Analytics fetch failed: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        setAnalytics(data)
      })
      .catch((err) => {
        console.error("Analytics fetch error:", err)
        setError("Failed to load analytics")
        setAnalytics(null)
      })
      .finally(() => setLoadingAnalytics(false))
  }, [selectedTrialId])

  const selectedTrial =
    trials.find((trial) => trial.id === selectedTrialId) ?? null
  const {
    enrolled = 0,
    patients_needed = 0,
    enrollment_rate_pct = 0,
    risk_distribution = {},
    total_anomalies = 0,
  } = analytics || {}
  const remaining = Math.max(0, patients_needed - enrolled)

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
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "Space Grotesk",
            fontWeight: 700,
          }}
        >
          🧬 Trial<span className="text-cyan">Go</span>
          <span
            style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem" }}
          >
            / Pharma
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pharma/create-trial"
            className="btn-primary"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            + New Trial
          </Link>
          <button
            onClick={() => {
              localStorage.clear()
              router.push("/pharma/login")
            }}
            style={{
              color: "var(--foreground-subtle)",
              fontSize: "0.85rem",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
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
              Analytics Dashboard
            </h1>
            <p
              style={{ color: "var(--foreground-muted)", marginTop: "0.25rem" }}
            >
              {selectedTrial ? (
                <>
                  Trial #{selectedTrial.id} — {selectedTrial.title} ·{" "}
                  {selectedTrial.disease}
                </>
              ) : (
                "Pick one of your active trials to review live enrollment and anomaly metrics"
              )}
            </p>
          </div>

          <div className="glass-card flex flex-col gap-2 p-4 md:min-w-70">
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Active Trial
            </span>
            <select
              value={selectedTrialId ?? ""}
              onChange={(e) =>
                setSelectedTrialId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
                borderRadius: "var(--radius)",
                padding: "0.75rem 0.875rem",
                width: "100%",
                outline: "none",
              }}
            >
              {trials.map((trial) => (
                <option key={trial.id} value={trial.id}>
                  #{trial.id} {trial.title}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between gap-3 text-xs text-(--foreground-subtle)">
              <span>
                {trials.length} active trial{trials.length === 1 ? "" : "s"}
              </span>
              <Link href="/pharma/create-trial" className="text-cyan">
                + New Trial
              </Link>
            </div>
            {selectedTrialId ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <Link
                  href={`/consent?trial=${selectedTrialId}`}
                  className="btn-primary"
                  style={{ padding: "0.55rem 0.75rem", fontSize: "0.8rem", textAlign: "center" }}
                >
                  Manage Consent
                </Link>
                <Link
                  href={`/pharma/candidates/${selectedTrialId}`}
                  className="btn-ghost"
                  style={{ padding: "0.55rem 0.75rem", fontSize: "0.8rem", textAlign: "center" }}
                >
                  Review Candidates
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {loadingTrials || loadingAnalytics ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading trial data...
          </div>
        ) : trials.length === 0 ? (
          <div
            className="glass-card py-20 text-center"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📭</div>
            <p>No pharma trials found for this account yet.</p>
            <Link
              href="/pharma/create-trial"
              className="btn-primary"
              style={{ marginTop: "1rem", display: "inline-block" }}
            >
              Create Your First Trial
            </Link>
          </div>
        ) : error ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-error)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            {error}
          </div>
        ) : !analytics ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
            No analytics data available
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  label: "Enrolled",
                  value: enrolled,
                  icon: "✅",
                  color: "var(--green-alert)",
                },
                {
                  label: "Target",
                  value: patients_needed,
                  icon: "🎯",
                  color: "var(--primary)",
                },
                {
                  label: "Remaining",
                  value: remaining,
                  icon: "⏳",
                  color: "var(--amber-alert)",
                },
                {
                  label: "Total Anomalies",
                  value: total_anomalies,
                  icon: "⚠️",
                  color: "var(--red-alert)",
                },
              ].map((metric) => (
                <div key={metric.label} className="glass-card p-5">
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--foreground-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {metric.icon} {metric.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: metric.color,
                    }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card mb-6 p-6">
              <h2
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Enrollment Progress
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "12px",
                    background: "var(--surface-highest)",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${enrollment_rate_pct}%`,
                      background: "var(--gradient-primary)",
                      transition: "width 0.8s ease",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--primary)",
                    minWidth: "50px",
                  }}
                >
                  {enrollment_rate_pct}%
                </span>
              </div>
              <p
                style={{
                  color: "var(--foreground-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                {enrolled} of {patients_needed} patients enrolled
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass-card p-6">
                <h2
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    marginBottom: "1.25rem",
                  }}
                >
                  Dropout Risk Distribution
                </h2>
                {Object.keys(risk_distribution).length === 0 ? (
                  <div
                    style={{
                      color: "var(--foreground-muted)",
                      fontSize: "0.9rem",
                    }}
                  >
                    No dropout scores yet for this trial.
                  </div>
                ) : (
                  Object.entries(risk_distribution).map(([tier, count]) => {
                    const colors = {
                      RED: "var(--red-alert)",
                      AMBER: "var(--amber-alert)",
                      GREEN: "var(--green-alert)",
                    }
                    const pct = Math.round(
                      (count / Math.max(enrolled, 1)) * 100
                    )
                    return (
                      <div key={tier} style={{ marginBottom: "1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.35rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: colors[tier as keyof typeof colors],
                            }}
                          >
                            {tier}
                          </span>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--foreground-muted)",
                            }}
                          >
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: "8px",
                            background: "var(--surface-highest)",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: colors[tier as keyof typeof colors],
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="glass-card p-6">
                <h2
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    marginBottom: "1.25rem",
                  }}
                >
                  Quick Actions
                </h2>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      icon: "➕",
                      label: "Create New Trial",
                      href: "/pharma/create-trial",
                    },
                    {
                      icon: "👥",
                      label: "View Candidates",
                      href: `/pharma/candidates/${selectedTrialId ?? ""}`,
                    },
                    {
                      icon: "🌍",
                      label: "Global Discovery",
                      href: `/pharma/discovery/${selectedTrialId ?? ""}`,
                    },
                    {
                      icon: "📄",
                      label: "Upload Consent PDF",
                      href: `/consent?trial=${selectedTrialId ?? ""}`,
                    },
                    {
                      icon: "📊",
                      label: "Export FHIR Bundle",
                      href: `/pharma/fhir/${selectedTrialId ?? ""}`,
                    },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius)",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--glass-border)",
                        fontSize: "0.875rem",
                        color: "var(--foreground)",
                        textDecoration: "none",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        ; (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--primary)"
                          ; (e.currentTarget as HTMLElement).style.color =
                            "var(--primary)"
                      }}
                      onMouseLeave={(e) => {
                        ; (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--glass-border)"
                          ; (e.currentTarget as HTMLElement).style.color =
                            "var(--foreground)"
                      }}
                    >
                      <span>{action.icon}</span> {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
