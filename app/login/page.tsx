"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const registered = params.get("registered")
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Login failed")
      }
      const data = await res.json()
      localStorage.setItem("trialgo_token", data.access_token)
      localStorage.setItem("trialgo_role", data.role)
      localStorage.setItem("trialgo_user_id", String(data.user_id))
      localStorage.setItem("trialgo_user", JSON.stringify(data))

      if (data.role === "coordinator") {
        router.push("/coordinator/cohort")
      } else if (data.role === "pharma") {
        router.push("/pharma/analytics")
      } else {
        // Patient: check if questionnaire is completed
        try {
          const qRes = await fetch("/api/questionnaire/status", {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
          const qData = await qRes.json()
          if (!qData.questionnaire_completed) {
            router.push("/onboarding/questionnaire")
          } else {
            router.push("/trials")
          }
        } catch {
          router.push("/trials")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
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
            Welcome back
          </h1>
          {registered && (
            <div className="badge-cyan mt-2 inline-block">
              ✅ Account created! Please sign in.
            </div>
          )}
        </div>
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
                Password
              </label>
              <input
                className="input-dark"
                type="password"
                placeholder="Your password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
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
              {loading ? "Signing in..." : "Sign In →"}
            </button>
            <p
              className="text-center"
              style={{ color: "var(--foreground-muted)", fontSize: "0.875rem" }}
            >
              No account?{" "}
              <Link href="/register" style={{ color: "var(--primary)" }}>
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
