"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Trial { id: number; title: string; disease: string; stage: string }
interface Patient {
  id: number; hash_id: string; match_score: number; status: string
  enrolled_at: string; risk_tier: string; dropout_score: number | null; active_alerts: number
}
interface Alert {
  id: number; patient_id: number; biometric_type: string; patient_value: number
  cohort_mean: number; z_score: number; alert_tier: string; created_at: string; resolved: boolean
}
interface Stats {
  total_enrolled: number; avg_match_score: number
  risk_distribution: Record<string, number>
}
interface PatientProfile {
  patient: { id: number; hash_id: string; trial_id: number; match_score: number; status: string; enrolled_at: string; consent_subject_id?: string; phone_number: string | null; full_name: string | null; email: string | null }
  consent?: { id?: number | null; signed_at?: string | null; signed_pdf_url?: string | null; template_name?: string | null; template_version?: number | null }
  dropout_scores: { score: number; risk_tier: string; scored_at: string }[]
  anomaly_alerts: { biometric: string; value: number; z_score: number; tier: string; resolved: boolean; created_at: string }[]
  symptom_logs: { symptoms: any; severity: string; logged_at: string }[]
  wearable_data: { heart_rate: number; glucose: number; steps: number; temperature: number; recorded_at: string }[]
}

const tierColor: Record<string, string> = { RED: "#ef4444", AMBER: "#f59e0b", GREEN: "#22c55e" }
const tierBg: Record<string, string> = { RED: "rgba(239,68,68,0.12)", AMBER: "rgba(245,158,11,0.12)", GREEN: "rgba(34,197,94,0.12)" }

