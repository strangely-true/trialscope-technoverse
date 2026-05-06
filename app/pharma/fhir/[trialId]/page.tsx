"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FhirExportPage({ params }: { params: { trialId: string } }) {
  const trialId = params.trialId;
  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token || !trialId) { setLoading(false); return; }
    fetch(`/api/pharma/fhir/${trialId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((d) => setBundle(d))
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load FHIR bundle"))
      .finally(() => setLoading(false));
  }, [trialId]);

  const handleDownload = () => {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fhir-bundle-trial-${trialId}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("FHIR bundle downloaded");
  };

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">FHIR Export</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trial #{trialId} — HL7 FHIR R4 Bundle</p>
          </div>
          {bundle && (
            <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Download className="h-4 w-4" /> Download JSON
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">Generating FHIR bundle…</div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" /> {error}
          </div>
        ) : bundle ? (
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">fhir-bundle-trial-{trialId}.json</span>
              <button onClick={handleDownload} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Download</button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-4">
              <pre className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{JSON.stringify(bundle, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">No FHIR data for this trial</div>
        )}
      </div>
    </PageTransition>
  );
}
