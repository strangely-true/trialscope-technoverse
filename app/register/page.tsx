"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const ROLES = [
  {
    value: "patient",
    label: "Patient",
    icon: "🩺",
    desc: "Find clinical trials matching your condition",
  },
  {
    value: "coordinator",
    label: "Coordinator",
    icon: "📋",
    desc: "Manage trial patients and monitor health data",
  },
  {
    value: "pharma",
    label: "Pharma Company",
    icon: "🏥",
    desc: "Post trials and recruit qualified candidates",
  },
]

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Gujarati",
]

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    preferred_language: "English",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Registration failed")
      }
      const data = await res.json()
      
      if (form.phone_number) {
        setUserId(data.id)
        setStep(3)
      } else {
        // Redirect by role
        if (role === "patient") router.push("/login?registered=1")
        else if (role === "coordinator") router.push("/coordinator/login?registered=1")
        else router.push("/pharma/login?registered=1")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Verification failed")
      }
      // Redirect by role after successful verification
      if (role === "patient") router.push("/login?registered=1")
      else if (role === "coordinator") router.push("/coordinator/login?registered=1")
      else router.push("/pharma/login?registered=1")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span style={{ fontSize: "1.5rem" }}>🧬</span>
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 700,
                fontSize: "1.4rem",
              }}
            >
              Trial<span className="text-cyan">Go</span>
            </span>
          </Link>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "1.75rem",
              fontWeight: 700,
              marginTop: "1.5rem",
              marginBottom: "0.5rem",
            }}
          >
            Create your account
          </h1>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.95rem" }}>
            Join the AI-powered clinical trial ecosystem
          </p>
        </div>

        <div className="glass-card p-8">
          {step === 1 ? (
            <>
              <p
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginBottom: "1.25rem",
                  fontSize: "0.9rem",
                  color: "var(--foreground-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                I am a...
              </p>
              <div className="flex flex-col gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setRole(r.value)
                      setStep(2)
                    }}
                    className="glass group flex items-center gap-4 p-5 text-left"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      cursor: "pointer",
                      border:
                        role === r.value
                          ? "1px solid var(--primary)"
                          : "1px solid var(--glass-border)",
                    }}
                  >
                    <span style={{ fontSize: "1.75rem" }}>{r.icon}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: "Space Grotesk",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {r.label}
                      </div>
                      <div
                        style={{
                          color: "var(--foreground-muted)",
                          fontSize: "0.8rem",
                          marginTop: "0.2rem",
                        }}
                      >
                        {r.desc}
                      </div>
                    </div>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "var(--foreground-subtle)",
                      }}
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
              <p
                className="mt-6 text-center"
                style={{
                  color: "var(--foreground-muted)",
                  fontSize: "0.875rem",
                }}
              >
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--primary)" }}>
                  Sign in
                </Link>
              </p>
            </>
          ) : step === 2 ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  color: "var(--foreground-subtle)",
                  fontSize: "0.85rem",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <div
                style={{
                  background: "rgba(0,242,255,0.08)",
                  borderRadius: "var(--radius)",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span>{ROLES.find((r) => r.value === role)?.icon}</span>
                <span style={{ fontFamily: "Space Grotesk", fontWeight: 600 }}>
                  {ROLES.find((r) => r.value === role)?.label}
                </span>
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
                  Full Name
                </label>
                <input
                  className="input-dark"
                  placeholder="Anjali Sharma"
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
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
                  Email
                </label>
                <input
                  className="input-dark"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
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
                  Mobile Number
                </label>
                <input
                  className="input-dark"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                  value={form.phone_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone_number: e.target.value }))
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
                  Password
                </label>
                <input
                  className="input-dark"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
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
                  Preferred Language
                </label>
                <select
                  className="input-dark"
                  value={form.preferred_language}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      preferred_language: e.target.value,
                    }))
                  }
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p style={{ color: "var(--red-alert)", fontSize: "0.875rem" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{ justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
              <p
                className="text-center"
                style={{ color: "var(--foreground-muted)", fontSize: "0.8rem" }}
              >
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--primary)" }}>
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5">
              <div className="text-center mb-4">
                <span style={{ fontSize: "2rem" }}>📱</span>
                <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "1.2rem", marginTop: "0.5rem" }}>Verify your Phone</h2>
                <p style={{ color: "var(--foreground-muted)", fontSize: "0.9rem" }}>Enter the 4-digit OTP sent to {form.phone_number}</p>
              </div>
              <div>
                <input
                  className="input-dark text-center"
                  style={{ fontSize: "1.5rem", letterSpacing: "0.5em" }}
                  placeholder="1234"
                  maxLength={4}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              {error && <p style={{ color: "var(--red-alert)", fontSize: "0.875rem" }}>{error}</p>}
              <button
                type="submit"
                className="btn-primary"
                style={{ justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
