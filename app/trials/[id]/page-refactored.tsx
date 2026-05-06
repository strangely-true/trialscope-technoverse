"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { TrialGoLoaderFullPage } from "@/components/ui/trialgo-loader";
import {
  ArrowLeft,
  LogOut,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

interface Trial {
  id: number;
  title: string;
  disease: string;
  stage: string;
  age_min: number;
  age_max: number;
  gender: string;
  location_preference: string;
  exclusion_criteria: string;
  inclusion_criteria: string;
  patients_needed: number;
  description: string;
  status: string;
  created_at: string;
  consent_summary?: string[];
}

interface ConsentTemplate {
  trial_id: number;
  title: string;
  consent_template_text: string;
  consent_template_name?: string | null;
  consent_template_url?: string | null;
  consent_version: number;
  source: string;
}

interface ConsentSubmission {
  id: number;
  trial_id: number;
  hash_id: string;
  typed_name: string;
  acknowledged: boolean;
  signed_pdf_url?: string | null;
  signed_at: string;
}

interface HistoryFormSchema {
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;
  already_applied?: boolean;
}

function extractConsentFields(text: string): string[] {
  return Array.from(
    new Set(
      (text.match(/\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g) ?? [])
        .map((match) => match.replace(/^\[\[|\]\]$|^\{\{|\}\}$/g, "").trim())
        .filter(Boolean)
    )
  );
}

function renderConsentText(
  template: string,
  values: Record<string, string>
): string {
  let text = template;
  const fields = extractConsentFields(template);
  fields.forEach((field) => {
    const value = values[field] || `[${field}]`;
    text = text
      .replace(new RegExp(`\\[\\[${field}\\]\\]`, "g"), value)
      .replace(new RegExp(`\\{\\{${field}\\}\\}`, "g"), value);
  });
  return text;
}

export default function TrialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const trialId = params.id as string;

  const [trial, setTrial] = useState<Trial | null>(null);
  const [formSchema, setFormSchema] = useState<HistoryFormSchema | null>(null);
  const [consentTemplate, setConsentTemplate] = useState<ConsentTemplate | null>(null);
  const [consentSubmission, setConsentSubmission] = useState<ConsentSubmission | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consentSubmitting, setConsentSubmitting] = useState(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [consentError, setConsentError] = useState<string>("");
  const [consentMessage, setConsentMessage] = useState<string>("");

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [consentInputs, setConsentInputs] = useState<Record<string, string>>({});
  const [consentTypedName, setConsentTypedName] = useState("");
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [showConsentPreview, setShowConsentPreview] = useState(false);

  const consentFields = extractConsentFields(consentTemplate?.consent_template_text ?? "");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

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
        setTrial(trialData);
        setFormSchema(schemaData);
        setConsentTemplate(consentData);

        // Pre-fill form
        if (schemaData.prefill) {
          const initialData: Record<string, string> = {};
          Object.entries(schemaData.prefill).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              initialData[key] = String(value);
            }
          });
          setFormData(initialData);

          const consentInitial: Record<string, string> = {};
          const consentFieldNames = extractConsentFields(consentData.consent_template_text);
          consentFieldNames.forEach((field) => {
            if (field === "participant_name" && initialData.full_name) {
              consentInitial[field] = initialData.full_name;
            } else if (field === "city" && initialData.city) {
              consentInitial[field] = initialData.city;
            } else if (field === "country" && initialData.country) {
              consentInitial[field] = initialData.country;
            }
          });
          setConsentInputs(consentInitial);
        }

        setError("");
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load trial details");
      })
      .finally(() => setLoading(false));
  }, [router, trialId]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleConsentFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setConsentInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitConsent = async () => {
    if (!consentTemplate) {
      setConsentError("Consent template not loaded");
      return;
    }
    if (!consentAcknowledged || !consentTypedName.trim()) {
      setConsentError("Please confirm and type your name");
      return;
    }

    const missing = consentFields.filter(
      (field) => !String(consentInputs[field] ?? "").trim()
    );
    if (missing.length > 0) {
      setConsentError(`Please complete: ${missing.join(", ")}`);
      return;
    }

    const token = localStorage.getItem("trialgo_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setConsentSubmitting(true);
    setConsentError("");
    setConsentMessage("");

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
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Consent submit failed");

      setConsentSubmission(data);
      setConsentMessage("✅ Consent signed successfully!");
    } catch (err: any) {
      setConsentError(err.message || "Failed to submit consent");
    } finally {
      setConsentSubmitting(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentSubmission) {
      setError("Please sign the consent first");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("trialgo_token");
      if (!token) throw new Error("Not authenticated");

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
      };

      if (formData["diagnosed_conditions"]) {
        try {
          const parsed = JSON.parse(formData["diagnosed_conditions"]);
          payload.diagnosed_conditions = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          payload.diagnosed_conditions = formData["diagnosed_conditions"]
            .split(",")
            .map((s) => s.trim());
        }
      }

      const response = await fetch("/api/patient/history/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed with status ${response.status}`);
      }

      setSuccess("✅ Application submitted! Redirecting to dashboard...");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <TrialGoLoaderFullPage label="Loading trial details..." />;
  }

  if (error || !trial) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-900">
        <header className="border-b border-border-default dark:border-border-subtle bg-surface-primary/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
            <Link
              href="/trials"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Trials
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-lg bg-danger-light/10 dark:bg-danger/10 border border-danger-light dark:border-danger/30 p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-danger dark:text-danger-light flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-danger dark:text-danger-light mb-1">
                  Unable to load trial
                </h3>
                <p className="text-sm text-danger dark:text-danger-light">
                  {error || "Trial not found"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-default dark:border-border-subtle bg-surface-primary/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/trials"
            className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trials
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem("trialgo_token");
              localStorage.removeItem("trialgo_role");
              localStorage.removeItem("trialgo_user_id");
              localStorage.removeItem("trialgo_user");
              router.push("/login");
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-danger dark:text-danger-light hover:bg-danger-light/10 dark:hover:bg-danger/10 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageTransition>
          {/* Trial Header */}
          <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-8 shadow-sm mb-8">
            <div className="flex gap-3 mb-4">
              <div className="inline-flex items-center gap-2 rounded-lg border border-info-light dark:border-info/30 bg-info-light dark:bg-info/10 px-3 py-1.5 text-sm font-medium text-info dark:text-info">
                <span>Stage {trial.stage}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-success-light dark:border-success/30 bg-success-light dark:bg-success-dark/20 px-3 py-1.5 text-sm font-medium text-success dark:text-success">
                <CheckCircle2 className="w-4 h-4" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border-default dark:border-border-subtle">
              <div>
                <div className="text-sm font-medium text-text-muted dark:text-text-muted mb-2">
                  🎯 Disease Focus
                </div>
                <div className="font-semibold text-text-primary dark:text-text-primary">
                  {trial.disease}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-muted dark:text-text-muted mb-2">
                  🎂 Age Range
                </div>
                <div className="font-semibold text-text-primary dark:text-text-primary">
                  {trial.age_min}–{trial.age_max}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-muted dark:text-text-muted mb-2">
                  👥 Patients Needed
                </div>
                <div className="font-semibold text-text-primary dark:text-text-primary">
                  {trial.patients_needed}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-muted dark:text-text-muted mb-2">
                  ⚧ Gender
                </div>
                <div className="font-semibold text-text-primary dark:text-text-primary">
                  {trial.gender === "any" ? "Any" : trial.gender}
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {trial.inclusion_criteria && (
              <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-6 shadow-sm">
                <h3 className="font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success dark:text-success" />
                  Inclusion Criteria
                </h3>
                <p className="text-body text-text-secondary dark:text-text-secondary">
                  {trial.inclusion_criteria}
                </p>
              </div>
            )}
            {trial.exclusion_criteria && (
              <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-6 shadow-sm">
                <h3 className="font-semibold text-text-primary dark:text-text-primary mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning dark:text-warning" />
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
            <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-8 shadow-sm mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-h2 text-text-primary dark:text-text-primary flex items-center gap-2 mb-1">
                    <FileText className="w-6 h-6" />
                    Informed Consent
                  </h2>
                  <p className="text-sm text-text-secondary dark:text-text-secondary">
                    Please review and sign the consent form to proceed
                  </p>
                </div>
                {consentSubmission && (
                  <div className="flex items-center gap-2 rounded-lg bg-success-light dark:bg-success-dark/20 border border-success-light dark:border-success/30 px-3 py-2">
                    <CheckCircle2 className="w-5 h-5 text-success dark:text-success" />
                    <span className="text-sm font-medium text-success dark:text-success">
                      Signed
                    </span>
                  </div>
                )}
              </div>

              {/* Consent Fields */}
              {!consentSubmission && (
                <div className="space-y-4 mb-6">
                  {consentFields.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
                        {field.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={consentInputs[field] || ""}
                        onChange={handleConsentFieldChange}
                        placeholder={`Enter ${field}`}
                        className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-secondary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                  className="w-full flex items-center justify-between rounded-lg border border-border-default dark:border-border-subtle bg-surface-secondary dark:bg-slate-700 hover:bg-surface-secondary/80 dark:hover:bg-slate-700/80 p-4 text-left transition-colors"
                >
                  <span className="font-medium text-text-primary dark:text-text-primary">
                    {showConsentPreview ? "Hide" : "Show"} Consent Preview
                  </span>
                  {showConsentPreview ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {showConsentPreview && (
                  <div className="mt-4 rounded-lg bg-surface-secondary dark:bg-slate-700 p-6 border border-border-default dark:border-border-subtle max-h-64 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-text-secondary dark:text-text-secondary whitespace-pre-wrap">
                      {renderConsentText(consentTemplate.consent_template_text, consentInputs)}
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
                    <label htmlFor="acknowledge" className="text-sm text-text-secondary dark:text-text-secondary">
                      I have read and understood the consent form and agree to participate in this trial
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
                      Type Your Full Name to Sign
                    </label>
                    <input
                      type="text"
                      value={consentTypedName}
                      onChange={(e) => setConsentTypedName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-secondary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {consentError && (
                    <div className="rounded-lg bg-danger-light/10 dark:bg-danger/10 border border-danger-light dark:border-danger/30 p-4">
                      <p className="text-sm text-danger dark:text-danger-light">{consentError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={submitConsent}
                    disabled={consentSubmitting}
                    className="w-full px-6 py-3 rounded-lg bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {consentSubmitting ? "Signing..." : "Sign Consent"}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-success-light/10 dark:bg-success/10 border border-success-light dark:border-success/30 p-4">
                  <p className="text-sm text-success dark:text-success flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {consentMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Medical History Form */}
          {formSchema && (
            <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-8 shadow-sm">
              <h2 className="text-h2 text-text-primary dark:text-text-primary mb-6">
                Medical History
              </h2>

              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {formSchema.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
                        {field.label}
                        {field.required && <span className="text-danger">*</span>}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleFormChange}
                          required={field.required}
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-secondary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
                        />
                      ) : field.type === "select" && field.options ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleFormChange}
                          required={field.required}
                          className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-secondary dark:bg-slate-700 text-text-primary dark:text-text-primary focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                          className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-secondary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="rounded-lg bg-danger-light/10 dark:bg-danger/10 border border-danger-light dark:border-danger/30 p-4">
                    <p className="text-sm text-danger dark:text-danger-light">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-success-light/10 dark:bg-success/10 border border-success-light dark:border-success/30 p-4">
                    <p className="text-sm text-success dark:text-success flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {success}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !consentSubmission}
                  className="w-full px-6 py-3 rounded-lg bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>
          )}
        </PageTransition>
      </main>
    </div>
  );
}
