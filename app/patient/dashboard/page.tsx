"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Activity, CheckCircle2, AlertCircle, Clock, HeartPulse, ChevronRight } from "lucide-react";

interface Trial { id: number; title: string; disease: string; stage: string }
interface VerifiedPatient { id: number; trial_id: number; status: string; match_score: number; enrolled_at: string }
interface EnrolledTrial { patient: VerifiedPatient; trial: Trial }

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  enrolled: { variant: "default", label: "Enrolled" },
  in_progress: { variant: "default", label: "In Progress" },
  completed: { variant: "secondary", label: "Completed" },
  dropout_risk: { variant: "destructive", label: "At Risk" },
};

export default function PatientDashboardPage() {
  const [enrolledTrials, setEnrolledTrials] = useState<EnrolledTrial[]>([]);
  const [userMe, setUserMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/patient/my-trial-info", { headers: h }).then((r) => r.ok ? r.json() : []),
      fetch("/api/auth/me", { headers: h }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([trials, user]) => { setEnrolledTrials(Array.isArray(trials) ? trials : []); setUserMe(user); })
      .finally(() => setLoading(false));
  }, []);

  const active = enrolledTrials.filter((t) => t.patient.status === "enrolled" || t.patient.status === "in_progress");
  const completed = enrolledTrials.filter((t) => t.patient.status === "completed");
  const atRisk = enrolledTrials.filter((t) => t.patient.status === "dropout_risk");

  return (
    <PageTransition>
      <TooltipProvider>
        <div>
          {/* Welcome banner */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back, {userMe?.full_name?.split(" ")[0] || "Patient"}! 👋
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Here's an overview of your clinical trial participation.
              </p>
            </div>
            <Link
              href="/trials"
              className="flex items-center gap-2 rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" /> Browse Trials
            </Link>
          </div>

          {/* Stat Cards with animated counters */}
          {loading ? (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => <StatCard key={i} title="" value={0} loading />)}
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="Active Trials"
                value={active.length}
                icon={Activity}
                badge={active.length > 0 ? { text: "Participating", variant: "success" } : undefined}
                animate
              />
              <StatCard
                title="Completed"
                value={completed.length}
                icon={CheckCircle2}
                badge={completed.length > 0 ? { text: "Done", variant: "success" } : undefined}
                animate
              />
              <StatCard
                title="Needs Attention"
                value={atRisk.length}
                icon={AlertCircle}
                badge={atRisk.length > 0 ? { text: "At Risk", variant: "danger" } : { text: "All Clear", variant: "success" }}
                animate
              />
            </div>
          )}

          {/* Trial Cards */}
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Your Trials</h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <Skeleton className="mb-3 h-5 w-3/4 rounded" />
                  <Skeleton className="mb-2 h-3 w-1/2 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : enrolledTrials.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Trials Yet"
              description="Explore available trials and apply to participate. AI agents will match you to trials based on your health profile."
              action={
                <Link href="/trials" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  <BookOpen className="h-4 w-4" /> Browse Trials
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {enrolledTrials.map(({ patient, trial }) => {
                const statusCfg = STATUS_BADGE[patient.status] || STATUS_BADGE.enrolled;
                const weeks = Math.floor((Date.now() - new Date(patient.enrolled_at).getTime()) / (7 * 24 * 3600 * 1000));
                const matchPct = Math.round((patient.match_score || 0) * 100);

                return (
                  <Link key={`${trial.id}-${patient.id}`} href={`/trials/${trial.id}`}>
                    <div className="group h-full rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                      {/* Card header */}
                      <div className="border-b border-slate-100 dark:border-slate-700 p-5">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="line-clamp-2 font-bold leading-snug text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {trial.title}
                          </h3>
                          <Badge variant={statusCfg.variant} className="ml-2 shrink-0 text-xs">{statusCfg.label}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{trial.disease}{trial.stage ? ` · ${trial.stage}` : ""}</p>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Match score ring */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="shrink-0">
                                <ProgressRing value={matchPct} size={64} strokeWidth={5} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>AI Match Score: {matchPct}%</TooltipContent>
                          </Tooltip>

                          <div className="flex-1 space-y-2.5">
                            {/* Weeks progress */}
                            <div>
                              <div className="mb-1 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Enrolled</span>
                                <span>{weeks}w ago</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                                  style={{ width: `${Math.min((weeks / 12) * 100, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Symptom log shortcut */}
                            <Link
                              href={`/patient/symptom-log?trial=${trial.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              <HeartPulse className="h-3.5 w-3.5" /> Log this week's symptoms
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        <span>View Details</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </TooltipProvider>
    </PageTransition>
  );
}
