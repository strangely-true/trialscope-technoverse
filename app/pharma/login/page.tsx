"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PharmaLoginPage() {
  const router = useRouter()
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
      if (!res.ok) throw new Error("Invalid credentials")
      const data = await res.json()
      if (data.role !== "pharma") throw new Error("Not a pharma account")
      localStorage.setItem("trialgo_token", data.access_token)
      localStorage.setItem("trialgo_role", data.role)
      router.push("/pharma/analytics")
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
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: "1.4rem",
            }}
          >
            🧬 Trial<span className="text-cyan">Go</span>
          </Link>
          <div className="badge-cyan mt-4 mb-3 inline-block">
            🏥 Pharma Portal
          </div>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "1.75rem",
              fontWeight: 700,
            }}
          >
            Pharma Sign In
          </h1>
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
                Corporate Email
              </label>
              <input
                className="input-dark"
                type="email"
                placeholder="you@pharmacompany.com"
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
                placeholder="Password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div
              className="glass"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius)",
                fontSize: "0.8rem",
                color: "var(--foreground-muted)",
              }}
            >
              💡 Demo: <strong>pharma@trialgo.ai</strong> /{" "}
              <strong>demo1234</strong>
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
              {loading ? "Signing in..." : "Access Portal →"}
            </button>
            <p
              style={{
                textAlign: "center",
                color: "var(--foreground-muted)",
                fontSize: "0.8rem",
              }}
            >
              New to TrialGo?{" "}
              <Link href="/register" style={{ color: "var(--primary)" }}>
                Register your company
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
