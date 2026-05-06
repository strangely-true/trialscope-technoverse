"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Trial {
  id: number
  title: string
  disease: string
  stage: string
  age_min: number
  age_max: number
  gender: string
  patients_needed: number
  description: string
  status: string
  created_at: string
}

interface ExternalMatch {
  id: number
  trial_name: string
  condition: string
  location: string
  phase: string
  status: string
  eligibility_summary: string
  external_url: string
  source_database: string
  source_database_url: string
  match_score: number
  match_tier: string
  match_reason: string | null
  why_relevant: string | null
  concerns: string | null
  fetched_at: string
}

interface DatabaseSummary {
  name: string
  url: string
  match_count: number
  match_status?: "matched" | "no_match"
  sample_trial_name?: string | null
  sample_trial_url?: string | null
  sample_status?: string | null
  sample_phase?: string | null
}

const DATABASE_CATALOG: Array<{ name: string; url: string }> = [
  { name: "ClinicalTrials.gov", url: "https://clinicaltrials.gov" },
  { name: "WHO ICTRP", url: "https://trialsearch.who.int" },
  { name: "EU Clinical Trials Register", url: "https://www.clinicaltrialsregister.eu" },
  { name: "ISRCTN Registry", url: "https://www.isrctn.com" },
  { name: "ANZCTR Australia", url: "https://www.anzctr.org.au" },
  { name: "CTRI India", url: "https://ctri.nic.in" },
  { name: "ChiCTR China", url: "https://www.chictr.org.cn" },
  { name: "DRKS Germany", url: "https://drks.de" },
  { name: "UMIN Japan", url: "https://umin.ac.jp" },
  { name: "Thai Clinical Trials", url: "https://www.thaiclinicaltrials.org" },
  { name: "Netherlands Trial Register", url: "https://www.trialregister.nl" },
  { name: "REBEC Brazil", url: "https://ensaiosclinicos.gov.br" },
  { name: "PACTR Africa", url: "https://pactr.samrc.ac.za" },
  { name: "IRCT Iran", url: "https://en.irct.ir" },
  { name: "Cochrane Library", url: "https://www.cochranelibrary.com" },
  { name: "SLCTR Sri Lanka", url: "https://slctr.lk" },
  { name: "Research Registry", url: "https://www.researchregistry.com" },
  { name: "Semantic Scholar", url: "https://www.semanticscholar.org" },
  { name: "PubMed Trial Publications", url: "https://pubmed.ncbi.nlm.nih.gov" },
  { name: "Europe PMC", url: "https://europepmc.org" },
]

function getDefaultDatabaseSummary(): DatabaseSummary[] {
  return DATABASE_CATALOG.map((db) => ({
    name: db.name,
    url: db.url,
    match_count: 0,
    match_status: "no_match",
    sample_trial_name: null,
    sample_trial_url: null,
    sample_status: null,
    sample_phase: null,
  }))
}

function mergeDatabaseSummary(incoming: DatabaseSummary[] | undefined): DatabaseSummary[] {
  const incomingMap = new Map((incoming || []).map((item) => [item.name, item]))
  return DATABASE_CATALOG.map((db) => {
    const found = incomingMap.get(db.name)
    const matchCount = found?.match_count ?? 0
    return {
      name: db.name,
      url: db.url,
      match_count: matchCount,
      match_status: matchCount > 0 ? "matched" : "no_match",
      sample_trial_name: found?.sample_trial_name ?? null,
      sample_trial_url: found?.sample_trial_url ?? null,
      sample_status: found?.sample_status ?? null,
      sample_phase: found?.sample_phase ?? null,
    }
  })
}

