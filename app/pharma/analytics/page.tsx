"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressCounter } from "@/components/ui/animated-counter";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Plus, FlaskConical, Users, AlertTriangle, Target, BarChart2 } from "lucide-react";
import { toast } from "sonner";

interface TrialSummary { id: number; title: string; disease: string; stage: string }
interface Analytics {
  enrolled: number; patients_needed: number; enrollment_rate_pct: number;
  risk_distribution: Record<string, number>; total_anomalies: number;
}

const RISK_PIE_COLORS: Record<string, string> = { RED: "#EF4444", AMBER: "#F59E0B", GREEN: "#10B981" };

const chartConfig = {
  RED: { label: "High Risk", color: "#EF4444" },
  AMBER: { label: "Medium Risk", color: "#F59E0B" },
  GREEN: { label: "Low Risk", color: "#10B981" },
};

export default function PharmaAnalyticsPage() {
  const [trials, setTrials] = useState<TrialSummary[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingTrials, setLoadingTrials] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;
    setLoadingTrials(true);
    fetch("/api/pharma/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTrials(list);
        const q = Number(new URLSearchParams(window.location.search).get("trial"));
        setSelectedTrialId(list.find((t: TrialSummary) => t.id === q)?.id ?? list[0]?.id ?? null);
      })
      .catch(() => toast.error("Failed to load trials"))
      .finally(() => setLoadingTrials(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token || !selectedTrialId) return;
    setLoadingAnalytics(true);
    fetch(`/api/pharma/analytics/${selectedTrialId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setAnalytics(d))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoadingAnalytics(false));
  }, [selectedTrialId]);

  const selected = trials.find((t) => t.id === selectedTrialId) ?? null;
  const { enrolled = 0, patients_needed = 0, enrollment_rate_pct = 0, risk_distribution = {}, total_anomalies = 0 } = analytics || {};

  // Format data for charts
  const pieData = Object.entries(risk_distribution).map(([tier, count]) => ({ name: tier, value: count }));
  const barData = Object.entries(risk_distribution).map(([tier, count]) => ({ tier, count }));

  const loading = loadingTrials || loadingAnalytics;

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selected ? `Trial #${selected.id} — ${selected.title} · ${selected.disease}` : "Select a trial to view analytics"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTrialId ?? ""}
              onChange={(e) => setSelectedTrialId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
            >
              {trials.map((t) => <option key={t.id} value={t.id}>#{t.id} {t.title}</option>)}
            </select>
            <Link
              href="/pharma/create-trial"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> New Trial
            </Link>
          </div>
        </div>

        {loading ? (
          /* Skeleton loading */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <StatCard key={i} title="" value={0} loading={true} />
            ))}
          </div>
        ) : trials.length === 0 ? (
          <EmptyState
            icon={BarChart2}
            title="No Trials Yet"
            description="Create your first trial and let 12 AI agents handle candidate discovery."
            action={
              <Link href="/pharma/create-trial" className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Create Trial
              </Link>
            }
          />
        ) : !analytics ? (
          <EmptyState icon={BarChart2} title="No Data Yet" description="Analytics will appear once patients are enrolled in this trial." />
        ) : (
          <>
            {/* KPI stat cards with animated counters */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                title="Enrolled"
                value={enrolled}
                icon={Users}
                trend={{ value: enrollment_rate_pct, direction: "up" }}
                badge={{ text: "Active", variant: "success" }}
                animate
              />
              <StatCard title="Target Patients" value={patients_needed} icon={Target} animate />
              <StatCard
                title="Remaining"
                value={Math.max(0, patients_needed - enrolled)}
                icon={FlaskConical}
                badge={patients_needed - enrolled === 0 ? { text: "Full", variant: "success" } : undefined}
                animate
              />
              <StatCard
                title="Anomalies"
                value={total_anomalies}
                icon={AlertTriangle}
                badge={total_anomalies > 0 ? { text: "Review", variant: "danger" } : { text: "Clear", variant: "success" }}
                animate
              />
            </div>

            {/* Enrollment Progress with ProgressRing + ProgressCounter */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">Enrollment Progress</h2>
              <div className="flex flex-wrap items-center gap-8">
                <ProgressRing value={Math.min(enrollment_rate_pct, 100)} size={96} strokeWidth={8} />
                <div className="flex-1 min-w-64">
                  <ProgressCounter
                    current={enrolled}
                    total={patients_needed}
                    label="Patients Enrolled"
                    showPercentage
                  />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Risk Distribution Bar Chart */}
              {pieData.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Dropout Risk Distribution</h2>
                  <ChartContainer config={chartConfig} className="h-52 w-full">
                    <BarChart data={barData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                      <XAxis dataKey="tier" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                      <YAxis tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {barData.map((entry) => (
                          <Cell key={entry.tier} fill={RISK_PIE_COLORS[entry.tier] || "#94A3B8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {/* Risk Pie Chart */}
              {pieData.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Risk Breakdown</h2>
                  <ChartContainer config={chartConfig} className="h-52 w-full">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={RISK_PIE_COLORS[entry.name] || "#94A3B8"} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Create New Trial", href: "/pharma/create-trial", icon: Plus },
                  { label: "View Candidates", href: `/pharma/candidates/${selectedTrialId}`, icon: Users },
                  { label: "Global Discovery", href: `/pharma/discovery/${selectedTrialId}`, icon: BarChart2 },
                  { label: "Manage Consent PDF", href: `/consent?trial=${selectedTrialId}`, icon: FlaskConical },
                  { label: "Export FHIR Bundle", href: `/pharma/fhir/${selectedTrialId}`, icon: Target },
                ].map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
