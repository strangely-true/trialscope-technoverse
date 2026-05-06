"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
import { Plus, FlaskConical, Users, BarChart2, FileText } from "lucide-react";

interface Trial {
  id: number;
  title: string;
  disease: string;
  stage: string | null;
  status: string;
  patients_needed: number;
  created_at: string;
  description: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export default function PharmaTrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;
    fetch("/api/pharma/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTrials(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Clinical Trials</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage and monitor all your active trials
            </p>
          </div>
          <Link
            href="/pharma/create-trial"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Trial
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">
            Loading trials...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-800 dark:bg-red-900/10">
            {error}
          </div>
        ) : trials.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center dark:border-slate-700">
            <FlaskConical className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No Trials Yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create your first trial and let 12 AI agents handle candidate discovery
              </p>
            </div>
            <Link
              href="/pharma/create-trial"
              className="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Create First Trial
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {trials.map((trial) => (
              <div
                key={trial.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{trial.title}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[trial.status] || STATUS_STYLES.draft}`}>
                        {trial.status}
                      </span>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span>🦠 {trial.disease}{trial.stage ? ` · Stage ${trial.stage}` : ""}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {trial.patients_needed} patients needed
                      </span>
                      <span>📅 {new Date(trial.created_at).toLocaleDateString()}</span>
                    </div>
                    {trial.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-300">{trial.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Link
                      href={`/pharma/candidates/${trial.id}`}
                      className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Users className="h-4 w-4" /> Candidates
                    </Link>
                    <Link
                      href={`/pharma/analytics?trial=${trial.id}`}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <BarChart2 className="h-4 w-4" /> Analytics
                    </Link>
                    <Link
                      href={`/consent?trial=${trial.id}`}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <FileText className="h-4 w-4" /> Consent
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
