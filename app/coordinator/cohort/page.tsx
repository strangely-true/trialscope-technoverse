"use client";

import { useEffect, useRef, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { StatCard } from "@/components/ui/stat-card";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Users, Activity, Target, CheckCircle2, Phone } from "lucide-react";
import { toast } from "sonner";

interface Trial { id: number; title: string; disease: string; stage: string }
interface Patient {
  id: number; hash_id: string; match_score: number; status: string;
  enrolled_at: string; risk_tier: string; dropout_score: number | null; active_alerts: number;
}
interface Alert {
  id: number; patient_id: number; biometric_type: string; patient_value: number;
  cohort_mean: number; z_score: number; alert_tier: string; created_at: string; resolved: boolean;
}
interface Stats { total_enrolled: number; avg_match_score: number; risk_distribution: Record<string, number> }

const RISK_COLORS: Record<string, string> = { RED: "#EF4444", AMBER: "#F59E0B", GREEN: "#10B981" };

const chartConfig = {
  count: { label: "Patients", color: "#2563eb" }, // blue-600 equivalent
};

export default function CoordinatorCohortPage() {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selTrial, setSelTrial] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("trialgo_token") : null;
  const hdrs = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    fetch("/api/trials", { headers: hdrs })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTrials(list);
        const q = Number(new URLSearchParams(window.location.search).get("trial"));
        setSelTrial(list.find((t: Trial) => t.id === q)?.id ?? list[0]?.id ?? null);
      })
      .catch(() => setTrials([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token || !selTrial) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/monitoring/cohort/${selTrial}`, { headers: hdrs }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/coordinator/anomalies/${selTrial}`, { headers: hdrs }).then((r) => r.ok ? r.json() : []),
      fetch(`/api/coordinator/cohort/${selTrial}`, { headers: hdrs }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([s, a, p]) => { setStats(s); setAlerts(Array.isArray(a) ? a : []); setPatients(Array.isArray(p) ? p : []); })
      .finally(() => setLoading(false));

    // WebSocket
    wsRef.current?.close();
    setWsConnected(false);
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost:8000";
      const ws = new WebSocket(`${proto}//${host}/ws/dashboard/${selTrial}`);
      wsRef.current = ws;
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.alerts) setAlerts((prev) => {
            const ids = new Set(prev.map((a) => a.id));
            const fresh = d.alerts.filter((a: Alert) => !ids.has(a.id));
            return fresh.length ? [...fresh, ...prev].slice(0, 50) : prev;
          });
        } catch {}
      };
    } catch {}
    return () => { wsRef.current?.close(); setWsConnected(false); };
  }, [selTrial]);

  const reconnect = () => {
    if (selTrial) {
      setSelTrial(null);
      setTimeout(() => setSelTrial(selTrial), 100);
    }
  };

  const resolveAlert = (id: number) => {
    fetch(`/api/monitoring/anomalies/${id}/resolve`, { method: "POST", headers: hdrs })
      .then((r) => { if (r.ok) setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true } : a)); });
  };

  const callPatient = (pid: number) => {
    fetch(`/api/monitoring/call/patient/${pid}`, { method: "POST", headers: hdrs })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || "Call failed");
        toast.success("Calling your number — pick up to connect to patient");
      })
      .catch((e) => toast.error(e.message));
  };

  const trial = trials.find((t) => t.id === selTrial);
  const unresolved = alerts.filter((a) => !a.resolved);
  const rd = stats?.risk_distribution ?? {};
  const barData = Object.entries(rd).map(([tier, count]) => ({ tier, count }));

  const riskBadge = (tier: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      RED: "destructive", AMBER: "outline", GREEN: "secondary",
    };
    return <Badge variant={variants[tier] || "default"}>{tier}</Badge>;
  };

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cohort Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {trial ? `Trial #${trial.id} — ${trial.title}` : "Select a trial"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LiveIndicator connected={wsConnected} onReconnect={reconnect} />
            {trials.length > 0 && (
              <select
                value={selTrial ?? ""}
                onChange={(e) => setSelTrial(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
              >
                {trials.map((t) => <option key={t.id} value={t.id}>#{t.id} {t.title.slice(0, 30)}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* KPI Stat Cards with animated counters */}
        {loading ? (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <StatCard key={i} title="" value={0} loading />)}
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard title="Enrolled" value={stats?.total_enrolled ?? 0} icon={Users} animate badge={{ text: "Active", variant: "success" }} />
            <StatCard title="Red Risk" value={rd.RED ?? 0} icon={AlertTriangle} badge={(rd.RED ?? 0) > 0 ? { text: "Urgent", variant: "danger" } : { text: "Clear", variant: "success" }} animate />
            <StatCard title="Open Alerts" value={unresolved.length} icon={Activity} badge={unresolved.length > 0 ? { text: "Action Needed", variant: "warning" } : { text: "All Clear", variant: "success" }} animate />
            <StatCard title="Avg Match" value={`${Math.round((stats?.avg_match_score ?? 0) * 100)}%`} icon={Target} animate={false} />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="patients" className="flex-1">Patients ({patients.length})</TabsTrigger>
            <TabsTrigger value="anomalies" className="flex-1">
              Anomalies {unresolved.length > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unresolved.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Match score ring */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-5 font-semibold text-slate-900 dark:text-white">Average Match Score</h3>
                <div className="flex items-center gap-6">
                  <ProgressRing value={Math.round((stats?.avg_match_score ?? 0) * 100)} size={100} strokeWidth={8} />
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Patients matched above 75%</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{patients.filter(p => p.match_score >= 0.75).length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">of {patients.length} total enrolled</p>
                  </div>
                </div>
              </div>

              {/* Risk distribution bar chart */}
              {barData.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Risk Distribution</h3>
                  <ChartContainer config={chartConfig} className="h-48 w-full">
                    <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                      <XAxis dataKey="tier" tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                      <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {barData.map((entry) => (
                          <Cell key={entry.tier} fill={RISK_COLORS[entry.tier] || "#94A3B8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Recent Alerts</h3>
                  {unresolved.length === 0 ? (
                    <div className="flex h-32 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" /> No active anomalies
                    </div>
                  ) : unresolved.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{a.biometric_type}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Patient #{a.patient_id} · z={a.z_score.toFixed(1)}</p>
                      </div>
                      {riskBadge(a.alert_tier)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* PATIENTS */}
          <TabsContent value="patients">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : patients.length === 0 ? (
              <EmptyState icon={Users} title="No Enrolled Patients" description="Patients will appear here once they are matched and enrolled in this trial." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Hash</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Active Alerts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.hash_id.slice(0, 14)}…</TableCell>
                        <TableCell>{riskBadge(p.risk_tier)}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{p.match_score ? `${Math.round(p.match_score * 100)}%` : "—"}</TableCell>
                        <TableCell>
                          {p.active_alerts > 0
                            ? <span className="font-bold text-red-600 dark:text-red-400">{p.active_alerts}</span>
                            : <span className="text-slate-500 dark:text-slate-400">0</span>}
                        </TableCell>
                        <TableCell className="capitalize text-slate-500 dark:text-slate-400">{p.status}</TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400">{new Date(p.enrolled_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => callPatient(p.id)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-900/20"
                          >
                            <Phone className="h-3 w-3" /> Call
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ANOMALIES */}
          <TabsContent value="anomalies">
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : alerts.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No Anomaly Alerts" description="All patient biometrics are within normal range for this trial." />
            ) : (
              <div className="space-y-3">
                {alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${a.resolved ? "opacity-50" : ""} ${
                        a.alert_tier === "RED" ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                        : a.alert_tier === "AMBER" ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{a.biometric_type}</span>
                          {riskBadge(a.alert_tier)}
                          {a.resolved && <Badge variant="secondary">✓ Resolved</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Patient #{a.patient_id} · Value: {a.patient_value?.toFixed(1)} · Mean: {a.cohort_mean?.toFixed(1)} · Z-score: {a.z_score?.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    {!a.resolved && (
                      <button
                        onClick={() => resolveAlert(a.id)}
                        className="ml-4 shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
