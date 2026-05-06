"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AnomalyAlert {
  id: number
  patient_id: number
  biometric_type: string
  patient_value: number
  cohort_mean: number
  z_score: number
  alert_tier: string
  created_at: string
  resolved: boolean
}

interface Trial {
  id: number
  title: string
  disease: string
}

export default function CoordinatorAnomaliesPage() {
  const router = useRouter()
  const wsRef = useRef<WebSocket | null>(null)
  const [trials, setTrials] = useState<Trial[]>([])
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [liveMode, setLiveMode] = useState(true)

  // Load trials list on mount
  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")
    if (!token || role !== "coordinator") {
      router.push("/coordinator/login")
      return
    }
    fetch("/api/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setTrials(list)
        if (list.length > 0) setSelectedTrialId(list[0].id)
      })
      .catch(() => setError("Failed to load trials"))
  }, [router])

  // Load anomalies when trial changes
  useEffect(() => {
    if (!selectedTrialId) return
    const token = localStorage.getItem("trialgo_token")
    if (!token) return

    setLoading(true)
    fetch(`/api/coordinator/anomalies/${selectedTrialId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load anomalies"))
      .finally(() => setLoading(false))

    // WebSocket for live updates
    if (liveMode) {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const apiHost = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost:8000"
      wsRef.current?.close()
      wsRef.current = new WebSocket(`${wsProtocol}//${apiHost}/ws/dashboard/${selectedTrialId}`)
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.alerts && Array.isArray(data.alerts)) {
            // Merge live alerts with existing
            setAlerts((prev) => {
              const newIds = new Set(data.alerts.map((a: AnomalyAlert) => a.id))
              const merged = [...data.alerts, ...prev.filter((a) => !newIds.has(a.id))]
              return merged
            })
          }
        } catch {}
      }
    }
    return () => wsRef.current?.close()
  }, [selectedTrialId, liveMode])

  const resolveAlert = async (alertId: number) => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) return
    await fetch(`/api/monitoring/anomalies/${alertId}/resolve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)))
  }

  const tierClass = (tier: string) =>
    tier === "RED" ? "badge-red" : tier === "AMBER" ? "badge-amber" : "badge-green"

  const biometricIcon: Record<string, string> = {
    heart_rate: "❤️",
    glucose: "🩸",
    steps: "👣",
    temperature: "🌡️",
    blood_pressure_systolic: "📊",
    blood_pressure_diastolic: "📊",
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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "Space Grotesk", fontWeight: 700 }}>
          🧬 Trial<span className="text-cyan">Go</span>
          <span style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>/ Anomaly Feed</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/coordinator/cohort" className="btn-ghost" style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}>
            ← Cohort
          </Link>
          {liveMode && (
            <span className="badge-cyan" style={{ fontSize: "0.7rem" }}>● LIVE</span>
          )}
          <button
            onClick={() => { localStorage.clear(); router.push("/coordinator/login") }}
            style={{ color: "var(--foreground-subtle)", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "Space Grotesk", fontSize: "1.5rem", fontWeight: 700, flex: 1 }}>
            Live Anomaly Alert Feed
          </h1>
          <select
            value={selectedTrialId ?? ""}
            onChange={(e) => setSelectedTrialId(Number(e.target.value))}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
              borderRadius: "var(--radius)",
              padding: "0.6rem 0.875rem",
              outline: "none",
            }}
          >
            {trials.map((t) => (
              <option key={t.id} value={t.id}>#{t.id} {t.title}</option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} />
            Live Updates
          </label>
        </div>

        {error && (
          <div className="glass-card p-4 mb-4" style={{ color: "var(--foreground-error)" }}>⚠️ {error}</div>
        )}

        {loading ? (
          <div className="py-20 text-center" style={{ color: "var(--foreground-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading anomaly alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontFamily: "Space Grotesk", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              No Anomalies Detected
            </h2>
            <p style={{ color: "var(--foreground-muted)" }}>All patients are within normal biometric ranges for this trial.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="glass-card p-5"
                style={{
                  borderLeft: `3px solid ${alert.alert_tier === "RED" ? "var(--red-alert)" : alert.alert_tier === "AMBER" ? "var(--amber-alert)" : "var(--green-alert)"}`,
                  opacity: alert.resolved ? 0.5 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>
                      {biometricIcon[alert.biometric_type] || "📈"}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <strong style={{ fontFamily: "Space Grotesk" }}>
                          {alert.biometric_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </strong>
                        <span className={tierClass(alert.alert_tier)} style={{ fontSize: "0.7rem" }}>
                          {alert.alert_tier}
                        </span>
                        {alert.resolved && (
                          <span className="badge-green" style={{ fontSize: "0.7rem" }}>RESOLVED</span>
                        )}
                      </div>
                      <div style={{ color: "var(--foreground-muted)", fontSize: "0.85rem" }}>
                        Patient #{alert.patient_id} · Value: <strong>{alert.patient_value.toFixed(1)}</strong> · Mean: {alert.cohort_mean.toFixed(1)} · Z-score: <strong>{alert.z_score.toFixed(2)}</strong>
                      </div>
                      <div style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="btn-ghost"
                        style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                      >
                        ✓ Resolve
                      </button>
                    )}
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
