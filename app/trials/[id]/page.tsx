"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

interface Trial {
  id: number
  title: string
  disease: string
  stage: string
  age_min: number
  age_max: number
  gender: string
  location_preference: string
  exclusion_criteria: string
  inclusion_criteria: string
  patients_needed: number
  description: string
  status: string
  created_at: string
  consent_summary?: string[]
}

interface ConsentTemplate {
  trial_id: number
  title: string
  consent_template_text: string
  consent_template_name?: string | null
  consent_template_url?: string | null
  consent_version: number
  source: string
}

interface ConsentSubmission {
  id: number
  trial_id: number
  hash_id: string
  typed_name: string
  acknowledged: boolean
  signed_pdf_url?: string | null
  signed_at: string
}

interface HistoryFormField {
  name: string
  type: string
  label: string
  required: boolean
  options?: string[]
}

interface HistoryFormSchema {
  fields: HistoryFormField[]
  already_applied?: boolean
}

export default function TrialDetailPage() {
  const router = useRouter()
  const params = useParams()
  const trialId = params.id as string

  const [trial, setTrial] = useState<Trial | null>(null)
  const [formSchema, setFormSchema] = useState<HistoryFormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [consentTemplate, setConsentTemplate] = useState<ConsentTemplate | null>(null)
  const [consentInputs, setConsentInputs] = useState<Record<string, string>>({})
  const [consentTypedName, setConsentTypedName] = useState("")
  const [consentAcknowledged, setConsentAcknowledged] = useState(false)
  const [consentSubmitting, setConsentSubmitting] = useState(false)
  const [consentError, setConsentError] = useState<string>("")
  const [consentMessage, setConsentMessage] = useState<string>("")
  const [consentSubmission, setConsentSubmission] = useState<ConsentSubmission | null>(null)

  const consentFields = extractConsentFields(consentTemplate?.consent_template_text ?? "")

  function renderConsentPreview(text: string, values: Record<string, string>) {
    return (
      text || ""
    ).replace(/\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g, (_m, g1, g2) => {
      const raw = (g1 || g2 || "").trim()
      const key = raw.toLowerCase().replace(/\s+/g, "_")
      return values[key] ?? ""
    })
  }

  const openSignedConsentPdf = async () => {
    if (!consentSubmission) {
      setConsentError("Sign the consent first to view the signed PDF")
      return
    }

    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setConsentError("")
    try {
      const response = await fetch(
        `/api/consent/download/${trialId}/${consentSubmission.hash_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        throw new Error(`Signed PDF download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const preview = window.open(objectUrl, "_blank", "noopener,noreferrer")

      if (!preview) {
        const anchor = document.createElement("a")
        anchor.href = objectUrl
        anchor.download = `consent-${trialId}-${consentSubmission.hash_id}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }

      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000)
    } catch (err: any) {
      setConsentError(err.message || "Could not open signed PDF")
    }
  }

  function extractConsentFields(text: string) {
    const fields = Array.from(
      new Set(
        (text.match(/\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g) ?? [])
          .map((match) =>
            match
              .replace(/^\[\[|\]\]$|^\{\{|\}\}$/g, "")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "_")
          )
          .filter(Boolean)
      )
    )
    return fields
  }

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setLoading(true)
    setError("")

    const headers = { Authorization: `Bearer ${token}` }

    // Fetch trial details
    Promise.all([
      fetch(`/api/trials/${trialId}`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Trial fetch failed: ${r.status}`)
        return r.json()
      }),
      fetch(`/api/patient/history-form/${trialId}`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Form schema fetch failed: ${r.status}`)
        return r.json()
      }),
      fetch(`/api/consent/template/${trialId}`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Consent template fetch failed: ${r.status}`)
        return r.json()
      }),
    ])
      .then(([trialData, schemaData, consentData]) => {
        setTrial(trialData)
        setFormSchema(schemaData)
        setConsentTemplate(consentData)

        // Pre-fill form if data exists
        if (schemaData.prefill) {
          const initialData: Record<string, string> = {}
          Object.entries(schemaData.prefill).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              initialData[key] = String(value)
            }
          })
          setFormData((prev) => ({ ...prev, ...initialData }))
          const consentInitial: Record<string, string> = {}
          const consentFieldNames = extractConsentFields(consentData.consent_template_text)
          consentFieldNames.forEach((field) => {
            if (field === "participant_name" && initialData.full_name) {
              consentInitial[field] = initialData.full_name
            } else if (field === "city" && initialData.city) {
              consentInitial[field] = initialData.city
            } else if (field === "country" && initialData.country) {
              consentInitial[field] = initialData.country
            }
          })
          setConsentInputs(consentInitial)
        }

        setError("")
      })
      .catch((err) => {
        console.error("Trial detail fetch error:", err)
        setError("Failed to load trial details")
        setTrial(null)
      })
      .finally(() => setLoading(false))
  }, [router, trialId])

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleConsentFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setConsentInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const submitConsent = async () => {
    if (!consentTemplate) {
      setConsentError("Consent template is not loaded yet")
      return
    }
    if (!consentAcknowledged || !consentTypedName.trim()) {
      setConsentError("Please confirm the checkbox and type your name")
      return
    }

    const missing = consentFields.filter(
      (field) => !String(consentInputs[field] ?? "").trim()
    )
    if (missing.length > 0) {
      setConsentError(`Please complete: ${missing.join(", ")}`)
      return
    }

    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setConsentSubmitting(true)
    setConsentError("")
    setConsentMessage("")

    try {
      const response = await fetch("/api/consent/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trial_id: parseInt(trialId),
          typed_name: consentTypedName,
          acknowledged: consentAcknowledged,
          field_values: consentInputs,
        }),
      })

      let responseText = ""
      try {
        responseText = await response.text()
      } catch (_err) {
        responseText = ""
      }

      if (!response.ok) {
        throw new Error(responseText || `Consent submit failed: ${response.status}`)
      }

      const data = JSON.parse(responseText) as ConsentSubmission
      setConsentSubmission(data)
      setConsentMessage("Consent signed and stored successfully.")
      setFormData((prev) => ({
        ...prev,
        full_name: consentTypedName,
        city: consentInputs.city ?? prev.city ?? "",
        country: consentInputs.country ?? prev.country ?? "",
      }))
    } catch (err: any) {
      setConsentError(err.message || "Failed to submit consent")
    } finally {
      setConsentSubmitting(false)
    }
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consentSubmission) {
      setError("Please sign the consent before submitting the application")
      return
    }
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("trialgo_token")
      if (!token) throw new Error("Not authenticated")

      // Build payload matching backend.models.schemas.PatientHistorySubmit
      const payload: any = {
        trial_id: parseInt(trialId),
        full_name: formData["full_name"] || "",
        age: formData["age"] ? parseInt(formData["age"]) : 0,
        gender: formData["gender"] || "",
        city: formData["city"] || "",
        country: formData["country"] || "",
        diagnosed_conditions: [],
        symptom_description: formData["symptom_description"] || "",
        duration: formData["duration"] || "",
        current_medications: formData["current_medications"] || undefined,
        previous_treatments: formData["previous_treatments"] || undefined,
        doctor_contact: formData["doctor_contact"] || undefined,
        consent_given: true,
      }

      // If diagnosed_conditions was submitted as a comma-separated string, convert to array
      if (formData["diagnosed_conditions"]) {
        const raw = formData["diagnosed_conditions"]
        // If it's already a JSON array string, try to parse
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) payload.diagnosed_conditions = parsed
          else payload.diagnosed_conditions = [raw]
        } catch (err) {
          // Not JSON, split by comma or use single value
          if (raw.includes(","))
            payload.diagnosed_conditions = raw.split(",").map((s) => s.trim())
          else payload.diagnosed_conditions = [raw]
        }
      }

      // Log payload and headers so we can inspect what the client actually sends
      console.debug("Submitting patient history payload:", payload)
      console.debug("Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      })

      const response = await fetch("/api/patient/history/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      // Log response status and body for easier debugging in DevTools
      let respText = null
      try {
        respText = await response.text()
        console.debug("Response status:", response.status, "body:", respText)
      } catch (err) {
        console.debug("Response parse error:", err)
      }

      if (!response.ok) {
        // include server body if present in the error message
        throw new Error(
          `Submission failed: ${response.status} - ${respText || "<no-body>"}`
        )
      }

      setSuccess(
        "Application submitted successfully! You will be contacted soon."
      )
      setFormData({})
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      console.error("Application submit error:", err)
      setError(err.message || "Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <nav className="flex items-center gap-4 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
          <Link href="/trials" className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            ← Back to Trials
          </Link>
        </nav>
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
          Loading trial details...
        </div>
      </div>
    )
  }

  if (error || !trial) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <nav className="flex items-center gap-4 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
          <Link href="/trials" className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            ← Back to Trials
          </Link>
        </nav>
        <div className="py-20 text-center text-red-500 dark:text-red-400">
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          {error || "Trial not found"}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
        <Link href="/trials" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
          ← Back to Trials
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
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Trial Header */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Stage {trial.stage}</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Recruiting</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            {trial.title}
          </h1>
          <p className="text-[1.05rem] text-slate-500 dark:text-slate-400">
            {trial.description}
          </p>

          {/* Key Details Grid */}
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-4 dark:border-slate-700">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                🎯 DISEASE FOCUS
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-white">
                {trial.disease}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                🎂 AGE RANGE
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-white">
                {trial.age_min}–{trial.age_max} years
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                👥 PATIENTS NEEDED
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-white">
                {trial.patients_needed}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ⚧ GENDER
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-white">
                {trial.gender === "any" ? "Any" : trial.gender}
              </div>
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {trial.inclusion_criteria && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                ✅ Inclusion Criteria
              </h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {trial.inclusion_criteria}
              </p>
            </div>
          )}
          {trial.exclusion_criteria && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                ❌ Exclusion Criteria
              </h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {trial.exclusion_criteria}
              </p>
            </div>
          )}
        </div>

        {consentTemplate && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Consent Agreement
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Review the template, fill the blanks, then sign before submitting your application.
                </p>
              </div>
              {consentSubmission ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Signed</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending signature</span>
              )}
            </div>

            <div className="mb-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              {renderConsentPreview(consentTemplate.consent_template_text, consentInputs)}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {consentFields.map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {field.replace(/_/g, " ")}
                  </label>
                  <input
                    name={field}
                    value={consentInputs[field] || ""}
                    onChange={handleConsentFieldChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                    placeholder={field.replace(/_/g, " ")}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={consentAcknowledged}
                  onChange={(e) => setConsentAcknowledged(e.target.checked)}
                />
                I confirm I have reviewed the consent text above.
              </label>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Typed signature
              </label>
              <input
                value={consentTypedName}
                onChange={(e) => setConsentTypedName(e.target.value)}
                className="input-dark"
                style={{ width: "100%" }}
                placeholder="Type your full name"
              />
            </div>

            {consentMessage && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {consentMessage}
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openSignedConsentPdf}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    View signed PDF
                  </button>
                  {consentSubmission?.signed_pdf_url ? (
                    <a
                      href={consentSubmission.signed_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                      Open stored PDF
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {consentError && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {consentError}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={submitConsent}
                disabled={consentSubmitting || !!consentSubmission}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {consentSubmitting ? "Signing..." : consentSubmission ? "Consent Signed" : "Sign Consent"}
              </button>
            </div>
          </div>
        )}

        {/* Application Form */}
        {formSchema && formSchema.fields && formSchema.fields.length > 0 && (
          <div className="glass p-8">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                📝 Medical History Form
              </h2>
              {formSchema.already_applied && (
                <span className="badge-green" style={{ fontSize: "0.9rem", padding: "0.4rem 0.8rem" }}>
                  ✓ Already Applied
                </span>
              )}
            </div>

            {formSchema.already_applied ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500 bg-emerald-50/30 p-10 dark:bg-emerald-900/10">
                <div className="mb-4 text-4xl">🎉</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                  You have already applied for this trial
                </h3>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Your application is currently being reviewed by the clinical trial coordinator.
                  You can track the status in your dashboard.
                </p>
                <Link href="/dashboard" className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700">
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--red-alert)",
                      padding: "1rem",
                      borderRadius: "var(--radius)",
                      marginBottom: "1rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmitApplication}>
                  <div className="grid gap-6">
                    {formSchema.fields.map((field) => (
                      <div key={field.name}>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500"> *</span>
                          )}
                        </label>
                        {field.type === "select" && field.options ? (
                          <select
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleFormChange}
                            required={field.required}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleFormChange}
                            required={field.required}
                            className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            placeholder={field.label}
                          />
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleFormChange}
                            required={field.required}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            placeholder={field.label}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="consent_given"
                      id="consent_given"
                      checked={!!formData["consent_given"]}
                      onChange={(e) => setFormData(prev => ({ ...prev, consent_given: e.target.checked ? "true" : "" }))}
                      required
                      className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="consent_given" className="cursor-pointer text-sm text-slate-500 dark:text-slate-400">
                      I consent to sharing my medical history and contact information with the clinical trial coordinators and pharmaceutical sponsors for the purpose of trial enrollment.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Application →"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
