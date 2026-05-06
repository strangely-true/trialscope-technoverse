"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter, usePathname } from "next/navigation"

interface DiscoveryItem {
  id: number
  source: string
  data: any
  fetched_at: string
}

export default function DiscoveryPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  
  const rawTrialId = useMemo(() => {
    const paramValue = Array.isArray(params?.trialId) ? params?.trialId?.[0] : params?.trialId
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

  const [items, setItems] = useState<DiscoveryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/pharma/login")
      return
    }

    if (trialId === null) {
      setError("Invalid trial ID")
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/pharma/discovery/${trialId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch discovery data")
        return res.json()
      })
      .then((data) => {
        setItems(data)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [trialId, router])

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <nav style={{
        background: "rgba(5,20,36,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/pharma/analytics" style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "Space Grotesk",
          fontWeight: 700,
        }}>
          🧬 Trial<span className="text-cyan">Go</span>
          <span style={{ color: "var(--foreground-subtle)", fontSize: "0.8rem" }}>/ Discovery</span>
        </Link>
        <Link href={`/pharma/analytics?trial=${trialId}`} className="btn-ghost" style={{ padding: "0.5rem 1rem" }}>
          Back to Analytics
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 style={{ fontFamily: "Space Grotesk", fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Global Registry Discovery
        </h1>
        <p style={{ color: "var(--foreground-muted)", marginBottom: "2rem" }}>
          Showing raw trial data discovered across 18 international medical registries for Trial #{trialId}
        </p>

        {loading ? (
          <div className="py-20 text-center" style={{ color: "var(--foreground-muted)" }}>
            🔄 Loading discovery results...
          </div>
        ) : error ? (
          <div className="py-20 text-center" style={{ color: "var(--foreground-error)" }}>
            ⚠️ {error}
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card py-20 text-center" style={{ color: "var(--foreground-muted)" }}>
            🔎 No external trial data found yet for this condition.
          </div>
        ) : (
          <div className="grid gap-6">
            {items.map((item) => (
              <div key={item.id} className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="badge-cyan">{item.source}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--foreground-subtle)" }}>
                    Fetched: {new Date(item.fetched_at).toLocaleString()}
                  </span>
                </div>
                <div style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  overflowX: "auto",
                  maxHeight: "300px"
                }}>
                  <pre>{JSON.stringify(item.data, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
