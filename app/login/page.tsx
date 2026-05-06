"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { AuroraBackgroundAuth } from "@/components/ui/aurora-background"
import { PageTransition } from "@/components/ui/page-transition"
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader"
import { LogIn, CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const registered = params.get("registered")
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Login failed")
      }
      const data = await res.json()
      localStorage.setItem("trialgo_token", data.access_token)
      localStorage.setItem("trialgo_role", data.role)
      localStorage.setItem("trialgo_user_id", String(data.user_id))
      localStorage.setItem("trialgo_user", JSON.stringify(data))

      if (data.role === "coordinator") {
        router.push("/coordinator/cohort")
      } else if (data.role === "pharma") {
        router.push("/pharma/analytics")
      } else {
        // Patient: check if questionnaire is completed
        try {
          const qRes = await fetch("/api/questionnaire/status", {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
          const qData = await qRes.json()
          if (!qData.questionnaire_completed) {
            router.push("/onboarding/questionnaire")
          } else {
            router.push("/trials")
          }
        } catch {
          router.push("/trials")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuroraBackgroundAuth>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <PageTransition duration={300}>
          <div className="w-[70vw] max-w-[620px]">
            {/* Logo */}
            <div className="mb-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <Image src="/trialgo.png" alt="TrialGo" width={40} height={40} className="h-10 w-10" />
                <span className="text-slate-900 text-2xl font-bold">
                  Trial
                  <span className="text-blue-600">
                    Go
                  </span>
                </span>
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 mt-6">
                Welcome back!
              </h1>
              {registered && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    Account created! Please sign in.
                  </span>
                </div>
              )}
            </div>

            {/* Card Container */}
            <div className="border border-slate-200 bg-white/90 rounded-2xl p-12 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    type="password"
                    placeholder="Your password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full h-12 text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <TrialGoLoaderInline className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <LogIn className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Sign Up Link */}
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Create one
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </PageTransition>
      </div>
    </AuroraBackgroundAuth>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
