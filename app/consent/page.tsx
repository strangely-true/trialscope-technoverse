"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TrialSummary { id: number; title: string; disease: string; stage: string }

export default function ConsentPage() {
  const [trials, setTrials] = useState<TrialSummary[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;
    fetch("/api/pharma/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTrials(list);
        const q = Number(new URLSearchParams(window.location.search).get("trial"));
        setSelectedTrialId(list.find((t: TrialSummary) => t.id === q)?.id ?? list[0]?.id ?? null);
      })
      .catch(() => toast.error("Failed to load trials"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (useDefault = false) => {
    const token = localStorage.getItem("trialgo_token");
    if (!token || !selectedTrialId || (!file && !useDefault)) {
      toast.error("Select a trial and PDF file, or use the built-in template");
      return;
    }
    setUploading(true);
    setSummary("");
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      else formData.append("use_default_template", "true");

      const res = await fetch(`/api/consent/upload?trial_id=${selectedTrialId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      setSummary(data.simplified_summary || (useDefault ? "Built-in template activated" : "Consent PDF uploaded successfully"));
      toast.success("Consent uploaded!");
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
            <FileText className="h-6 w-6 text-[var(--secondary-600)]" /> Consent Management
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Upload consent PDFs for AI summarisation and patient distribution</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-[var(--text-muted)]">Loading trials...</div>
        ) : trials.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)]">No trials found. Create a trial first.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 shadow-sm dark:bg-slate-800">
            <div className="space-y-5">
              {/* Trial selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Select Trial</label>
                <select
                  value={selectedTrialId ?? ""}
                  onChange={(e) => setSelectedTrialId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--secondary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-700"
                >
                  {trials.map((t) => <option key={t.id} value={t.id}>#{t.id} {t.title} · {t.disease}</option>)}
                </select>
              </div>

              {/* File upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Consent PDF</label>
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-default)] p-8 text-center transition-colors hover:border-[var(--secondary-600)] hover:bg-[var(--secondary-50)] dark:hover:bg-slate-700/50">
                  <label className="cursor-pointer">
                    <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      {file ? file.name : "Click to upload a PDF"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Leave empty to use the built-in template</p>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

              {/* Summary result */}
              {summary && (
                <div className="flex items-start gap-3 rounded-xl border border-[var(--success)] bg-[var(--success-light)] p-4 dark:bg-[var(--success)]/10">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)]" />
                  <p className="text-sm text-[var(--success-dark)] dark:text-[var(--success)]">{summary}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpload(false)}
                  disabled={uploading || !selectedTrialId}
                  className="flex items-center gap-2 rounded-lg bg-[var(--secondary-600)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--secondary-700)] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload & Summarize"}
                </button>
                <button
                  onClick={() => handleUpload(true)}
                  disabled={uploading || !selectedTrialId}
                  className="rounded-lg border border-[var(--border-default)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--secondary-600)] hover:text-[var(--secondary-600)] disabled:opacity-50 dark:hover:bg-slate-700"
                >
                  Use Built-in Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