export default function TrialsPage() {
  const router = useRouter()
  const [trials, setTrials] = useState<Trial[]>([])
  const [externalMatches, setExternalMatches] = useState<ExternalMatch[]>([])
  const [loadingTrials, setLoadingTrials] = useState(true)
  const [loadingExternal, setLoadingExternal] = useState(true)
  const [error, setError] = useState<string>("")
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [hasQuestionnaire, setHasQuestionnaire] = useState(true)
  const [stillSearching, setStillSearching] = useState(false)
  const [databaseSummary, setDatabaseSummary] = useState<DatabaseSummary[]>(
    getDefaultDatabaseSummary(),
  )

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    // Fetch internal trials
    fetch("/api/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setTrials(Array.isArray(data) ? data : [])
        setError("")
      })
      .catch((err) => {
        setError("Failed to load trials.")
        setTrials([])
        console.error(err)
      })
      .finally(() => setLoadingTrials(false))

    // Fetch questionnaire status + external matches
    fetch("/api/questionnaire/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setHasQuestionnaire(data.questionnaire_completed)
        setSearchQuery(data.search_query || "")
        setStillSearching(data.searching)
      })
      .catch(() => {})

    fetch("/api/questionnaire/external-matches", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setExternalMatches(data.matches || [])
        const mergedSummary = mergeDatabaseSummary(data.database_summary)
        setDatabaseSummary(mergedSummary)
      })
      .catch(() => {
        setExternalMatches([])
        setDatabaseSummary(getDefaultDatabaseSummary())
      })
      .finally(() => setLoadingExternal(false))
  }, [router])

  // Poll if still searching
  useEffect(() => {
    if (!stillSearching) return
    const token = localStorage.getItem("trialgo_token")
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch("/api/questionnaire/status", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const statusData = await statusRes.json()
        if (!statusData.searching) {
          // Search has finished (either found matches, or found 0)
          const matchRes = await fetch("/api/questionnaire/external-matches", {
            headers: { Authorization: `Bearer ${token}` },
          })
          const matchData = await matchRes.json()
          setExternalMatches(matchData.matches || [])
          const mergedSummary = mergeDatabaseSummary(matchData.database_summary)
          setDatabaseSummary(mergedSummary)
          setStillSearching(false)
          setLoadingExternal(false)
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [stillSearching])

  const normalizedSearch = (search ?? "").toLowerCase()
  const filteredTrials = trials.filter((t) => {
    const disease = (t.disease ?? "").toLowerCase()
    const title = (t.title ?? "").toLowerCase()
    return (
      disease.includes(normalizedSearch) || title.includes(normalizedSearch)
    )
  })

  // Group external matches by source database
  const groupedExternal: Record<string, ExternalMatch[]> = {}
  for (const m of externalMatches) {
    if (!groupedExternal[m.source_database])
      groupedExternal[m.source_database] = []
    groupedExternal[m.source_database].push(m)
  }

  return (
    <div className="hero-bg min-h-screen">
      {/* Nav */}
      <nav
        style={{
          background: "rgba(5,20,36,0.9)",
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
          🧬 Trial<span className="text-cyan">Go</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding/questionnaire"
            className="btn-ghost"
            style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
          >
            ✏️ Edit Search
          </Link>
          <Link
            href="/dashboard"
            className="btn-ghost"
            style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}
          >
            My Dashboard
          </Link>
          <button
            onClick={() => {
              localStorage.clear()
              router.push("/login")
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
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "2rem",
                fontWeight: 700,
              }}
            >
              Your Trial Matches
            </h1>
            {searchQuery && (
              <p
                style={{
                  color: "var(--foreground-muted)",
                  marginTop: "0.25rem",
                  fontSize: "0.85rem",
                }}
              >
                Searching for:{" "}
                <span style={{ color: "var(--primary)" }}>
                  &quot;{searchQuery}&quot;
                </span>
              </p>
            )}
          </div>
          <input
            className="input-dark"
            placeholder="Filter by disease or trial name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "320px" }}
          />
        </div>

        {/* ━━━━ SECTION 1: INTERNAL TRIALGO TRIALS ━━━━ */}
        <section style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <h2
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "1.3rem",
                fontWeight: 700,
              }}
            >
              Trials Available on TrialGo
            </h2>
            <span
              style={{
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                fontSize: "0.65rem",
                fontWeight: 700,
                background: "rgba(0,149,255,0.15)",
                color: "#0095ff",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              MANAGED
            </span>
          </div>
          <p
            style={{
              color: "var(--foreground-muted)",
              fontSize: "0.85rem",
              marginBottom: "1.5rem",
            }}
          >
            Full managed trial experience — AI-powered consent, monitoring, and
            support. Apply directly.
          </p>

          {loadingTrials ? (
            <div
              className="py-10 text-center"
              style={{ color: "var(--foreground-muted)" }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                🔄
              </div>
              Loading trials...
            </div>
          ) : filteredTrials.length === 0 ? (
            <div
              className="glass-card py-10 text-center"
              style={{ color: "var(--foreground-muted)" }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                📋
              </div>
              {search
                ? "No TrialGo trials match your search"
                : "No TrialGo-hosted trials found for your condition right now. Check back soon."}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrials.map((trial) => (
                <div
                  key={trial.id}
                  className="glass flex flex-col gap-4 p-6"
                  style={{ borderLeft: "3px solid #0095ff" }}
                >
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        style={{
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          background: "rgba(0,149,255,0.15)",
                          color: "#0095ff",
                        }}
                      >
                        TRIALGO MANAGED
                      </span>
                      <span className="badge-cyan">
                        Stage {trial.stage || "N/A"}
                      </span>
                      <span className="badge-green">Recruiting</span>
                    </div>
                    <h3
                      style={{
                        fontFamily: "Space Grotesk",
                        fontWeight: 600,
                        fontSize: "1.05rem",
                        marginBottom: "0.5rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {trial.title}
                    </h3>
                    <p
                      style={{
                        color: "var(--foreground-muted)",
                        fontSize: "0.85rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {trial.description?.substring(0, 120)}...
                    </p>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-2"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--foreground-subtle)",
                    }}
                  >
                    <span>🦠 {trial.disease}</span>
                    <span>👥 {trial.patients_needed} needed</span>
                    <span>
                      🎂 Age {trial.age_min}–{trial.age_max}
                    </span>
                    <span>⚧ {trial.gender}</span>
                  </div>
                  <Link
                    href={`/trials/${trial.id}`}
                    className="btn-primary mt-auto"
                    style={{
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      padding: "0.6rem 1.25rem",
                    }}
                  >
                    APPLY NOW →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ━━━━ DIVIDER ━━━━ */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(to right, transparent, var(--glass-border), transparent)",
            margin: "2rem 0 2.5rem",
          }}
        />

        {/* ━━━━ SECTION 2: GLOBAL DATABASE MATCHES ━━━━ */}
        <section>
          <div
            style={{
              marginBottom: "1.25rem",
            }}
          >
            <h2
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "1.3rem",
                fontWeight: 700,
              }}
            >
              🌍 Globally Found Databases
            </h2>
          </div>
          <p
            style={{
              color: "var(--foreground-muted)",
              fontSize: "0.85rem",
              marginBottom: "1.5rem",
            }}
          >
            All expected trial databases are listed below. Matched trials are
            shown directly under each database.
          </p>

          {!hasQuestionnaire ? (
            <div className="glass-card py-12 text-center">
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📝</div>
              <h3
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  marginBottom: "0.5rem",
                }}
              >
                Complete your profile to discover global trials
              </h3>
              <p
                style={{
                  color: "var(--foreground-muted)",
                  fontSize: "0.85rem",
                  marginBottom: "1.5rem",
                }}
              >
                Answer a short questionnaire and we&apos;ll search 20+ databases
                worldwide.
              </p>
              <Link
                href="/onboarding/questionnaire"
                className="btn-primary"
                style={{ display: "inline-flex" }}
              >
                Start Questionnaire →
              </Link>
            </div>
          ) : stillSearching || loadingExternal ? (
            <div
              className="glass-card py-12 text-center"
              style={{ color: "var(--foreground-muted)" }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "1rem",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                🔍
              </div>
              Still searching global databases...
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                Results will appear automatically when ready.
              </p>
              <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
            </div>
          ) : databaseSummary.length === 0 ? (
            <div
              className="glass-card py-12 text-center"
              style={{ color: "var(--foreground-muted)" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🌐</div>
              Database summary not available yet.
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                Try refreshing after search completes.
              </p>
              <Link
                href="/onboarding/questionnaire"
                className="btn-ghost"
                style={{ marginTop: "1rem", display: "inline-flex" }}
              >
                Edit Search →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {externalMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-3 p-5"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        background: "rgba(255,255,255,0.07)",
                        color: "var(--foreground-subtle)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {m.source_database}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {m.trial_name.substring(0, 100)}
                    {m.trial_name.length > 100 ? "..." : ""}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--foreground-subtle)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.3rem",
                    }}
                  >
                    <span>🦠 {m.condition}</span>
                    <span>📍 {m.location || "Global"}</span>
                    <span>🔬 {m.phase}</span>
                    <span>📋 {m.status}</span>
                  </div>
                  {m.match_reason && (
                    <div
                      style={{
                        padding: "0.4rem 0.6rem",
                        borderRadius: "6px",
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        fontSize: "0.75rem",
                        color: "var(--green-alert)",
                        lineHeight: 1.4,
                      }}
                    >
                      ✅ {m.match_reason}
                    </div>
                  )}
                  {m.concerns && (
                    <div
                      style={{
                        padding: "0.4rem 0.6rem",
                        borderRadius: "6px",
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        fontSize: "0.75rem",
                        color: "var(--amber-alert)",
                        lineHeight: 1.4,
                      }}
                    >
                      ⚠️ Note: {m.concerns}
                    </div>
                  )}
                  {m.eligibility_summary && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--foreground-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {m.eligibility_summary.substring(0, 150)}
                      {m.eligibility_summary.length > 150 ? "..." : ""}
                    </p>
                  )}
                  <a
                    href={m.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost mt-auto"
                    style={{
                      justifyContent: "center",
                      fontSize: "0.82rem",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    VISIT TRIAL WEBSITE ↗
                  </a>
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--foreground-subtle)",
                      textAlign: "center",
                      marginTop: "-0.25rem",
                    }}
                  >
                    This trial is hosted externally. TrialGo is not
                    responsible for their process.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
