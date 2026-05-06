"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Globe2, User, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Candidate { id: number; hash_id: string; match_score: number; country: string; status: string; approved: boolean }

export default function DiscoveryPage({ params }: { params: { trialId: string } }) {
  const trialId = params.trialId;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token || !trialId) { setLoading(false); return; }
    fetch(`/api/pharma/discovery/${trialId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setCandidates(Array.isArray(d) ? d : []))
      .catch(() => setError("Failed to load global candidates"))
      .finally(() => setLoading(false));
  }, [trialId]);

  const approve = (candidateId: number) => {
    const token = localStorage.getItem("trialgo_token");
    setApproving(candidateId);
    fetch(`/api/pharma/candidates/${candidateId}/approve`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Approval failed");
        setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, approved: true, status: "approved" } : c));
        toast.success("Candidate approved for trial");
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setApproving(null));
  };

  const reject = (candidateId: number) => {
    const token = localStorage.getItem("trialgo_token");
    fetch(`/api/pharma/candidates/${candidateId}/reject`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Rejection failed");
        setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, status: "rejected" } : c));
        toast.info("Candidate removed");
      })
      .catch((e) => toast.error(e.message));
  };

  const score = (c: Candidate) => Math.round(c.match_score * 100);

  return (
    <PageTransition>
      <div>
        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
            <Globe2 className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Global Discovery
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            AI-matched candidates from global patient pool for Trial #{trialId}
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">Finding global candidates…</div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <Globe2 className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            <p className="font-semibold text-slate-900 dark:text-white">No global candidates found yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">AI agents are scanning for matching patients worldwide</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">{candidates.length} candidates found</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400">Approved</span>
                <span className="ml-2 flex h-2 w-2 items-center justify-center rounded-full bg-amber-400" />
                <span className="text-slate-500 dark:text-slate-400">Pending</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm transition-all dark:bg-slate-800 ${
                    c.approved ? "border-emerald-200 dark:border-emerald-800" : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{c.hash_id.slice(0, 14)}…</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">🌍 {c.country || "Unknown"}</p>
                      </div>
                    </div>
                    {c.approved && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    )}
                  </div>

                  {/* Match score */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Star className="h-3 w-3" /> Match Score</span>
                      <span className={`font-bold ${score(c) >= 75 ? "text-emerald-600" : score(c) >= 50 ? "text-amber-600" : "text-red-600"}`}>{score(c)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full ${score(c) >= 75 ? "bg-emerald-500" : score(c) >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${score(c)}%` }}
                      />
                    </div>
                  </div>

                  <p className="mb-4 text-xs capitalize text-slate-500 dark:text-slate-400">Status: {c.status}</p>

                  {!c.approved && c.status !== "rejected" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(c.id)}
                        disabled={approving === c.id}
                        className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {approving === c.id ? "Approving…" : "Approve"}
                      </button>
                      <button
                        onClick={() => reject(c.id)}
                        className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-500 hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
