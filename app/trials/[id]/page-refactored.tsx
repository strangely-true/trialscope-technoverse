"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { PageTransition } from "@/components/ui/page-transition"
import { TrialGoLoaderFullPage } from "@/components/ui/trialgo-loader"
import {
  ArrowLeft,
  LogOut,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react"

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

interface HistoryFormSchema {
  fields: Array<{
    name: string
    type: string
    label: string
    required: boolean
    options?: string[]
  }>
  already_applied?: boolean
}

function extractConsentFields(text: string): string[] {
  return Array.from(
    new Set(
      (text.match(/\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g) ?? [])
        .map((match) => match.replace(/^\[\[|\]\]$|^\{\{|\}\}$/g, "").trim())
        .filter(Boolean)
    )
  )
}

function renderConsentText(
  template: string,
  values: Record<string, string>
): string {
  let text = template
  const fields = extractConsentFields(template)
  fields.forEach((field) => {
    const value = values[field] || `[${field}]`
    text = text
      .replace(new RegExp(`\\[\\[${field}\\]\\]`, "g"), value)
      .replace(new RegExp(`\\{\\{${field}\\}\\}`, "g"), value)
  })
  return text
}

export default function TrialDetailPage() {
  const router = useRouter()
  const params = useParams()
  const trialId = params.id as string

  const [trial, setTrial] = useState<Trial | null>(null)
  const [formSchema, setFormSchema] = useState<HistoryFormSchema | null>(null)
  const [consentTemplate, setConsentTemplate] =
    useState<ConsentTemplate | null>(null)
  const [consentSubmission, setConsentSubmission] =
    useState<ConsentSubmission | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [consentSubmitting, setConsentSubmitting] = useState(false)

  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [consentError, setConsentError] = useState<string>("")
  const [consentMessage, setConsentMessage] = useState<string>("")

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [consentInputs, setConsentInputs] = useState<Record<string, string>>({})
  const [consentTypedName, setConsentTypedName] = useState("")
  const [consentAcknowledged, setConsentAcknowledged] = useState(false)
  const [showConsentPreview, setShowConsentPreview] = useState(false)

  const consentFields = extractConsentFields(
    consentTemplate?.consent_template_text ?? ""
  )

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    if (!token) {
      router.push("/login")
      return
    }

    setLoading(true)
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`/api/trials/${trialId}`, { headers }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Trial fetch failed"))
      ),
      fetch(`/api/patient/history-form/${trialId}`, { headers }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Form fetch failed"))
      ),
      fetch(`/api/consent/template/${trialId}`, { headers }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Consent fetch failed"))
      ),
    ])
      .then(([trialData, schemaData, consentData]) => {
        setTrial(trialData)
        setFormSchema(schemaData)
        setConsentTemplate(consentData)

        // Pre-fill form
        if (schemaData.prefill) {
          const initialData: Record<string, string> = {}
          Object.entries(schemaData.prefill).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              initialData[key] = String(value)
            }
          })
          setFormData(initialData)

          const consentInitial: Record<string, string> = {}
          const consentFieldNames = extractConsentFields(
            consentData.consent_template_text
          )
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
        console.error("Fetch error:", err)
        setError("Failed to load trial details")
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
      setConsentError("Consent template not loaded")
      return
    }
    if (!consentAcknowledged || !consentTypedName.trim()) {
      setConsentError("Please confirm and type your name")
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

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || "Consent submit failed")

      setConsentSubmission(data)
      setConsentMessage("✅ Consent signed successfully!")
    } catch (err: any) {
      setConsentError(err.message || "Failed to submit consent")
    } finally {
      setConsentSubmitting(false)
    }
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consentSubmission) {
      setError("Please sign the consent first")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("trialgo_token")
      if (!token) throw new Error("Not authenticated")

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

      if (formData["diagnosed_conditions"]) {
        try {
          const parsed = JSON.parse(formData["diagnosed_conditions"])
          payload.diagnosed_conditions = Array.isArray(parsed)
            ? parsed
            : [parsed]
        } catch {
          payload.diagnosed_conditions = formData["diagnosed_conditions"]
            .split(",")
            .map((s) => s.trim())
        }
      }

      const response = await fetch("/api/patient/history/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Failed with status ${response.status}`)
      }

      setSuccess("✅ Application submitted! Redirecting to dashboard...")
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (err: any) {
      setError(err.message || "Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <TrialGoLoaderFullPage label="Loading trial details..." />
  }

  if (error || !trial) {
    return (
      <div className="bg-background min-h-screen dark:bg-slate-900">
        <header className="border-border-default dark:border-border-subtle bg-surface-primary/80 border-b backdrop-blur-xl dark:bg-slate-800/80">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/trials"
              className="text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Trials
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-danger-light/10 dark:bg-danger/10 border-danger-light dark:border-danger/30 rounded-lg border p-6">
            <div className="flex gap-4">
              <AlertCircle className="text-danger dark:text-danger-light mt-0.5 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="text-danger dark:text-danger-light mb-1 font-semibold">
                  Unable to load trial
                </h3>
                <p className="text-danger dark:text-danger-light text-sm">
                  {error || "Trial not found"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen dark:bg-slate-900">
      {/* Header */}
      <header className="border-border-default dark:border-border-subtle bg-surface-primary/80 sticky top-0 z-40 border-b backdrop-blur-xl dark:bg-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/trials"
            className="text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trials
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem("trialgo_token")
              localStorage.removeItem("trialgo_role")
              localStorage.removeItem("trialgo_user_id")
              localStorage.removeItem("trialgo_user")
              router.push("/login")
            }}
            className="text-danger dark:text-danger-light hover:bg-danger-light/10 dark:hover:bg-danger/10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTransition>
          {/* Trial Header */}
          <div className="border-border-default dark:border-border-subtle bg-surface-primary mb-8 rounded-xl border p-8 shadow-sm dark:bg-slate-800">
            <div className="mb-4 flex gap-3">
              <div className="border-info-light dark:border-info/30 bg-info-light dark:bg-info/10 text-info dark:text-info inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium">
                <span>Stage {trial.stage}</span>
              </div>
              <div className="border-success-light dark:border-success/30 bg-success-light dark:bg-success-dark/20 text-success dark:text-success inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Recruiting
              </div>
            </div>

            <h1 className="text-h1-dash text-text-primary dark:text-text-primary mb-3">
              {trial.title}
            </h1>
            <p className="text-body text-text-secondary dark:text-text-secondary mb-6">
              {trial.description}
            </p>

            {/* Key Details Grid */}
            <div className="border-border-default dark:border-border-subtle grid grid-cols-2 gap-4 border-t pt-6 md:grid-cols-4">
              <div>
                <div className="text-text-muted dark:text-text-muted mb-2 text-sm font-medium">
                  🎯 Disease Focus
                </div>
                <div className="text-text-primary dark:text-text-primary font-semibold">
                  {trial.disease}
                </div>
              </div>
              <div>
                <div className="text-text-muted dark:text-text-muted mb-2 text-sm font-medium">
                  🎂 Age Range
                </div>
                <div className="text-text-primary dark:text-text-primary font-semibold">
                  {trial.age_min}–{trial.age_max}
                </div>
              </div>
              <div>
                <div className="text-text-muted dark:text-text-muted mb-2 text-sm font-medium">
                  👥 Patients Needed
                </div>
                <div className="text-text-primary dark:text-text-primary font-semibold">
                  {trial.patients_needed}
                </div>
              </div>
              <div>
                <div className="text-text-muted dark:text-text-muted mb-2 text-sm font-medium">
                  ⚧ Gender
                </div>
                <div className="text-text-primary dark:text-text-primary font-semibold">
                  {trial.gender === "any" ? "Any" : trial.gender}
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Cards */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {trial.inclusion_criteria && (
              <div className="border-border-default dark:border-border-subtle bg-surface-primary rounded-xl border p-6 shadow-sm dark:bg-slate-800">
                <h3 className="text-text-primary dark:text-text-primary mb-3 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="text-success dark:text-success h-5 w-5" />
                  Inclusion Criteria
                </h3>
                <p className="text-body text-text-secondary dark:text-text-secondary">
                  {trial.inclusion_criteria}
                </p>
              </div>
            )}
            {trial.exclusion_criteria && (
              <div className="border-border-default dark:border-border-subtle bg-surface-primary rounded-xl border p-6 shadow-sm dark:bg-slate-800">
                <h3 className="text-text-primary dark:text-text-primary mb-3 flex items-center gap-2 font-semibold">
                  <AlertCircle className="text-warning dark:text-warning h-5 w-5" />
                  Exclusion Criteria
                </h3>
                <p className="text-body text-text-secondary dark:text-text-secondary">
                  {trial.exclusion_criteria}
                </p>
              </div>
            )}
          </div>

          {/* Consent Section */}
          {consentTemplate && (
            <div className="border-border-default dark:border-border-subtle bg-surface-primary mb-8 rounded-xl border p-8 shadow-sm dark:bg-slate-800">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-h2 text-text-primary dark:text-text-primary mb-1 flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Informed Consent
                  </h2>
                  <p className="text-text-secondary dark:text-text-secondary text-sm">
                    Please review and sign the consent form to proceed
                  </p>
                </div>
                {consentSubmission && (
                  <div className="bg-success-light dark:bg-success-dark/20 border-success-light dark:border-success/30 flex items-center gap-2 rounded-lg border px-3 py-2">
                    <CheckCircle2 className="text-success dark:text-success h-5 w-5" />
                    <span className="text-success dark:text-success text-sm font-medium">
                      Signed
                    </span>
                  </div>
                )}
              </div>

              {/* Consent Fields */}
              {!consentSubmission && (
                <div className="mb-6 space-y-4">
                  {consentFields.map((field) => (
                    <div key={field}>
                      <label className="text-text-primary dark:text-text-primary mb-2 block text-sm font-medium">
                        {field.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={consentInputs[field] || ""}
                        onChange={handleConsentFieldChange}
                        placeholder={`Enter ${field}`}
                        className="border-border-default dark:border-border-subtle bg-surface-secondary text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-secondary-600 w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 dark:bg-slate-700"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Consent Preview */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowConsentPreview(!showConsentPreview)}
                  className="border-border-default dark:border-border-subtle bg-surface-secondary hover:bg-surface-secondary/80 flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors dark:bg-slate-700 dark:hover:bg-slate-700/80"
                >
                  <span className="text-text-primary dark:text-text-primary font-medium">
                    {showConsentPreview ? "Hide" : "Show"} Consent Preview
                  </span>
                  {showConsentPreview ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {showConsentPreview && (
                  <div className="bg-surface-secondary border-border-default dark:border-border-subtle mt-4 max-h-64 overflow-y-auto rounded-lg border p-6 dark:bg-slate-700">
                    <div className="prose prose-sm dark:prose-invert text-text-secondary dark:text-text-secondary max-w-none text-sm whitespace-pre-wrap">
                      {renderConsentText(
                        consentTemplate.consent_template_text,
                        consentInputs
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Consent Actions */}
              {!consentSubmission ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acknowledge"
                      checked={consentAcknowledged}
                      onChange={(e) => setConsentAcknowledged(e.target.checked)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="acknowledge"
                      className="text-text-secondary dark:text-text-secondary text-sm"
                    >
                      I have read and understood the consent form and agree to
                      participate in this trial
                    </label>
                  </div>

                  <div>
                    <label className="text-text-primary dark:text-text-primary mb-2 block text-sm font-medium">
                      Type Your Full Name to Sign
                    </label>
                    <input
                      type="text"
                      value={consentTypedName}
                      onChange={(e) => setConsentTypedName(e.target.value)}
                      placeholder="Your full name"
                      className="border-border-default dark:border-border-subtle bg-surface-secondary text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-secondary-600 w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 dark:bg-slate-700"
                    />
                  </div>

                  {consentError && (
                    <div className="bg-danger-light/10 dark:bg-danger/10 border-danger-light dark:border-danger/30 rounded-lg border p-4">
                      <p className="text-danger dark:text-danger-light text-sm">
                        {consentError}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={submitConsent}
                    disabled={consentSubmitting}
                    className="bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 w-full rounded-lg px-6 py-3 font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {consentSubmitting ? "Signing..." : "Sign Consent"}
                  </button>
                </div>
              ) : (
                <div className="bg-success-light/10 dark:bg-success/10 border-success-light dark:border-success/30 rounded-lg border p-4">
                  <p className="text-success dark:text-success flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    {consentMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Medical History Form */}
          {formSchema && (
            <div className="border-border-default dark:border-border-subtle bg-surface-primary rounded-xl border p-8 shadow-sm dark:bg-slate-800">
              <h2 className="text-h2 text-text-primary dark:text-text-primary mb-6">
                Medical History
              </h2>

              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {formSchema.fields.map((field) => (
                    <div key={field.name}>
                      <label className="text-text-primary dark:text-text-primary mb-2 block text-sm font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-danger">*</span>
                        )}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleFormChange}
                          required={field.required}
                          rows={4}
                          className="border-border-default dark:border-border-subtle bg-surface-secondary text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-secondary-600 w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 dark:bg-slate-700"
                        />
                      ) : field.type === "select" && field.options ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleFormChange}
                          required={field.required}
                          className="border-border-default dark:border-border-subtle bg-surface-secondary text-text-primary dark:text-text-primary focus:ring-secondary-600 w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 dark:bg-slate-700"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleFormChange}
                          required={field.required}
                          className="border-border-default dark:border-border-subtle bg-surface-secondary text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-secondary-600 w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 dark:bg-slate-700"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-danger-light/10 dark:bg-danger/10 border-danger-light dark:border-danger/30 rounded-lg border p-4">
                    <p className="text-danger dark:text-danger-light text-sm">
                      {error}
                    </p>
                  </div>
                )}

                {success && (
                  <div className="bg-success-light/10 dark:bg-success/10 border-success-light dark:border-success/30 rounded-lg border p-4">
                    <p className="text-success dark:text-success flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      {success}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !consentSubmission}
                  className="bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 w-full rounded-lg px-6 py-3 font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>
          )}
        </PageTransition>
      </main>
    </div>
  )
}
