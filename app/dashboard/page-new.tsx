"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { TrialGoLoaderFullPage } from "@/components/ui/trialgo-loader";
import { AlertCircle, LogOut, BookOpen, Activity, Clock, CheckCircle2 } from "lucide-react";

interface Trial {
  id: number;
  title: string;
  disease: string;
  stage: string;
}

interface VerifiedPatient {
  id: number;
  trial_id: number;
  status: string;
  match_score: number;
  enrolled_at: string;
  consent_signed_at?: string;
}

interface EnrolledTrial {
  patient: VerifiedPatient;
  trial: Trial;
}

const STATUS_CONFIG = {
  enrolled: {
    label: "Enrolled",
    color: "bg-success-light dark:bg-success-dark/20",
    textColor: "text-success dark:text-success",
    borderColor: "border-success dark:border-success/30",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-info-light dark:bg-info/10",
    textColor: "text-info dark:text-info",
    borderColor: "border-info dark:border-info/30",
    icon: Activity,
  },
  completed: {
    label: "Completed",
    color: "bg-success-light dark:bg-success-dark/20",
    textColor: "text-success dark:text-success",
    borderColor: "border-success dark:border-success/30",
    icon: CheckCircle2,
  },
  dropout_risk: {
    label: "At Risk",
    color: "bg-warning-light dark:bg-warning-dark/20",
    textColor: "text-warning dark:text-warning",
    borderColor: "border-warning dark:border-warning/30",
    icon: AlertCircle,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [enrolledTrials, setEnrolledTrials] = useState<EnrolledTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userMe, setUserMe] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    const role = localStorage.getItem("trialgo_role");

    if (!token || role !== "patient") {
      router.push("/login");
      return;
    }

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch enrolled trials
    Promise.all([
      fetch("/api/patient/my-trial-info", { headers }).then((r) => r.ok ? r.json() : []),
      fetch("/api/auth/me", { headers }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([trials, user]) => {
        setEnrolledTrials(Array.isArray(trials) ? trials : []);
        setUserMe(user);
        setError("");
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load your dashboard");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("trialgo_token");
    localStorage.removeItem("trialgo_role");
    localStorage.removeItem("trialgo_user_id");
    localStorage.removeItem("trialgo_user");
    router.push("/login");
  };

  if (loading) {
    return <TrialGoLoaderFullPage label="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-default dark:border-border-subtle bg-surface-primary/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🧬</span>
            <span className="font-bold text-lg text-text-primary dark:text-text-primary">
              Trial<span className="text-secondary-600 dark:text-secondary-400">Go</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/trials"
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary dark:text-text-primary hover:bg-surface-secondary dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Browse Trials
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium text-danger dark:text-danger-light hover:bg-danger-light/10 dark:hover:bg-danger/10 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageTransition>
          {/* Welcome Section */}
          <section className="mb-12">
            <div className="mb-8">
              <h1 className="text-h1-dash text-text-primary dark:text-text-primary">
                Welcome back, {userMe?.full_name || "Patient"}!
              </h1>
              <p className="mt-2 text-body text-text-secondary dark:text-text-secondary">
                Here's an overview of your enrolled clinical trials and upcoming commitments.
              </p>
            </div>

            {/* Quick Stats */}
            {enrolledTrials.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-info-light dark:bg-info/10">
                      <BookOpen className="w-5 h-5 text-info dark:text-info-light" />
                    </div>
                    <h3 className="font-semibold text-text-primary dark:text-text-primary">
                      Active Trials
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-text-primary dark:text-text-primary">
                    {enrolledTrials.length}
                  </p>
                </div>

                <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-success-light dark:bg-success-dark/20">
                      <CheckCircle2 className="w-5 h-5 text-success dark:text-success" />
                    </div>
                    <h3 className="font-semibold text-text-primary dark:text-text-primary">
                      Enrolled
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-text-primary dark:text-text-primary">
                    {enrolledTrials.filter((t) => t.patient.status === "enrolled").length}
                  </p>
                </div>

                <div className="rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-warning-light dark:bg-warning-dark/20">
                      <Activity className="w-5 h-5 text-warning dark:text-warning" />
                    </div>
                    <h3 className="font-semibold text-text-primary dark:text-text-primary">
                      In Progress
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-text-primary dark:text-text-primary">
                    {enrolledTrials.filter((t) => t.patient.status === "in_progress").length}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Error State */}
          {error && (
            <div className="mb-8 rounded-lg bg-danger-light/10 dark:bg-danger/10 border border-danger-light dark:border-danger/30 p-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-danger dark:text-danger-light flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-danger dark:text-danger-light mb-1">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-danger dark:text-danger-light">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enrolled Trials */}
          <section>
            <h2 className="text-h2 text-text-primary dark:text-text-primary mb-6">
              Your Trials
            </h2>

            {enrolledTrials.length === 0 ? (
              // Empty State
              <div className="rounded-2xl border-2 border-dashed border-border-default dark:border-border-subtle bg-surface-secondary/50 dark:bg-slate-800/50 p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-h3 text-text-primary dark:text-text-primary mb-2">
                  No trials yet
                </h3>
                <p className="text-body text-text-secondary dark:text-text-secondary mb-6">
                  Explore available trials and apply to participate in research that matters.
                </p>
                <Link
                  href="/trials"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 text-white font-semibold transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse Trials
                </Link>
              </div>
            ) : (
              // Trial Cards Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledTrials.map((enrolledTrial) => {
                  const { patient, trial } = enrolledTrial;
                  const config = STATUS_CONFIG[patient.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.enrolled;
                  const StatusIcon = config.icon;
                  const enrolledDate = new Date(patient.enrolled_at);
                  const weeksEnrolled = Math.floor(
                    (Date.now() - enrolledDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
                  );

                  return (
                    <Link
                      key={`${trial.id}-${patient.id}`}
                      href={`/trials/${trial.id}`}
                    >
                      <div className="h-full rounded-xl border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-800 hover:border-secondary-600 dark:hover:border-secondary-400 hover:shadow-lg dark:hover:shadow-slate-900/50 shadow-sm transition-all duration-300 overflow-hidden">
                        {/* Card Header */}
                        <div className="p-6 border-b border-border-default dark:border-border-subtle">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-text-primary dark:text-text-primary line-clamp-2 mb-2">
                                {trial.title}
                              </h3>
                              <p className="text-sm text-text-secondary dark:text-text-secondary">
                                {trial.disease} • {trial.stage}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${config.color} ${config.borderColor} ${config.textColor}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          {/* Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                                Weeks Enrolled
                              </span>
                              <span className="text-sm font-bold text-text-primary dark:text-text-primary">
                                {weeksEnrolled} weeks
                              </span>
                            </div>
                            <div className="h-2 bg-surface-secondary dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-secondary-500 to-secondary-600 transition-all"
                                style={{
                                  width: `${Math.min((weeksEnrolled / 12) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Match Score */}
                          {patient.match_score && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                                  Match Score
                                </span>
                                <span className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                                  {Math.round(patient.match_score * 100)}%
                                </span>
                              </div>
                              <div className="h-2 bg-surface-secondary dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-success-500 to-success-600"
                                  style={{
                                    width: `${patient.match_score * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Enrolled Date */}
                          <div className="flex items-center gap-2 text-sm text-text-muted dark:text-text-muted">
                            <Clock className="w-4 h-4" />
                            Enrolled {enrolledDate.toLocaleDateString()}
                          </div>
                        </div>

                        {/* Card Footer - CTA */}
                        <div className="px-6 py-4 border-t border-border-default dark:border-border-subtle bg-surface-secondary/50 dark:bg-slate-700/50">
                          <div className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                            View Details →
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </PageTransition>
      </main>
    </div>
  );
}
