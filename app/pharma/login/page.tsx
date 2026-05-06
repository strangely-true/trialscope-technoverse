"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuroraBackgroundAuth } from "@/components/ui/aurora-background"
import { PageTransition } from "@/components/ui/page-transition"
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PharmaLoginPage() {
  const router = useRouter()
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
      if (!res.ok) throw new Error("Invalid credentials")
      const data = await res.json()
      if (data.role !== "pharma") throw new Error("Not a pharma account")
      localStorage.setItem("trialgo_token", data.access_token)
      localStorage.setItem("trialgo_role", data.role)
      router.push("/pharma/analytics")
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
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <span className="text-2xl">🧬</span>
                <span className="text-slate-900 text-2xl font-bold">
                  Trial
                  <span className="text-blue-600">
                    Go
                  </span>
                </span>
              </Link>
              <div className="mb-3 mt-4 inline-block rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
                🏥 Pharma Portal
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Pharma Sign In
              </h1>
            </div>

            {/* Card Container */}
            <div className="border border-slate-200 bg-white/90 rounded-2xl p-8 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Corporate Email
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    type="email"
                    placeholder="you@pharmacompany.com"
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
                    placeholder="Password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>

                {/* Demo Credentials */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/20">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-400">
                    💡 Demo:{" "}
                    <span className="font-semibold text-blue-900 dark:text-blue-300">pharma@trialgo.ai</span> /{" "}
                    <span className="font-semibold text-blue-900 dark:text-blue-300">demo1234</span>
                  </p>
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
                      Access Portal
                      <LogIn className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Footer Link */}
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  New to TrialGo?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Register your company
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
