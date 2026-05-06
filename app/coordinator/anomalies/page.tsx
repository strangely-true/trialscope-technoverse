"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { AlertTriangle, CheckCircle2, Clock, Filter } from "lucide-react";

interface Alert {
  id: number;
  patient_id: number;
  biometric_type: string;
  patient_value: number;
  cohort_mean: number;
  z_score: number;
  alert_tier: string;
  created_at: string;
  resolved: boolean;
}

const TIER_STYLES: Record<string, { badge: string; border: string; row: string }> = {
  RED: {
    badge: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    row: "bg-red-50/50 dark:bg-red-900/10",
  },
  AMBER: {
    badge: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    row: "bg-amber-50/50 dark:bg-amber-900/10",
  },
  GREEN: {
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    row: "",
  },
};

export default function AnomaliesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [tierFilter, setTierFilter] = useState<"ALL" | "RED" | "AMBER" | "GREEN">("ALL");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;

    // Load from first available trial
    fetch("/api/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((trials) => {
        const trialId = Array.isArray(trials) && trials[0]?.id;
        if (!trialId) { setLoading(false); return; }
        return fetch(`/api/coordinator/anomalies/${trialId}`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((r) => r && r.ok ? r.json() : [])
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = (id: number) => {
    const token = localStorage.getItem("trialgo_token");
    fetch(`/api/monitoring/anomalies/${id}/resolve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => {
      if (r.ok) setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true } : a));
    });
  };

  const filtered = alerts.filter((a) => {
    const statusMatch = filter === "all" || (filter === "unresolved" ? !a.resolved : a.resolved);
    const tierMatch = tierFilter === "ALL" || a.alert_tier === tierFilter;
    return statusMatch && tierMatch;
  });

  return (
    <PageTransition>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Anomaly Monitor</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {alerts.filter((a) => !a.resolved).length} unresolved alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--text-muted)]" />
            {(["all", "unresolved", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[var(--secondary-600)] text-white"
                    : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--secondary-600)] hover:text-[var(--secondary-600)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tier filter */}
        <div className="mb-4 flex gap-2">
          {(["ALL", "RED", "AMBER", "GREEN"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                tierFilter === t
                  ? t === "ALL"
                    ? "bg-[var(--secondary-600)] text-white"
                    : t === "RED"
                    ? "bg-red-600 text-white"
                    : t === "AMBER"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500 text-white"
                  : "border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-[var(--text-muted)]">Loading anomalies...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[var(--border-default)]">
            <CheckCircle2 className="h-12 w-12 text-[var(--success)]" />
            <div className="text-center">
              <p className="font-semibold text-[var(--text-primary)]">All clear!</p>
              <p className="text-sm text-[var(--text-muted)]">No anomalies match your current filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert) => {
              const styles = TIER_STYLES[alert.alert_tier] || TIER_STYLES.GREEN;
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                    alert.resolved ? "opacity-50" : ""
                  } ${styles.border} ${styles.row}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`mt-0.5 h-5 w-5 ${alert.alert_tier === "RED" ? "text-red-500" : alert.alert_tier === "AMBER" ? "text-amber-500" : "text-emerald-500"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{alert.biometric_type}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
                          {alert.alert_tier}
                        </span>
                        {alert.resolved && (
                          <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                            <CheckCircle2 className="h-3 w-3" /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                        Patient #{alert.patient_id} · Value: {alert.patient_value?.toFixed(1)} · Mean: {alert.cohort_mean?.toFixed(1)} · Z-score: {alert.z_score?.toFixed(2)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="ml-4 shrink-0 rounded-lg border border-[var(--success)] bg-[var(--success-light)] px-3 py-1.5 text-xs font-semibold text-[var(--success)] transition-colors hover:bg-[var(--success)] hover:text-white dark:bg-[var(--success)]/10"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