export default function CoordinatorCohortPage() {
  const router = useRouter()
  const wsRef = useRef<WebSocket | null>(null)
  const [tab, setTab] = useState<"overview" | "anomalies" | "patients">("overview")
  const [trials, setTrials] = useState<Trial[]>([])
  const [selTrial, setSelTrial] = useState<number | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showCallConfirm, setShowCallConfirm] = useState<number | null>(null)
  const [callLogs, setCallLogs] = useState<any[]>([])

  const [userMe, setUserMe] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ full_name: "", phone_number: "", preferred_language: "" })
  const [otpStep, setOtpStep] = useState(false)
  const [otpVal, setOtpVal] = useState("")

  const downloadConsentPdf = async (subjectId?: string, trialId?: number) => {
    if (!subjectId || !trialId) return
    const token = localStorage.getItem("trialgo_token")
    if (!token) return

    const response = await fetch(`/api/consent/download/${trialId}/${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      throw new Error(`Consent download failed: ${response.status}`)
    }

    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = `consent-${subjectId}.pdf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("trialgo_token") : null
  const headers = { Authorization: `Bearer ${token}` }
  const headersJson = { ...headers, "Content-Type": "application/json" }

  // Load user
  useEffect(() => {
    if (!token) return
    fetch("/api/auth/me", { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setUserMe(d)
          setSettingsForm({ full_name: d.full_name || "", phone_number: d.phone_number || "", preferred_language: d.preferred_language || "en" })
        }
      })
  }, [token])

  // Load trials
  useEffect(() => {
    if (!token) { router.push("/coordinator/login"); return }
    fetch("/api/trials", { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setTrials(list)
        if (list.length > 0) {
          // Pick trial with most data or first
          const qTrial = Number(new URLSearchParams(window.location.search).get("trial"))
          setSelTrial(list.find((t: Trial) => t.id === qTrial)?.id ?? list[0]?.id)
        }
      })
      .catch(() => setTrials([]))
      .finally(() => setLoading(false))
  }, [])

  // Load cohort data when trial changes
  useEffect(() => {
    if (!token || !selTrial) return
    setLoading(true)

    Promise.all([
      fetch(`/api/monitoring/cohort/${selTrial}`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`/api/coordinator/anomalies/${selTrial}`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`/api/coordinator/cohort/${selTrial}`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([s, a, p]) => {
        setStats(s)
        setAlerts(Array.isArray(a) ? a : [])
        setPatients(Array.isArray(p) ? p : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // WebSocket for live alerts
    wsRef.current?.close()
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost:8000"
    wsRef.current = new WebSocket(`${proto}//${host}/ws/dashboard/${selTrial}`)
    wsRef.current.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.alerts) setAlerts(prev => {
          const ids = new Set(prev.map(a => a.id))
          const fresh = d.alerts.filter((a: Alert) => !ids.has(a.id))
          return fresh.length ? [...fresh, ...prev].slice(0, 50) : prev
        })
      } catch { }
    }
    return () => wsRef.current?.close()
  }, [selTrial])

  const loadCallLogs = (pid: number) => {
    fetch(`/api/monitoring/call/logs/${pid}`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setCallLogs)
  }

  const openProfile = (pid: number) => {
    fetch(`/api/coordinator/patient/${pid}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setProfile(d); setShowProfile(true); loadCallLogs(pid); } })
  }

  const initiateCall = (pid: number) => {
    fetch(`/api/monitoring/call/patient/${pid}`, { method: "POST", headers })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.detail || "Call failed")
        alert("Calling your number now. Pick up to speak to the patient.")
        setShowCallConfirm(null)
        loadCallLogs(pid)
      })
      .catch(e => alert(e.message))
  }

  const resolveAlert = (aid: number) => {
    fetch(`/api/monitoring/anomalies/${aid}/resolve`, { method: "POST", headers })
      .then(r => { if (r.ok) setAlerts(prev => prev.map(a => a.id === aid ? { ...a, resolved: true } : a)) })
  }

  const intervene = (pid: number) => {
    fetch(`/api/coordinator/intervene/${pid}`, { method: "POST", headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) alert(`Intervention logged for patient #${pid}`) })
  }

  const trial = trials.find(t => t.id === selTrial)
  const unresolvedAlerts = alerts.filter(a => !a.resolved)
  const redCount = stats?.risk_distribution?.RED ?? 0
  const amberCount = stats?.risk_distribution?.AMBER ?? 0

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: headersJson,
        body: JSON.stringify(settingsForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Update failed")
      
      if (!data.phone_verified && data.phone_number) {
        setOtpStep(true)
        alert("A verification code was sent to your new phone number.")
      } else {
        alert("Profile updated!")
        setUserMe(data)
        setShowSettings(false)
      }
    } catch(err: any) { alert(err.message) }
  }

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: headersJson,
        body: JSON.stringify({ user_id: userMe.id, otp: otpVal })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Invalid OTP")
      alert("Phone verified successfully!")
      setOtpStep(false)
      setShowSettings(false)
      fetch("/api/auth/me", { headers }).then(r=>r.json()).then(d=>setUserMe(d))
    } catch(err: any) { alert(err.message) }
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #030b15 0%, #0a1628 50%, #071220 100%)", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Top Nav */}
      <nav style={{ background: "rgba(5,15,30,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "Space Grotesk", fontWeight: 700, textDecoration: "none", color: "#e2e8f0" }}>
          🧬 Trial<span style={{ color: "#00f2ff" }}>Go</span>
          <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: "0.5rem" }}>/ Coordinator</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ background: "rgba(0,242,255,0.15)", color: "#00f2ff", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600 }}>● LIVE</span>
          <button onClick={() => setShowSettings(true)} style={{ background: "transparent", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "0.8rem", cursor: "pointer" }}>⚙️ Edit Profile</button>
          <button onClick={() => { localStorage.clear(); router.push("/coordinator/login") }} style={{ color: "#64748b", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      <div style={{ display: "flex", minHeight: "calc(100vh - 52px)" }}>
        {/* Sidebar */}
        <aside style={{ width: "200px", background: "rgba(5,15,30,0.6)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem 0.75rem", flexShrink: 0 }}>
          {([["overview", "📊", "Overview"], ["patients", "👥", "Patients"], ["anomalies", "🚨", "Anomalies"]] as [string, string, string][]).map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key as any)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: tab === key ? 600 : 400, color: tab === key ? "#00f2ff" : "#94a3b8", background: tab === key ? "rgba(0,242,255,0.08)" : "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", marginBottom: "0.25rem" }}>
              {icon} {label}
            </button>
          ))}
          {/* Trial Selector */}
          <div style={{ marginTop: "1.5rem", padding: "0 0.5rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Active Trial</div>
            <select value={selTrial ?? ""} onChange={e => setSelTrial(Number(e.target.value))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", borderRadius: "6px", padding: "0.5rem", fontSize: "0.8rem", outline: "none" }}>
              {trials.map(t => <option key={t.id} value={t.id}>#{t.id} {t.title.slice(0, 18)}</option>)}
            </select>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.4rem" }}>{trials.length} trial{trials.length !== 1 ? "s" : ""}</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "1.5rem 2rem", overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "spin 1s linear infinite" }}>⟳</div>
              Loading cohort data...
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontFamily: "Space Grotesk", fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  {tab === "overview" ? "Cohort Overview" : tab === "patients" ? "Patient Registry" : "Anomaly Monitor"}
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  {trial ? `Trial #${trial.id} — ${trial.title} · ${trial.disease}` : "Select a trial"}
                </p>
              </div>

              {/* KPI Cards - always visible */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Enrolled", val: stats?.total_enrolled ?? 0, icon: "👥", color: "#00f2ff" },
                  { label: "Red Risk", val: redCount, icon: "🔴", color: "#ef4444" },
                  { label: "Anomalies", val: unresolvedAlerts.length, icon: "⚠️", color: "#f59e0b" },
                  { label: "Avg Match", val: `${Math.round((stats?.avg_match_score ?? 0) * 100)}%`, icon: "🎯", color: "#22c55e" },
                ].map(c => (
                  <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span>{c.icon}</span>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
                    </div>
                    <div style={{ fontFamily: "Space Grotesk", fontSize: "1.6rem", fontWeight: 700, color: c.color }}>{c.val}</div>
                  </div>
                ))}
              </div>

              {/* TAB: Overview */}
              {tab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                  {/* Risk Distribution */}
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1.25rem" }}>
                    <h3 style={{ fontFamily: "Space Grotesk", fontWeight: 600, marginBottom: "1rem", fontSize: "0.95rem" }}>Risk Distribution</h3>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", height: "120px" }}>
                      {(["RED", "AMBER", "GREEN"] as const).map(tier => {
                        const count = stats?.risk_distribution?.[tier] ?? 0
                        const max = Math.max(redCount, amberCount, stats?.risk_distribution?.GREEN ?? 0, 1)
                        return (
                          <div key={tier} style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ background: tierColor[tier], borderRadius: "6px 6px 0 0", height: `${Math.max((count / max) * 80, 4)}px`, transition: "height 0.5s", opacity: 0.85 }} />
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.5rem", color: tierColor[tier] }}>{count}</div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{tier}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* Recent Anomalies */}
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1.25rem" }}>
                    <h3 style={{ fontFamily: "Space Grotesk", fontWeight: 600, marginBottom: "1rem", fontSize: "0.95rem" }}>Recent Alerts</h3>
                    {unresolvedAlerts.length === 0 ? (
                      <div style={{ color: "#64748b", fontSize: "0.85rem" }}>✅ No active anomalies</div>
                    ) : unresolvedAlerts.slice(0, 4).map(a => (
                      <div key={a.id} style={{ padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{a.biometric_type}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Patient #{a.patient_id} · z={a.z_score.toFixed(1)}</div>
                        </div>
                        <span style={{ color: tierColor[a.alert_tier], background: tierBg[a.alert_tier], padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600 }}>{a.alert_tier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: Patients */}
              {tab === "patients" && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                  {patients.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>No enrolled patients for this trial yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                          {["Patient Hash", "Risk", "Match", "Alerts", "Status", "Enrolled", "Actions"].map(h => (
                            <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map(p => (
                          <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: p.risk_tier === "RED" ? "rgba(239,68,68,0.04)" : "transparent" }}>
                            <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.8rem" }}>{p.hash_id.slice(0, 10)}...</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span style={{ color: tierColor[p.risk_tier] || "#22c55e", background: tierBg[p.risk_tier] || tierBg.GREEN, padding: "0.15rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>{p.risk_tier}</span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}>{p.match_score ? `${Math.round(p.match_score * 100)}%` : "—"}</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              {p.active_alerts > 0 ? <span style={{ color: "#ef4444", fontWeight: 600 }}>{p.active_alerts}</span> : <span style={{ color: "#64748b" }}>0</span>}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#94a3b8" }}>{p.status}</td>
                            <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>{new Date(p.enrolled_at).toLocaleDateString()}</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => openProfile(p.id)} style={{ color: "#00f2ff", background: "rgba(0,242,255,0.08)", border: "1px solid rgba(0,242,255,0.2)", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}>Profile</button>
                                {p.risk_tier === "RED" && <button onClick={() => intervene(p.id)} style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}>Intervene</button>}
                                <button onClick={() => setShowCallConfirm(p.id)} style={{ color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}>Call Patient</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB: Anomalies */}
              {tab === "anomalies" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {alerts.length === 0 ? (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#64748b" }}>No anomaly alerts for this trial.</div>
                  ) : alerts.map(a => (
                    <div key={a.id} style={{ background: a.resolved ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)", border: `1px solid ${a.resolved ? "rgba(255,255,255,0.04)" : tierColor[a.alert_tier] + "33"}`, borderRadius: "10px", padding: "1rem 1.25rem", opacity: a.resolved ? 0.5 : 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.biometric_type}</span>
                          <span style={{ color: tierColor[a.alert_tier], background: tierBg[a.alert_tier], padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600 }}>{a.alert_tier}</span>
                          {a.resolved && <span style={{ color: "#22c55e", fontSize: "0.7rem" }}>✓ Resolved</span>}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                          Patient #{a.patient_id} · Value: {a.patient_value?.toFixed(1)} · Mean: {a.cohort_mean?.toFixed(1)} · Z-score: {a.z_score?.toFixed(2)} · {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!a.resolved && (
                        <button onClick={() => resolveAlert(a.id)} style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                          Resolve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Patient Profile Modal */}
      {showProfile && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowProfile(false)}>
          <div style={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "2rem", width: "700px", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.2rem" }}>Patient Profile</h2>
              <button onClick={() => setShowProfile(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            {/* Patient Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {/* Contact Info Card - prominently at top */}
              <div style={{ gridColumn: "span 2", background: "rgba(0,242,255,0.06)", border: "1px solid rgba(0,242,255,0.15)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#00f2ff", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>Patient Contact Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.2rem" }}>Full Name</div>
                    <div style={{ fontWeight: 600 }}>{profile.patient.full_name ?? "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.2rem" }}>📞 Phone</div>
                    <div style={{ fontWeight: 600, color: profile.patient.phone_number ? "#22c55e" : "#64748b" }}>
                      {profile.patient.phone_number ?? "Not provided"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "0.2rem" }}>✉️ Email</div>
                    <div style={{ fontWeight: 600 }}>{profile.patient.email ?? "—"}</div>
                  </div>
                </div>
              </div>
              {[
                ["Hash ID", profile.patient.hash_id.slice(0, 16) + "..."],
                ["Status", profile.patient.status],
                ["Match Score", profile.patient.match_score ? `${Math.round(profile.patient.match_score * 100)}%` : "N/A"],
                ["Enrolled", new Date(profile.patient.enrolled_at).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k as string} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>{k}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {/* Anomaly History */}
            <h3 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Anomaly History ({profile.anomaly_alerts.length})</h3>
            {profile.anomaly_alerts.length === 0 ? <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>No anomalies recorded</p> : (
              <div style={{ marginBottom: "1.5rem" }}>
                {profile.anomaly_alerts.slice(0, 8).map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
                    <span>{a.biometric} (z={a.z_score.toFixed(1)})</span>
                    <span style={{ color: tierColor[a.tier] }}>{a.tier} {a.resolved ? "✓" : ""}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Wearable Data */}
            {profile.consent?.signed_at && profile.patient.consent_subject_id ? (
              <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "10px", background: "rgba(0,242,255,0.06)", border: "1px solid rgba(0,242,255,0.15)" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Consent Status</div>
                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  Signed {new Date(profile.consent.signed_at).toLocaleString()}
                </div>
                <button
                  onClick={() => downloadConsentPdf(profile.patient.consent_subject_id, profile.patient.trial_id)}
                  style={{ color: "#00f2ff", background: "rgba(0,242,255,0.08)", border: "1px solid rgba(0,242,255,0.2)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Download Signed Consent PDF
                </button>
              </div>
            ) : null}
            <h3 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Recent Wearable Data ({profile.wearable_data.length})</h3>
            {profile.wearable_data.length === 0 ? <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No wearable data recorded</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {profile.wearable_data.slice(0, 4).map((w, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.6rem", fontSize: "0.75rem" }}>
                    <div style={{ color: "#64748b", marginBottom: "0.25rem" }}>{new Date(w.recorded_at).toLocaleDateString()}</div>
                    <div>❤️ {w.heart_rate ?? "—"}</div>
                    <div>🩸 {w.glucose ?? "—"}</div>
                    <div>👣 {w.steps ?? "—"}</div>
                    <div>🌡️ {w.temperature ?? "—"}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Call History */}
            <h3 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem", marginTop: "1.5rem" }}>Call History ({callLogs.length})</h3>
            {callLogs.length === 0 ? <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>No calls logged</p> : (
              <div style={{ marginBottom: "1.5rem" }}>
                {callLogs.map(log => (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
                    <span>Called by {log.coordinator_name}</span>
                    <span style={{ color: "#64748b" }}>{new Date(log.initiated_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Confirmation Modal */}
      {showCallConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCallConfirm(null)}>
          <div style={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "2rem", width: "400px" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.2rem", marginBottom: "1rem" }}>📞 Initiate Twilio Call</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              You are about to call this patient. Twilio will first call your registered number. Pick up to connect to the patient.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCallConfirm(null)} style={{ background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>Cancel</button>
              <button onClick={() => initiateCall(showCallConfirm)} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>Confirm Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Edit Profile Modal */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "2.5rem", width: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "Space Grotesk", fontSize: "1.4rem", margin: 0 }}>⚙️ Edit Profile</h2>
              <button onClick={() => { setShowSettings(false); setOtpStep(false); }} style={{ background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
            </div>
            {!otpStep ? (
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Full Name</label>
                  <input required value={settingsForm.full_name} onChange={e=>setSettingsForm({...settingsForm, full_name: e.target.value})} style={{ width: "100%", padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Phone Number</label>
                  <input required value={settingsForm.phone_number} onChange={e=>setSettingsForm({...settingsForm, phone_number: e.target.value})} placeholder="+1234567890" style={{ width: "100%", padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                </div>
                <button type="submit" style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", padding: "0.8rem", fontWeight: 600, cursor: "pointer", marginTop: "1rem" }}>Save Profile</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhone} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>A verification code was sent via SMS to <b>{settingsForm.phone_number}</b>.</p>
                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Enter OTP</label>
                  <input required value={otpVal} onChange={e=>setOtpVal(e.target.value)} placeholder="1234" style={{ width: "100%", padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", letterSpacing: "0.2rem", textAlign: "center", fontSize: "1.2rem" }} />
                </div>
                <button type="submit" style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "0.8rem", fontWeight: 600, cursor: "pointer", marginTop: "1rem" }}>Verify Phone</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
