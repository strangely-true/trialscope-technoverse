"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TrialGoLoader } from "@/components/ui/trialgo-loader"

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          🧬 Trial<span className="text-blue-600 dark:text-blue-400">Go</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding/questionnaire"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            ✏️ Edit Search
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
            My Dashboard
          </Link>
          <button
            onClick={() => {
              localStorage.clear()
              router.push("/login")
            }}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Your Trial Matches
            </h1>
            {searchQuery && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Searching for:{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  &quot;{searchQuery}&quot;
                </span>
              </p>
            )}
          </div>
          <input
            className="w-full max-w-[320px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
            placeholder="Filter by disease or trial name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ━━━━ SECTION 1: INTERNAL TRIALGO TRIALS ━━━━ */}
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Trials Available on TrialGo
            </h2>
            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              MANAGED
            </span>
          </div>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Full managed trial experience — AI-powered consent, monitoring, and
            support. Apply directly.
          </p>

          {loadingTrials ? (
            <div className="py-20 flex justify-center">
              <TrialGoLoader size="md" label="Loading trials" />
            </div>
          ) : filteredTrials.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
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
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm dark:border-slate-700 dark:border-l-blue-500 dark:bg-slate-800"
                >
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        TRIALGO MANAGED
                      </span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        Stage {trial.stage || "N/A"}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Recruiting</span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">
                      {trial.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {trial.description?.substring(0, 120)}...
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>🦠 {trial.disease}</span>
                    <span>👥 {trial.patients_needed} needed</span>
                    <span>
                      🎂 Age {trial.age_min}–{trial.age_max}
                    </span>
                    <span>⚧ {trial.gender}</span>
                  </div>
                  <Link
                    href={`/trials/${trial.id}`}
                    className="mt-auto flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20"
                  >
                    APPLY NOW →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ━━━━ DIVIDER ━━━━ */}
        <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

        {/* ━━━━ SECTION 2: GLOBAL DATABASE MATCHES ━━━━ */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              🌍 Globally Found Databases
            </h2>
          </div>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            All expected trial databases are listed below. Matched trials are
            shown directly under each database.
          </p>

          {!hasQuestionnaire ? (
            <div className="rounded-xl border border-slate-200 bg-white py-12 text-center dark:border-slate-700 dark:bg-slate-800">
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📝</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Complete your profile to discover global trials
              </h3>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Answer a short questionnaire and we&apos;ll search 20+ databases
                worldwide.
              </p>
              <Link
                href="/onboarding/questionnaire"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
              >
                Start Questionnaire →
              </Link>
            </div>
          ) : stillSearching || loadingExternal ? (
            <div className="rounded-xl border border-slate-200 bg-white py-12 flex justify-center dark:border-slate-700 dark:bg-slate-800">
              <TrialGoLoader size="md" label="Searching global databases" />
            </div>
          ) : databaseSummary.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🌐</div>
              Database summary not available yet.
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                Try refreshing after search completes.
              </p>
              <Link
                href="/onboarding/questionnaire"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-400"
              >
                Edit Search →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {externalMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                      {m.source_database}
                    </span>
                  </div>
                  <h3 className="text-[0.95rem] font-semibold leading-relaxed text-slate-900 dark:text-white">
                    {m.trial_name.substring(0, 100)}
                    {m.trial_name.length > 100 ? "..." : ""}
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 text-[0.78rem] text-slate-500 dark:text-slate-400">
                    <span>🦠 {m.condition}</span>
                    <span>📍 {m.location || "Global"}</span>
                    <span>🔬 {m.phase}</span>
                    <span>📋 {m.status}</span>
                  </div>
                  {m.match_reason && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                      ✅ {m.match_reason}
                    </div>
                  )}
                  {m.concerns && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs leading-relaxed text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
                      ⚠️ Note: {m.concerns}
                    </div>
                  )}
                  {m.eligibility_summary && (
                    <p className="text-[0.78rem] leading-relaxed text-slate-500 dark:text-slate-400">
                      {m.eligibility_summary.substring(0, 150)}
                      {m.eligibility_summary.length > 150 ? "..." : ""}
                    </p>
                  )}
                  <a
                    href={m.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-[0.82rem] font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-400"
                  >
                    VISIT TRIAL WEBSITE ↗
                  </a>
                  <p className="-mt-1 text-center text-[0.65rem] text-slate-500 dark:text-slate-400">
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
