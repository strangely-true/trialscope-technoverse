"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuroraBackgroundAuth } from "@/components/ui/aurora-background"
import { PageTransition } from "@/components/ui/page-transition"
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader"
import { CheckCircle2, ChevronRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const ROLES = [
  {
    value: "patient",
    label: "Patient",
    icon: "🩺",
    desc: "Find clinical trials matching your condition",
  },
  {
    value: "coordinator",
    label: "Coordinator",
    icon: "📋",
    desc: "Manage trial patients and monitor health data",
  },
  {
    value: "pharma",
    label: "Pharma Company",
    icon: "🏥",
    desc: "Post trials and recruit qualified candidates",
  },
]

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Gujarati",
]

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    preferred_language: "English",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Registration failed")
      }
      const data = await res.json()

      if (form.phone_number) {
        setUserId(data.id)
        setStep(3)
      } else {
        // Redirect by role
        router.push("/login?registered=1")
      }
      // Redirect by role directly
      if (role === "patient") router.push("/login?registered=1")
      else if (role === "coordinator")
        router.push("/coordinator/login?registered=1")
      else router.push("/pharma/login?registered=1")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Verification failed")
      }
      // Redirect after successful verification
      router.push("/login?registered=1")
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
          <div className="w-full max-w-lg">
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
              <h1 className="text-3xl font-bold text-slate-900 mt-6">
                Create your account
              </h1>
              <p className="text-slate-600 mt-2">
                Join the AI-powered clinical trial ecosystem
              </p>
            </div>

            {/* Card Container */}
            <div className="border border-slate-200 bg-white/90 rounded-2xl p-8 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
              {step === 1 ? (
                <>
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Select your role
                  </p>
                  <div className="flex flex-col gap-3">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => {
                          setRole(r.value)
                          setStep(2)
                        }}
                        className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-left transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {r.label}
                          </div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {r.desc}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </button>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              ) : step === 2 ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mb-2 text-left text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    ← Back
                  </button>

                  {/* Role indicator */}
                  <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
                    <span className="text-lg">
                      {ROLES.find((r) => r.value === role)?.icon}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ROLES.find((r) => r.value === role)?.label}
                    </span>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      placeholder="Anjali Sharma"
                      required
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                    />
                  </div>

                  {/* Email */}
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

                  {/* Phone Number */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Mobile Number
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                      value={form.phone_number}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone_number: e.target.value }))
                      }
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      type="password"
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                    />
                  </div>

                  {/* Preferred Language */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Preferred Language
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      value={form.preferred_language}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          preferred_language: e.target.value,
                        }))
                      }
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
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
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <TrialGoLoaderInline className="mr-2" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              ) : (
                // Step 3: OTP Verification
                <form
                  onSubmit={handleVerifyOTP}
                  className="flex flex-col gap-6"
                >
                  <div className="text-center">
                    <div className="mb-4 text-5xl">📱</div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Verify your phone
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Enter the 4-digit OTP sent to {form.phone_number}
                    </p>
                  </div>

                  {/* OTP Input */}
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-4 text-center text-2xl font-bold tracking-widest text-slate-900 transition-all placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="1234"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />

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
                    disabled={loading || otp.length !== 4}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <TrialGoLoaderInline className="mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </PageTransition>
      </div>
    </AuroraBackgroundAuth>
  )
}
