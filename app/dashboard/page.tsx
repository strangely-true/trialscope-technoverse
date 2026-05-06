"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWebRTC } from "../hooks/useWebRTC"

interface VerifiedPatient {
  id: number
  hash_id: string
  trial_id: number
  match_score: number
  status: string
  enrolled_at: string
  consent_pdf_url?: string | null
  consent_signed_at?: string | null
}

interface Trial {
  id: number
  title: string
  disease: string
  stage: string
  pharma_user_id: number
}

interface EnrolledTrial {
  patient: VerifiedPatient
  trial: Trial
}

export default function DashboardPage() {
  const router = useRouter()
  const [enrolledTrials, setEnrolledTrials] = useState<EnrolledTrial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")


  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<{ roomId: string; from: string } | null>(null)
  const [callRoomId, setCallRoomId] = useState<string | null>(null)
  const { callState, error: callError, duration, answerCall, endCall } = useWebRTC(callRoomId)
  const notifWsRef = useRef<WebSocket | null>(null)
  

  // Wearable Modal State
  const [showWearableModal, setShowWearableModal] = useState(false)
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null)
  const [wearableForm, setWearableForm] = useState({
    heart_rate: "",
    glucose: "",
    steps: "",
    temperature: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: ""
  })
  const [submittingWearable, setSubmittingWearable] = useState(false)

  // Settings Modal State
  const [userMe, setUserMe] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ full_name: "", phone_number: "", preferred_language: "" })
  const [otpStep, setOtpStep] = useState(false)
  const [otpVal, setOtpVal] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")
    let userId = localStorage.getItem("trialgo_user_id")
    if (!userId) {
      try {
        const userStr = localStorage.getItem("trialgo_user")
        if (userStr) userId = JSON.parse(userStr).user_id
      } catch {}
    }

    if (!token || role !== "patient") {
      router.push("/login")
      return
    }

    // Connect to user notification WebSocket (for incoming call alerts)
    if (userId) {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
      const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost:8000"
      const ws = new WebSocket(`${proto}//${host}/ws/user/${userId}`)
      notifWsRef.current = ws
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === "incoming_call") {
            setIncomingCall({ roomId: msg.room_id, from: msg.from })
          }
        } catch {}
      }
    }

    setLoading(true)
    setError("")

    const headers = { Authorization: `Bearer ${token}` }

    // Fetch patient's enrolled trials
    fetch("/api/patient/my-trial-info", { headers })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setEnrolledTrials(Array.isArray(data) ? data : [])
        setError("")
      })
      .catch((err) => {
        console.error("Enrolled trials fetch error:", err)
        setError("Failed to load your enrolled trials")
        setEnrolledTrials([])
      })
      .finally(() => setLoading(false))

    // Fetch user details for profile
    fetch("/api/auth/me", { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setUserMe(d)
          setSettingsForm({ full_name: d.full_name || "", phone_number: d.phone_number || "", preferred_language: d.preferred_language || "en" })
        }
      })

    return () => { notifWsRef.current?.close() }
  }, [router])

  const handleWearableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrialId) return
    setSubmittingWearable(true)

    try {
      const token = localStorage.getItem("trialgo_token")
      const payload = {
        trial_id: selectedTrialId,
        heart_rate: parseFloat(wearableForm.heart_rate),
        glucose: parseFloat(wearableForm.glucose),
        steps: parseInt(wearableForm.steps),
        temperature: parseFloat(wearableForm.temperature),
        blood_pressure_systolic: parseFloat(wearableForm.blood_pressure_systolic),
        blood_pressure_diastolic: parseFloat(wearableForm.blood_pressure_diastolic),
      }

      const res = await fetch("/api/patient/wearable-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const result = await res.json()

      if (result.anomalies_detected > 0) {
        alert("⚠️ Unusual reading detected. Your coordinator has been notified.")
      } else {
        alert("✅ Wearable data uploaded successfully.")
      }
      setShowWearableModal(false)
      setWearableForm({
        heart_rate: "",
        glucose: "",
        steps: "",
        temperature: "",
        blood_pressure_systolic: "",
        blood_pressure_diastolic: ""
      })
    } catch (err) {
      alert("Failed to upload wearable data. Please check your inputs.")
    } finally {
      setSubmittingWearable(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("trialgo_token")
    const headersJson = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    try {
      const res = await fetch("/api/auth/me", { method: "PUT", headers: headersJson, body: JSON.stringify(settingsForm) })
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
    const token = localStorage.getItem("trialgo_token")
    const headersJson = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    try {
      const res = await fetch("/api/auth/verify-phone", { method: "POST", headers: headersJson, body: JSON.stringify({ user_id: userMe.id, otp: otpVal }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Invalid OTP")
      alert("Phone verified successfully!")
      setOtpStep(false)
      setShowSettings(false)
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(d=>setUserMe(d))
    } catch(err: any) { alert(err.message) }
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
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          🧬 Trial<span style={{ color: "var(--primary)" }}>Go</span>
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowSettings(true)} style={{ background: "transparent", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "0.8rem", cursor: "pointer" }}>⚙️ Edit Profile</button>
          <Link
            href="/trials"
            className="btn-ghost"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            Browse Trials
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
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            My Dashboard
          </h1>
          <p style={{ color: "var(--foreground-muted)", marginTop: "0.5rem" }}>
            Your enrolled clinical trials and progress
          </p>
        </div>

        {loading ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading your trials...
          </div>
        ) : error ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-error)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            {error}
          </div>
        ) : enrolledTrials.length === 0 ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--foreground-muted)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📋</div>
            <p>You are not enrolled in any trials yet</p>
            <Link
              href="/trials"
              className="btn-primary"
              style={{
                marginTop: "1rem",
                display: "inline-block",
                padding: "0.6rem 1.5rem",
              }}
            >
              Browse Available Trials →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {enrolledTrials.map((et) => (
              <div
                key={et.patient.id}
                className="glass flex flex-col gap-4 p-6"
              >
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={
                        et.patient.status === "enrolled"
                          ? "badge-green"
                          : "badge-amber"
                      }
                    >
                      {et.patient.status}
                    </span>
                    <span className="badge-cyan">
                      Stage {et.trial.stage || "N/A"}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {et.trial.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--foreground-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {et.trial.disease}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    fontSize: "0.85rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--glass-border)",
                  }}
                >
                  <div></div>
                  <div>
                    <div
                      style={{
                        color: "var(--foreground-subtle)",
                        fontSize: "0.75rem",
                      }}
                    >
                      Enrolled
                    </div>
                    <div
                      style={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                    >
                      {new Date(et.patient.enrolled_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    marginTop: "auto",
                  }}
                >
                  <Link
                    href={`/trials/${et.trial.id}`}
                    className="btn-primary"
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.5rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    View Trial
                  </Link>
                  <Link
                    href={`/patient/symptom-log?trial=${et.trial.id}`}
                    className="btn-ghost"
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.5rem 1rem",
                      textAlign: "center",
                    }}
                  >
                    Log Symptoms
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedTrialId(et.trial.id)
                      setShowWearableModal(true)
                    }}
                    className="btn-ghost"
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.5rem 1rem",
                      textAlign: "center",
                      gridColumn: "span 2",
                      marginTop: "0.5rem",
                      border: "1px dashed var(--glass-border)"
                    }}
                  >
                    ⌚ Upload Wearables
                  </button>
                  {et.patient.consent_pdf_url ? (
                    <a
                      href={et.patient.consent_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost"
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.5rem 1rem",
                        textAlign: "center",
                        gridColumn: "span 2",
                      }}
                    >
                      View Signed Consent PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wearable Data Modal */}
      {showWearableModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="glass" style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "Space Grotesk", fontSize: "1.5rem", fontWeight: 700 }}>⌚ Vital Statistics</h2>
              <button onClick={() => setShowWearableModal(false)} style={{ background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <form onSubmit={handleWearableSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--foreground-subtle)", marginBottom: "0.4rem" }}>Heart Rate (BPM)</label>
                  <input
                    type="number"
                    className="input-dark"
                    placeholder="72"
                    required
                    value={wearableForm.heart_rate}
                    onChange={e => setWearableForm({ ...wearableForm, heart_rate: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--foreground-subtle)", marginBottom: "0.4rem" }}>Glucose (mg/dL)</label>
                  <input
                    type="number"
                    className="input-dark"
                    placeholder="95"
                    required
                    value={wearableForm.glucose}
                    onChange={e => setWearableForm({ ...wearableForm, glucose: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--foreground-subtle)", marginBottom: "0.4rem" }}>Avg Steps Daliy</label>
                  <input
                    type="number"
                    className="input-dark"
                    placeholder="5000"
                    required
                    value={wearableForm.steps}
                    onChange={e => setWearableForm({ ...wearableForm, steps: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--foreground-subtle)", marginBottom: "0.4rem" }}>Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-dark"
                    placeholder="98.6"
                    required
                    value={wearableForm.temperature}
                    onChange={e => setWearableForm({ ...wearableForm, temperature: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--foreground-subtle)", marginBottom: "0.4rem" }}>Systolic BP</label>
                  <input
                    type="number"
                    className="input-dark"
                    placeholder="120"
                    required
                    value={wearableForm.blood_pressure_systolic}
                    onChange={e => setWearableForm({ ...wearableForm, blood_pressure_systolic: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--foreground-subtle)", marginBottom: "0.4rem" }}>Diastolic BP</label>
                  <input
                    type="number"
                    className="input-dark"
                    placeholder="80"
                    required
                    value={wearableForm.blood_pressure_diastolic}
                    onChange={e => setWearableForm({ ...wearableForm, blood_pressure_diastolic: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingWearable}
                className="btn-primary"
                style={{ marginTop: "1rem", padding: "0.8rem", opacity: submittingWearable ? 0.7 : 1 }}
              >
                {submittingWearable ? "Syncing..." : "Sync Vital Data →"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Incoming Call Banner */}
      {incomingCall && callState === "idle" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "linear-gradient(135deg,#0d1b2a,#0a2540)", border: "1px solid rgba(0,242,255,0.3)", borderRadius: "24px", padding: "2.5rem", width: "360px", textAlign: "center", boxShadow: "0 0 60px rgba(0,242,255,0.15)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "ring 1s ease-in-out infinite" }}>📞</div>
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.5rem" }}>Incoming Call</div>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "2rem" }}>{incomingCall.from} is calling you</div>
            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
              <button
                onClick={() => { setIncomingCall(null); }}
                style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "64px", height: "64px", fontSize: "1.8rem", cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}
              >📵</button>
              <button
                onClick={() => {
                  setCallRoomId(incomingCall.roomId)
                  setIncomingCall(null)
                  setTimeout(() => answerCall(), 300)
                }}
                style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: "50%", width: "64px", height: "64px", fontSize: "1.8rem", cursor: "pointer", boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
              >📞</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "1.2rem", fontSize: "0.75rem", color: "#64748b" }}>
              <span>Decline</span><span>Accept</span>
            </div>
          </div>
          <style>{`@keyframes ring { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }`}</style>
        </div>
      )}

      {/* Active Call Screen */}
      {callRoomId && callState !== "idle" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "linear-gradient(135deg,#0d1b2a,#0a2540)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "24px", padding: "2.5rem", width: "360px", textAlign: "center", boxShadow: "0 0 60px rgba(34,197,94,0.15)" }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1.5rem",
              animation: callState === "connecting" ? "pulse 1.5s ease-in-out infinite" : "none" }}>📋</div>
            <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.4rem" }}>Trial Coordinator</div>
            <div style={{ color: callState === "active" ? "#22c55e" : "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
              {callState === "connecting" && "🔄 Connecting..."}
              {callState === "active" && `🟢 Connected · ${duration}`}
              {callState === "ended" && "📴 Call ended"}
              {callState === "error" && `❌ ${callError}`}
            </div>
            {callState === "active" && (
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>🎙️ Mic active &nbsp; 🔊 Audio on</div>
            )}
            <button
              onClick={() => { endCall(); setCallRoomId(null) }}
              style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "60px", height: "60px", fontSize: "1.5rem", cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}
            >📵</button>
            <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "1rem" }}>End call</div>
          </div>
          <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 0 16px rgba(34,197,94,0)} }`}</style>
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
