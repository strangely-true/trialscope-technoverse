"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { CheckCircle2, AlertCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const SYMPTOMS = [
  { key: "fatigue", label: "Fatigue Level", emoji: "😴" },
  { key: "pain", label: "Pain Level", emoji: "🤕" },
  { key: "nausea", label: "Nausea Level", emoji: "🤢" },
  { key: "headache", label: "Headache Level", emoji: "🤯" },
] as const;

function SymptomLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialId = searchParams.get("trial") || "";

  const [symptoms, setSymptoms] = useState({ fatigue: "0", pain: "0", nausea: "0", headache: "0", mood: "normal", notes: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialId) { toast.error("No trial specified — open this from your trial page"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("trialgo_token");
      const res = await fetch("/api/patient/symptom-log", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trial_id: parseInt(trialId), symptoms_json: symptoms }),
      });
      if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      setSuccess(true);
      toast.success("Symptom log recorded!");
      setSymptoms({ fatigue: "0", pain: "0", nausea: "0", headache: "0", mood: "normal", notes: "" });
      setTimeout(() => router.push("/patient/dashboard"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to record symptom log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center md:text-left">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-900 md:justify-start dark:text-white">
            <ClipboardList className="h-8 w-8 text-blue-600 dark:text-blue-400" /> Weekly Symptom Log
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Record how you&apos;re feeling this week during your trial</p>
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Symptom log recorded! Redirecting to dashboard…</span>
          </div>
        )}

        {!trialId && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" /> Please open this page from your trial card to log symptoms.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* Sliders */}
          {SYMPTOMS.map(({ key, label, emoji }) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{emoji} {label}</label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{symptoms[key]} / 10</span>
              </div>
              <input
                type="range" min="0" max="10"
                value={symptoms[key]}
                onChange={(e) => setSymptoms((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full cursor-pointer accent-blue-600"
              />
              <div className="mt-1 flex justify-between text-xs font-medium text-slate-400">
                <span>None</span><span>Severe</span>
              </div>
            </div>
          ))}

          {/* Mood */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">😊 Overall Mood</label>
            <select
              value={symptoms.mood}
              onChange={(e) => setSymptoms((p) => ({ ...p, mood: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
            >
              <option value="great">😄 Great</option>
              <option value="normal">🙂 Normal</option>
              <option value="stressed">😰 Stressed</option>
              <option value="anxious">😟 Anxious</option>
              <option value="depressed">😔 Depressed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">📌 Additional Notes</label>
            <textarea
              value={symptoms.notes}
              onChange={(e) => setSymptoms((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Any other symptoms or observations this week..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !trialId}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit Symptom Log →"}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}

export default function SymptomLogPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">Loading…</div>}>
      <SymptomLogContent />
    </Suspense>
  );
}
