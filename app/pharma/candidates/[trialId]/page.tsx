"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useParams, usePathname } from "next/navigation"

interface TrialSummary {
  id: number
  title: string
  disease: string
  stage: string
}

interface CandidateRow {
  id: number | string
  candidate_id: number | string
  match_score: number
  match_tier: string
  status: string
  created_at: string
  candidate?: {
    source?: string
    user_handle?: string
    extracted_conditions?: string[]
    extracted_symptoms?: string[]
    confidence_score?: number
  }
}

interface SocialLead {
  id: string
  platform: string
  username: string
  profile_url?: string
  post_text?: string
  post_url?: string
  confidence: number
  confidence_tier: "HIGH" | "MEDIUM"
  relation: "self" | "family_member" | "unknown" | string
  reasoning?: string
  dm_sent: boolean
  discovered_at?: string
}

interface SocialLeadResponse {
  total_leads: number
  high_confidence: number
  medium_confidence: number
  leads: SocialLead[]
}

interface IdentityReveal {
  real_name?: string
  email?: string
  phone?: string
  consent_subject_id?: string
}

export default function PharmaCandidatesPage() {
  const params = useParams()
  const pathname = usePathname()
  // params may be undefined on initial client render; fall back to pathname
  const router = useRouter()
  const rawTrialId = useMemo(() => {
    const paramValue = Array.isArray(params?.trialId)
      ? params?.trialId?.[0]
      : params?.trialId
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
  const [trial, setTrial] = useState<TrialSummary | null>(null)
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [revealState, setRevealState] = useState<
    Record<number | string, IdentityReveal>
  >({})
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<number | string | null>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"candidates" | "leads">(
    "candidates"
  )
  const [socialLeads, setSocialLeads] = useState<SocialLead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsError, setLeadsError] = useState("")
  const [leadStats, setLeadStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
  })
  const [leadActionId, setLeadActionId] = useState<string | null>(null)

  const [revealError, setRevealError] = useState<
    Record<number | string, string>
  >({})

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    // guard against invalid trialId (e.g. undefined/empty string -> NaN)
    if (trialId === null) {
      console.warn("Invalid trialId, aborting candidates load:", rawTrialId)
      setError("Invalid trial selected")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    Promise.all([
      fetch(`/api/trials/${trialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (!response.ok)
          throw new Error(`Trial fetch failed: ${response.status}`)
        return response.json()
      }),
      fetch(`/api/pharma/candidates/${trialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (!response.ok)
          throw new Error(`Candidates fetch failed: ${response.status}`)
        return response.json()
      }),
    ])
      .then(([trialData, candidateData]) => {
        setTrial(trialData)
        setCandidates(Array.isArray(candidateData) ? candidateData : [])
      })
      .catch((err) => {
        console.error("Candidate page load error:", err)
        setError(err.message || "Failed to load candidates for this trial")
        setTrial(null)
        setCandidates([])
      })
      .finally(() => setLoading(false))
  }, [router, trialId, rawTrialId])

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token || trialId === null || activeTab !== "leads") {
      return
    }

    setLeadsLoading(true)
    setLeadsError("")

    fetch(`/api/pharma/trials/${trialId}/social-leads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Social leads fetch failed: ${response.status}`)
        }
        return response.json() as Promise<SocialLeadResponse>
      })
      .then((payload) => {
        const leads = Array.isArray(payload.leads) ? payload.leads : []
        setSocialLeads(leads)
        setLeadStats({
          total: payload.total_leads ?? leads.length,
          high: payload.high_confidence ?? 0,
          medium: payload.medium_confidence ?? 0,
        })
      })
      .catch((err) => {
        console.error("Social leads fetch error:", err)
        setLeadsError("Failed to load social media leads")
        setSocialLeads([])
        setLeadStats({ total: 0, high: 0, medium: 0 })
      })
      .finally(() => setLeadsLoading(false))
  }, [trialId, activeTab])

  const sendLeadDM = async (lead: SocialLead) => {
    if (trialId === null) {
      return
    }
    const confirmed = window.confirm(
      `Send a recruitment message to ${lead.username} on ${lead.platform}? They will receive a polite message about the trial.`
    )
    if (!confirmed) {
      return
    }

    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setLeadActionId(lead.id)
    try {
      const response = await fetch(
        `/api/pharma/trials/${trialId}/send-dm/${lead.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) {
        throw new Error(`Send DM failed: ${response.status}`)
      }
      const payload = (await response.json()) as { success?: boolean }
      if (payload.success) {
        setSocialLeads((current) =>
          current.map((item) =>
            item.id === lead.id ? { ...item, dm_sent: true } : item
          )
        )
      } else {
        setLeadsError("DM failed to send for this lead")
      }
    } catch (err) {
      console.error("Send DM error:", err)
      setLeadsError("DM request failed")
    } finally {
      setLeadActionId(null)
    }
  }

  const rejectLead = async (lead: SocialLead) => {
    if (trialId === null) {
      return
    }
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setLeadActionId(lead.id)
    try {
      const response = await fetch(
        `/api/pharma/trials/${trialId}/reject-lead/${lead.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) {
        throw new Error(`Reject lead failed: ${response.status}`)
      }

      setSocialLeads((current) => current.filter((item) => item.id !== lead.id))
      setLeadStats((current) => {
        const nextTotal = Math.max(0, current.total - 1)
        const nextHigh =
          lead.confidence >= 0.75 ? Math.max(0, current.high - 1) : current.high
        const nextMedium =
          lead.confidence >= 0.75
            ? current.medium
            : Math.max(0, current.medium - 1)
        return { total: nextTotal, high: nextHigh, medium: nextMedium }
      })
    } catch (err) {
      console.error("Reject lead error:", err)
      setLeadsError("Could not reject this lead")
    } finally {
      setLeadActionId(null)
    }
  }

  const revealIdentity = async (candidateId: number | string) => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setSubmittingId(candidateId)
    setRevealError((prev) => ({ ...prev, [candidateId]: "" }))
    try {
      const response = await fetch(
        `/api/pharma/request-identity/${candidateId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) {
        throw new Error(`Identity reveal failed: ${response.status}`)
      }
      const data = (await response.json()) as IdentityReveal
      setRevealState((current) => ({ ...current, [candidateId]: data }))
    } catch (err) {
      console.error("Identity reveal error:", err)
      setRevealError((prev) => ({
        ...prev,
        [candidateId]: "Could not reveal identity for this candidate.",
      }))
    } finally {
      setSubmittingId(null)
    }
  }

  const downloadConsentPdf = async (subjectId?: string) => {
    if (!subjectId || trialId === null) return
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
        <Link href="/pharma/analytics" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          🧬 Trial<span className="text-blue-600 dark:text-blue-400">Go</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            / Candidates
          </span>
        </Link>
        <Link
          href="/pharma/analytics"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-400"
        >
          Back to Analytics
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Matched Candidates
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {trial
                ? `${trial.title} · ${trial.disease} · Stage ${trial.stage}`
                : trialId
                  ? `Trial #${trialId}`
                  : "Trial"}
            </p>
          </div>
          {trialId ? (
            <div className="flex gap-3">
              <Link
                href={`/consent?trial=${trialId}`}
                className="flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
              >
                Upload Consent PDF
              </Link>
              <Link
                href={`/pharma/fhir/${trialId}`}
                className="flex items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white dark:hover:border-blue-400 dark:hover:text-blue-400"
              >
                Export FHIR Bundle
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setActiveTab("candidates")}
            className={activeTab === "candidates" ? "rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700" : "rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white"}
          >
            Enrolled & Matched Candidates
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={activeTab === "leads" ? "rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700" : "rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-white"}
          >
            Social Media Leads
          </button>
        </div>

        {activeTab === "leads" ? (
          <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Potential Patients Found on Social Media
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                These people posted about {trial?.disease || "this condition"}{" "}
                on Reddit or Twitter. AI flagged likely patient context. You
                decide whether to reach out.
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {leadStats.total} potential leads found — {leadStats.high} HIGH
                confidence, {leadStats.medium} MEDIUM confidence
              </p>
            </div>

            {leadsLoading ? (
              <div className="py-14 text-center text-slate-500 dark:text-slate-400">
                Loading social leads...
              </div>
            ) : leadsError ? (
              <div className="py-14 text-center text-red-500 dark:text-red-400">
                {leadsError}
              </div>
            ) : socialLeads.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white py-14 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No pending social leads yet for this trial.
              </div>
            ) : (
              socialLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {lead.platform === "reddit" ? "Reddit" : "Twitter/X"}
                    </span>
                    <span
                      className={
                        lead.confidence >= 0.75
                          ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }
                    >
                      {lead.confidence >= 0.75
                        ? "HIGH CONFIDENCE"
                        : "MEDIUM CONFIDENCE"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {lead.relation === "self"
                        ? "Self"
                        : lead.relation === "family_member"
                          ? "Family Member"
                          : "Unknown"}
                    </span>
                  </div>

                  <div className="mb-2 text-sm">
                    <a
                      href={lead.profile_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 dark:text-blue-400"
                    >
                      {lead.platform === "reddit"
                        ? `u/${lead.username}`
                        : `@${lead.username}`}
                    </a>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    AI reasoning: {lead.reasoning || "No reasoning"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Post preview: {(lead.post_text || "").slice(0, 150)}
                    {(lead.post_text || "").length > 150 ? "..." : ""}
                  </p>
                  {lead.post_url ? (
                    <a
                      href={lead.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400"
                    >
                      View Original Post
                    </a>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => sendLeadDM(lead)}
                      disabled={leadActionId === lead.id || lead.dm_sent}
                      className={lead.dm_sent ? "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-white" : "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"}
                    >
                      {lead.dm_sent
                        ? "DM SENT"
                        : leadActionId === lead.id
                          ? "Sending..."
                          : "SEND DM"}
                    </button>
                    <button
                      onClick={() => rejectLead(lead)}
                      disabled={leadActionId === lead.id || lead.dm_sent}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              TrialGo only shows you potential leads. You are responsible for
              outreach content and compliance with platform terms.
            </div>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
            Loading candidate list...
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 dark:text-red-400">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
            {error}
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-20 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>👥</div>
            <p>No matched candidates yet for this trial.</p>
            <Link
              href={`/pharma/fhir/${trialId}`}
              className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
            >
              Review Export Snapshot
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {candidates.map((candidate) => {
              const reveal = revealState[candidate.candidate_id]
              const tierClass =
                candidate.match_tier === "RED"
                  ? "badge-red"
                  : candidate.match_tier === "AMBER"
                    ? "badge-amber"
                    : "badge-green"
              return (
                <div key={candidate.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          Candidate #{candidate.candidate_id}
                        </span>
                        <span className={tierClass}>
                          {candidate.match_tier}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{candidate.status}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Match Score {Math.round(candidate.match_score * 100)}%
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Created{" "}
                        {new Date(candidate.created_at).toLocaleString()}
                      </p>
                      {candidate.candidate?.user_handle ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Handle: {candidate.candidate.user_handle}
                        </p>
                      ) : null}
                      {Array.isArray(candidate.candidate?.extracted_symptoms) &&
                        candidate.candidate.extracted_symptoms.length > 0 ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Symptoms:{" "}
                          {candidate.candidate.extracted_symptoms.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => revealIdentity(candidate.candidate_id)}
                        disabled={submittingId === candidate.candidate_id}
                        className="flex min-w-[180px] items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                      >
                        {submittingId === candidate.candidate_id
                          ? "Revealing..."
                          : "Reveal Identity"}
                      </button>
                      {revealError[candidate.candidate_id] && (
                        <span className="text-sm text-red-500 dark:text-red-400">
                          {revealError[candidate.candidate_id]}
                        </span>
                      )}
                    </div>
                  </div>

                  {reveal ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                      <div className="mb-2 font-semibold text-blue-600 dark:text-blue-400">
                        Identity revealed
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <span className="text-(--foreground-subtle)">
                            Name:
                          </span>{" "}
                          {reveal.real_name || "N/A"}
                        </div>
                        <div>
                          <span className="text-(--foreground-subtle)">
                            Email:
                          </span>{" "}
                          {reveal.email || "N/A"}
                        </div>
                        <div>
                          <span className="text-(--foreground-subtle)">
                            Phone:
                          </span>{" "}
                          {reveal.phone || "N/A"}
                        </div>
                      </div>
                      {reveal.consent_subject_id ? (
                        <div style={{ marginTop: "1rem" }}>
                          <button
                            onClick={() => downloadConsentPdf(reveal.consent_subject_id)}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                          >
                            Download Signed Consent PDF
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
