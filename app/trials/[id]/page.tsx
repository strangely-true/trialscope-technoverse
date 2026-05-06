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

  function extractConsentFields(text: string) {
    const fields = Array.from(
      new Set(
        (text.match(/\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g) ?? [])
          .map((match) => match.replace(/^\[\[|\]\]$|^\{\{|\}\}$/g, "").trim())
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
      <div className="hero-bg min-h-screen">
        <nav
          style={{
            background: "rgba(5,20,36,0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--glass-border)",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Link href="/trials" style={{ color: "var(--primary)" }}>
            ← Back to Trials
          </Link>
        </nav>
        <div
          className="py-20 text-center"
          style={{ color: "var(--foreground-muted)" }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
          Loading trial details...
        </div>
      </div>
    )
  }

  if (error || !trial) {
    return (
      <div className="hero-bg min-h-screen">
        <nav
          style={{
            background: "rgba(5,20,36,0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--glass-border)",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Link href="/trials" style={{ color: "var(--primary)" }}>
            ← Back to Trials
          </Link>
        </nav>
        <div
          className="py-20 text-center"
          style={{ color: "var(--foreground-error)" }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          {error || "Trial not found"}
        </div>
      </div>
    )
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
          href="/trials"
          style={{ color: "var(--primary)", textDecoration: "none" }}
        >
          ← Back to Trials
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
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Trial Header */}
        <div className="glass mb-8 p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="badge-cyan">Stage {trial.stage}</span>
            <span className="badge-green">Recruiting</span>
          </div>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            {trial.title}
          </h1>
          <p style={{ color: "var(--foreground-muted)", fontSize: "1.05rem" }}>
            {trial.description}
          </p>

          {/* Key Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--foreground-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                🎯 DISEASE FOCUS
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                {trial.disease}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "var(--foreground-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                🎂 AGE RANGE
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                {trial.age_min}–{trial.age_max} years
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "var(--foreground-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                👥 PATIENTS NEEDED
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                {trial.patients_needed}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "var(--foreground-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                ⚧ GENDER
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                }}
              >
                {trial.gender === "any" ? "Any" : trial.gender}
              </div>
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {trial.inclusion_criteria && (
            <div className="glass p-6">
              <h3
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                ✅ Inclusion Criteria
              </h3>
              <p
                style={{ color: "var(--foreground-muted)", fontSize: "0.9rem" }}
              >
                {trial.inclusion_criteria}
              </p>
            </div>
          )}
          {trial.exclusion_criteria && (
            <div className="glass p-6">
              <h3
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                ❌ Exclusion Criteria
              </h3>
              <p
                style={{ color: "var(--foreground-muted)", fontSize: "0.9rem" }}
              >
                {trial.exclusion_criteria}
              </p>
            </div>
          )}
        </div>

        {consentTemplate && (
          <div className="glass p-8" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start", marginBottom: "1rem" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "Space Grotesk",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                  }}
                >
                  Consent Agreement
                </h2>
                <p style={{ color: "var(--foreground-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
                  Review the template, fill the blanks, then sign before submitting your application.
                </p>
              </div>
              {consentSubmission ? (
                <span className="badge-green">Signed</span>
              ) : (
                <span className="badge-amber">Pending signature</span>
              )}
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "1rem",
                whiteSpace: "pre-wrap",
                color: "var(--foreground-muted)",
                marginBottom: "1rem",
                lineHeight: 1.65,
              }}
            >
              {consentTemplate.consent_template_text}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {consentFields.map((field) => (
                <div key={field}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>
                    {field.replace(/_/g, " ")}
                  </label>
                  <input
                    name={field}
                    value={consentInputs[field] || ""}
                    onChange={handleConsentFieldChange}
                    className="input-dark"
                    style={{ width: "100%" }}
                    placeholder={field.replace(/_/g, " ")}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", color: "var(--foreground-muted)" }}>
                <input
                  type="checkbox"
                  checked={consentAcknowledged}
                  onChange={(e) => setConsentAcknowledged(e.target.checked)}
                />
                I confirm I have reviewed the consent text above.
              </label>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>
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
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "var(--green-alert)",
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  marginTop: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {consentMessage}
                {consentSubmission?.signed_pdf_url ? (
                  <div style={{ marginTop: "0.5rem" }}>
                    <a href={consentSubmission.signed_pdf_url} target="_blank" rel="noreferrer" className="text-cyan">
                      Open signed PDF
                    </a>
                  </div>
                ) : null}
              </div>
            )}

            {consentError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--red-alert)",
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  marginTop: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {consentError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={submitConsent}
                disabled={consentSubmitting || !!consentSubmission}
                className="btn-primary"
                style={{ padding: "0.8rem 1.1rem" }}
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
              <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "rgba(34, 197, 94, 0.05)",
                border: "1px dashed var(--green-alert)",
                borderRadius: "var(--radius)"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎉</div>
                <h3 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                  You have already applied for this trial
                </h3>
                <p style={{ color: "var(--foreground-muted)", fontSize: "0.95rem" }}>
                  Your application is currently being reviewed by the clinical trial coordinator.
                  You can track the status in your dashboard.
                </p>
                <Link href="/dashboard" className="btn-primary" style={{ marginTop: "1.5rem", display: "inline-block", padding: "0.6rem 1.5rem" }}>
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
                  <div
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "var(--green-alert)",
                      padding: "1rem",
                      borderRadius: "var(--radius)",
                      marginBottom: "1rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmitApplication}>
                  <div style={{ display: "grid", gap: "1.5rem" }}>
                    {formSchema.fields.map((field) => (
                      <div key={field.name}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.5rem",
                            fontWeight: field.required ? 600 : 400,
                            fontSize: "0.9rem",
                          }}
                        >
                          {field.label}
                          {field.required && (
                            <span style={{ color: "var(--red-alert)" }}> *</span>
                          )}
                        </label>
                        {field.type === "select" && field.options ? (
                          <select
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleFormChange}
                            required={field.required}
                            className="input-dark"
                            style={{ width: "100%" }}
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
                            className="input-dark"
                            style={{
                              width: "100%",
                              minHeight: "100px",
                              fontFamily: "inherit",
                            }}
                            placeholder={field.label}
                          />
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleFormChange}
                            required={field.required}
                            className="input-dark"
                            style={{ width: "100%" }}
                            placeholder={field.label}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <input
                      type="checkbox"
                      name="consent_given"
                      id="consent_given"
                      checked={!!formData["consent_given"]}
                      onChange={(e) => setFormData(prev => ({ ...prev, consent_given: e.target.checked ? "true" : "" }))}
                      required
                      style={{ marginTop: "0.25rem", cursor: "pointer" }}
                    />
                    <label htmlFor="consent_given" style={{ fontSize: "0.9rem", color: "var(--foreground-muted)", cursor: "pointer" }}>
                      I consent to sharing my medical history and contact information with the clinical trial coordinators and pharmaceutical sponsors for the purpose of trial enrollment.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      marginTop: "2rem",
                      padding: "0.8rem",
                      fontSize: "1rem",
                      opacity: submitting ? 0.6 : 1,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
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
