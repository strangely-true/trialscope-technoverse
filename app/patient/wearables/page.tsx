"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader";
import { Activity, Heart, Thermometer, Droplets, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EnrolledTrial {
  patient: { id: number; trial_id: number };
  trial: { id: number; title: string; disease: string };
}

export default function WearablePingPage() {
  const router = useRouter();
  const [trials, setTrials] = useState<EnrolledTrial[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    heart_rate: 72,
    temperature: 36.6,
    glucose: 110,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    steps: 5000,
  });

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("/api/patient/my-trial-info", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setTrials(data);
        if (data.length > 0) {
          setSelectedTrialId(data[0].trial.id);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrialId) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("trialgo_token");
      const res = await fetch("/api/patient/wearable-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trial_id: selectedTrialId,
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to submit data");

      if (data.anomalies_detected > 0) {
        toast.warning(`${data.anomalies_detected} potential anomalies detected. Your coordinator has been notified.`);
      } else {
        toast.success("Wearable data synced successfully! All vitals within normal range.");
      }
      
      // Reset form or redirect
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <TrialGoLoaderInline />
      </div>
    );
  }

  if (trials.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Activity className="mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Active Trials</h2>
        <p className="mt-2 text-slate-500">You must be enrolled in a trial to sync wearable data.</p>
        <Button className="mt-6" onClick={() => router.push("/trials")}>Browse Trials</Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wearable Data Sync</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Submit your latest vitals. Our AI will analyze them for any irregularities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trial Selection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Select Clinical Trial
            </label>
            <select
              value={selectedTrialId || ""}
              onChange={(e) => setSelectedTrialId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {trials.map((t) => (
                <option key={t.trial.id} value={t.trial.id}>
                  {t.trial.title}
                </option>
              ))}
            </select>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Heart Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <Heart className="h-5 w-5" />
                </div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Heart Rate</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={form.heart_rate}
                  onChange={(e) => setForm({ ...form, heart_rate: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xl font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-sm font-medium text-slate-500">bpm</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Thermometer className="h-5 w-5" />
                </div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Temperature</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xl font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-sm font-medium text-slate-500">°C</span>
              </div>
            </div>

            {/* Glucose */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Droplets className="h-5 w-5" />
                </div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Glucose</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={form.glucose}
                  onChange={(e) => setForm({ ...form, glucose: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xl font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-sm font-medium text-slate-500">mg/dL</span>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Activity className="h-5 w-5" />
                </div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Blood Pressure</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.blood_pressure_systolic}
                  onChange={(e) => setForm({ ...form, blood_pressure_systolic: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-lg font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-slate-400">/</span>
                <input
                  type="number"
                  value={form.blood_pressure_diastolic}
                  onChange={(e) => setForm({ ...form, blood_pressure_diastolic: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-lg font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500">mmHg</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-14 text-lg font-bold shadow-lg"
            size="lg"
          >
            {submitting ? (
              <>
                <TrialGoLoaderInline className="mr-2" /> Syncing with AI Core...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-5 w-5" /> Sync Wearable Data
              </>
            )}
          </Button>

          <div className="rounded-xl border border-blue-50 bg-blue-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                Data submitted here is processed by our AI Anomaly Detection agent. If any vitals fall outside your specific trial's baseline, an alert will be sent to your Trial Coordinator immediately for review.
              </p>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
