"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuroraBackgroundAuth } from "@/components/ui/aurora-background";
import { PageTransition } from "@/components/ui/page-transition";
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader";
import { CheckCircle2, ChevronRight, Lock } from "lucide-react";

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
];

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
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    preferred_language: "English",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Registration failed");
      }
      const data = await res.json();

      if (form.phone_number) {
        setUserId(data.id);
        setStep(3);
      } else {
        // Redirect by role
        if (role === "patient") router.push("/login?registered=1");
        else if (role === "coordinator")
          router.push("/coordinator/login?registered=1");
        else router.push("/pharma/login?registered=1");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Verification failed");
      }
      // Redirect by role after successful verification
      if (role === "patient") router.push("/login?registered=1");
      else if (role === "coordinator")
        router.push("/coordinator/login?registered=1");
      else router.push("/pharma/login?registered=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackgroundAuth>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <PageTransition duration={300}>
          <div className="w-full max-w-lg">
            {/* Logo */}
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🧬</span>
                <span className="font-bold text-2xl text-text-primary dark:text-text-primary">
                  Trial<span className="text-secondary-600 dark:text-secondary-400">Go</span>
                </span>
              </Link>
              <h1 className="mt-6 text-h1-dash text-text-primary dark:text-text-primary">
                Create your account
              </h1>
              <p className="mt-2 text-body text-text-secondary dark:text-text-secondary">
                Join the AI-powered clinical trial ecosystem
              </p>
            </div>

            {/* Card Container */}
            <div className="rounded-2xl border border-border-default/30 dark:border-border-subtle bg-surface-primary/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-lg dark:shadow-slate-900/50 p-8">
              {step === 1 ? (
                <>
                  <p className="text-overline text-text-secondary dark:text-text-secondary mb-5 uppercase">
                    Select your role
                  </p>
                  <div className="flex flex-col gap-3">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => {
                          setRole(r.value);
                          setStep(2);
                        }}
                        className="group flex items-center gap-4 p-5 text-left rounded-lg border border-border-default/50 dark:border-border-subtle/50 hover:border-secondary-600 dark:hover:border-secondary-400 bg-surface-secondary/50 dark:bg-slate-700/50 hover:bg-surface-secondary dark:hover:bg-slate-700 transition-all"
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-text-primary dark:text-text-primary">
                            {r.label}
                          </div>
                          <div className="text-sm text-text-muted dark:text-text-muted mt-1">
                            {r.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-muted dark:text-text-muted group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-sm text-text-secondary dark:text-text-secondary">
                    Already have an account?{" "}
                    <Link href="/login" className="text-secondary-600 dark:text-secondary-400 hover:underline font-semibold">
                      Sign in
                    </Link>
                  </p>
                </>
              ) : step === 2 ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-text-muted hover:text-text-secondary dark:text-text-muted dark:hover:text-text-secondary text-sm font-medium transition-colors mb-2"
                  >
                    ← Back
                  </button>

                  {/* Role indicator */}
                  <div className="rounded-lg bg-secondary-50 dark:bg-secondary-900/30 border border-secondary-200 dark:border-secondary-700/50 p-4 flex items-center gap-3">
                    <span className="text-lg">
                      {ROLES.find((r) => r.value === role)?.icon}
                    </span>
                    <span className="font-semibold text-text-primary dark:text-text-primary">
                      {ROLES.find((r) => r.value === role)?.label}
                    </span>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                      Full Name
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                      Email
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                      Mobile Number
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                      Password
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                      Preferred Language
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                    <div className="rounded-lg bg-danger-light/10 dark:bg-danger/10 border border-danger-light dark:border-danger/30 p-3">
                      <p className="text-sm font-medium text-danger dark:text-danger-light">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <TrialGoLoaderInline />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        Create Account
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-text-secondary dark:text-text-secondary">
                    Already have an account?{" "}
                    <Link href="/login" className="text-secondary-600 dark:text-secondary-400 hover:underline font-semibold">
                      Sign in
                    </Link>
                  </p>
                </form>
              ) : (
                // Step 3: OTP Verification
                <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6">
                  <div className="text-center">
                    <div className="text-5xl mb-4">📱</div>
                    <h2 className="text-h3 text-text-primary dark:text-text-primary font-bold">
                      Verify your phone
                    </h2>
                    <p className="text-body text-text-secondary dark:text-text-secondary mt-2">
                      Enter the 4-digit OTP sent to {form.phone_number}
                    </p>
                  </div>

                  {/* OTP Input */}
                  <input
                    className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
                    placeholder="1234"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  />

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg bg-danger-light/10 dark:bg-danger/10 border border-danger-light dark:border-danger/30 p-3">
                      <p className="text-sm font-medium text-danger dark:text-danger-light">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 4}
                    className="w-full py-3 px-4 rounded-lg bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <TrialGoLoaderInline />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </PageTransition>
      </div>
    </AuroraBackgroundAuth>
  );
}
