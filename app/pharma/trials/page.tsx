"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Trial {
  id: number
  title: string
  disease: string
  stage: string | null
  status: string
  patients_needed: number
  created_at: string
  description: string | null
}

export default function PharmaTrialsPage() {
  const router = useRouter()
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")
    if (!token || role !== "pharma") {
      router.push("/pharma/login")
      return
    }

    fetch("/api/pharma/trials", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setTrials(Array.isArray(data) ? data : [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [router])

  const statusColor: Record<string, string> = {
    active: "badge-green",
    paused: "badge-amber",
    completed: "badge-cyan",
    draft: "badge-red",
  }

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          background: "rgba(5,20,36,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border)",
          padding: "0.875rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
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
          <span style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
            / My Trials
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pharma/create-trial" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            + New Trial
          </Link>
          <button
            onClick={() => { localStorage.clear(); router.push("/pharma/login") }}
            style={{ color: "var(--foreground-subtle)", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "Space Grotesk", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            My Clinical Trials
          </h1>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.95rem" }}>
            Manage and monitor all your active trials. Click a trial to view matched candidates.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center" style={{ color: "var(--foreground-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading your trials...
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center" style={{ color: "var(--foreground-error)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            <div>{error}</div>
          </div>
        ) : trials.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏥</div>
            <h2 style={{ fontFamily: "Space Grotesk", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              No Trials Yet
            </h2>
            <p style={{ color: "var(--foreground-muted)", marginBottom: "1.5rem" }}>
              Create your first clinical trial and let 12 AI agents handle candidate discovery.
            </p>
            <Link href="/pharma/create-trial" className="btn-primary">
              Create First Trial →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {trials.map((trial) => (
              <div key={trial.id} className="glass-card p-6">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.1rem" }}>
                        {trial.title}
                      </span>
                      <span className={statusColor[trial.status] || "badge-cyan"} style={{ fontSize: "0.7rem" }}>
                        {trial.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", color: "var(--foreground-muted)", fontSize: "0.875rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                      <span>🦠 {trial.disease}{trial.stage ? ` • Stage ${trial.stage}` : ""}</span>
                      <span>👥 {trial.patients_needed} patients needed</span>
                      <span>📅 {new Date(trial.created_at).toLocaleDateString()}</span>
                    </div>
                    {trial.description && (
                      <p style={{ color: "var(--foreground-subtle)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                        {trial.description.slice(0, 200)}{trial.description.length > 200 ? "…" : ""}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "160px" }}>
                    <Link
                      href={`/pharma/candidates/${trial.id}`}
                      className="btn-primary"
                      style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", textAlign: "center" }}
                    >
                      View Candidates →
                    </Link>
                    <Link
                      href={`/consent?trial=${trial.id}`}
                      className="btn-ghost"
                      style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", textAlign: "center" }}
                    >
                      Manage Consent
                    </Link>
                    <Link
                      href={`/pharma/analytics?trial=${trial.id}`}
                      className="btn-ghost"
                      style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", textAlign: "center" }}
                    >
                      Analytics 📊
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
