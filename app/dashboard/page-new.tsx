"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/ui/page-transition"
import { TrialGoLoaderFullPage } from "@/components/ui/trialgo-loader"
import {
  AlertCircle,
  LogOut,
  BookOpen,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react"

interface Trial {
  id: number
  title: string
  disease: string
  stage: string
}

interface VerifiedPatient {
  id: number
  trial_id: number
  status: string
  match_score: number
  enrolled_at: string
  consent_signed_at?: string
}

interface EnrolledTrial {
  patient: VerifiedPatient
  trial: Trial
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
}

export default function DashboardPage() {
  const router = useRouter()
  const [enrolledTrials, setEnrolledTrials] = useState<EnrolledTrial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [userMe, setUserMe] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")

    if (!token || role !== "patient") {
      router.push("/login")
      return
    }

    setLoading(true)
    const headers = { Authorization: `Bearer ${token}` }

    // Fetch enrolled trials
    Promise.all([
      fetch("/api/patient/my-trial-info", { headers }).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch("/api/auth/me", { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([trials, user]) => {
        setEnrolledTrials(Array.isArray(trials) ? trials : [])
        setUserMe(user)
        setError("")
      })
      .catch((err) => {
        console.error("Fetch error:", err)
        setError("Failed to load your dashboard")
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("trialgo_token")
    localStorage.removeItem("trialgo_role")
    localStorage.removeItem("trialgo_user_id")
    localStorage.removeItem("trialgo_user")
    router.push("/login")
  }

  if (loading) {
    return <TrialGoLoaderFullPage label="Loading your dashboard..." />
  }

  return (
    <div className="bg-background min-h-screen dark:bg-slate-900">
      {/* Header */}
      <header className="border-border-default dark:border-border-subtle bg-surface-primary/80 sticky top-0 z-40 border-b backdrop-blur-xl dark:bg-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image src="/trialgo.png" alt="TrialGo" width={36} height={36} className="h-9 w-9" />
            <span className="text-text-primary dark:text-text-primary text-lg font-bold">
              Trial
              <span className="text-secondary-600 dark:text-secondary-400">
                Go
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/trials"
              className="text-text-primary dark:text-text-primary hover:bg-surface-secondary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors dark:hover:bg-slate-700"
            >
              <BookOpen className="h-4 w-4" />
              Browse Trials
            </Link>
            <button
              onClick={handleLogout}
              className="text-danger dark:text-danger-light hover:bg-danger-light/10 dark:hover:bg-danger/10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTransition>
          {/* Welcome Section */}
          <section className="mb-12">
            <div className="mb-8">
              <h1 className="text-h1-dash text-text-primary dark:text-text-primary">
                Welcome back, {userMe?.full_name || "Patient"}!
              </h1>
              <p className="text-body text-text-secondary dark:text-text-secondary mt-2">
                Here's an overview of your enrolled clinical trials and upcoming
                commitments.
              </p>
            </div>

            {/* Quick Stats */}
            {enrolledTrials.length > 0 && (
              <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="border-border-default dark:border-border-subtle bg-surface-primary rounded-xl border p-6 shadow-sm dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="bg-info-light dark:bg-info/10 rounded-lg p-3">
                      <BookOpen className="text-info dark:text-info-light h-5 w-5" />
                    </div>
                    <h3 className="text-text-primary dark:text-text-primary font-semibold">
                      Active Trials
                    </h3>
                  </div>
                  <p className="text-text-primary dark:text-text-primary text-3xl font-bold">
                    {enrolledTrials.length}
                  </p>
                </div>

                <div className="border-border-default dark:border-border-subtle bg-surface-primary rounded-xl border p-6 shadow-sm dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="bg-success-light dark:bg-success-dark/20 rounded-lg p-3">
                      <CheckCircle2 className="text-success dark:text-success h-5 w-5" />
                    </div>
                    <h3 className="text-text-primary dark:text-text-primary font-semibold">
                      Enrolled
                    </h3>
                  </div>
                  <p className="text-text-primary dark:text-text-primary text-3xl font-bold">
                    {
                      enrolledTrials.filter(
                        (t) => t.patient.status === "enrolled"
                      ).length
                    }
                  </p>
                </div>

                <div className="border-border-default dark:border-border-subtle bg-surface-primary rounded-xl border p-6 shadow-sm dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="bg-warning-light dark:bg-warning-dark/20 rounded-lg p-3">
                      <Activity className="text-warning dark:text-warning h-5 w-5" />
                    </div>
                    <h3 className="text-text-primary dark:text-text-primary font-semibold">
                      In Progress
                    </h3>
                  </div>
                  <p className="text-text-primary dark:text-text-primary text-3xl font-bold">
                    {
                      enrolledTrials.filter(
                        (t) => t.patient.status === "in_progress"
                      ).length
                    }
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Error State */}
          {error && (
            <div className="bg-danger-light/10 dark:bg-danger/10 border-danger-light dark:border-danger/30 mb-8 rounded-lg border p-6">
              <div className="flex gap-4">
                <AlertCircle className="text-danger dark:text-danger-light mt-0.5 h-6 w-6 flex-shrink-0" />
                <div>
                  <h3 className="text-danger dark:text-danger-light mb-1 font-semibold">
                    Something went wrong
                  </h3>
                  <p className="text-danger dark:text-danger-light text-sm">
                    {error}
                  </p>
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
              <div className="border-border-default dark:border-border-subtle bg-surface-secondary/50 rounded-2xl border-2 border-dashed p-12 text-center dark:bg-slate-800/50">
                <div className="mb-4 text-5xl">📋</div>
                <h3 className="text-h3 text-text-primary dark:text-text-primary mb-2">
                  No trials yet
                </h3>
                <p className="text-body text-text-secondary dark:text-text-secondary mb-6">
                  Explore available trials and apply to participate in research
                  that matters.
                </p>
                <Link
                  href="/trials"
                  className="bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Browse Trials
                </Link>
              </div>
            ) : (
              // Trial Cards Grid
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enrolledTrials.map((enrolledTrial) => {
                  const { patient, trial } = enrolledTrial
                  const config =
                    STATUS_CONFIG[
                      patient.status as keyof typeof STATUS_CONFIG
                    ] || STATUS_CONFIG.enrolled
                  const StatusIcon = config.icon
                  const enrolledDate = new Date(patient.enrolled_at)
                  const weeksEnrolled = Math.floor(
                    (Date.now() - enrolledDate.getTime()) /
                      (7 * 24 * 60 * 60 * 1000)
                  )

                  return (
                    <Link
                      key={`${trial.id}-${patient.id}`}
                      href={`/trials/${trial.id}`}
                    >
                      <div className="border-border-default dark:border-border-subtle bg-surface-primary hover:border-secondary-600 dark:hover:border-secondary-400 h-full overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-slate-800 dark:hover:shadow-slate-900/50">
                        {/* Card Header */}
                        <div className="border-border-default dark:border-border-subtle border-b p-6">
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-text-primary dark:text-text-primary mb-2 line-clamp-2 text-lg font-bold">
                                {trial.title}
                              </h3>
                              <p className="text-text-secondary dark:text-text-secondary text-sm">
                                {trial.disease} • {trial.stage}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${config.color} ${config.borderColor} ${config.textColor}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="space-y-4 p-6">
                          {/* Progress */}
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-text-secondary dark:text-text-secondary text-sm font-medium">
                                Weeks Enrolled
                              </span>
                              <span className="text-text-primary dark:text-text-primary text-sm font-bold">
                                {weeksEnrolled} weeks
                              </span>
                            </div>
                            <div className="bg-surface-secondary h-2 overflow-hidden rounded-full dark:bg-slate-700">
                              <div
                                className="from-secondary-500 to-secondary-600 h-full bg-gradient-to-r transition-all"
                                style={{
                                  width: `${Math.min((weeksEnrolled / 12) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Match Score */}
                          {patient.match_score && (
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-text-secondary dark:text-text-secondary text-sm font-medium">
                                  Match Score
                                </span>
                                <span className="text-secondary-600 dark:text-secondary-400 text-sm font-bold">
                                  {Math.round(patient.match_score * 100)}%
                                </span>
                              </div>
                              <div className="bg-surface-secondary h-2 overflow-hidden rounded-full dark:bg-slate-700">
                                <div
                                  className="from-success-500 to-success-600 h-full bg-gradient-to-r"
                                  style={{
                                    width: `${patient.match_score * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Enrolled Date */}
                          <div className="text-text-muted dark:text-text-muted flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            Enrolled {enrolledDate.toLocaleDateString()}
                          </div>
                        </div>

                        {/* Card Footer - CTA */}
                        <div className="border-border-default dark:border-border-subtle bg-surface-secondary/50 border-t px-6 py-4 dark:bg-slate-700/50">
                          <div className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                            View Details →
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </PageTransition>
      </main>
    </div>
  )
}
