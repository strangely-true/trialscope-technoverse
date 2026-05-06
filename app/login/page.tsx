"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuroraBackgroundAuth } from "@/components/ui/aurora-background";
import { PageTransition } from "@/components/ui/page-transition";
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader";
import { LogIn, CheckCircle2, ChevronRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("trialgo_token", data.access_token);
      localStorage.setItem("trialgo_role", data.role);
      localStorage.setItem("trialgo_user_id", String(data.user_id));
      localStorage.setItem("trialgo_user", JSON.stringify(data));

      if (data.role === "coordinator") {
        router.push("/coordinator/cohort");
      } else if (data.role === "pharma") {
        router.push("/pharma/analytics");
      } else {
        // Patient: check if questionnaire is completed
        try {
          const qRes = await fetch("/api/questionnaire/status", {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          const qData = await qRes.json();
          if (!qData.questionnaire_completed) {
            router.push("/onboarding/questionnaire");
          } else {
            router.push("/trials");
          }
        } catch {
          router.push("/trials");
        }
      }
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
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🧬</span>
                <span className="font-bold text-2xl text-text-primary dark:text-text-primary">
                  Trial<span className="text-secondary-600 dark:text-secondary-400">Go</span>
                </span>
              </Link>
              <h1 className="mt-6 text-h1-dash text-text-primary dark:text-text-primary">
                Welcome back
              </h1>
              {registered && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-success-light dark:bg-success-dark/20 border border-success dark:border-success/30 px-4 py-2">
                  <CheckCircle2 className="w-5 h-5 text-success dark:text-success" />
                  <span className="text-sm font-medium text-success dark:text-success">
                    Account created! Please sign in.
                  </span>
                </div>
              )}
            </div>

            {/* Card Container */}
            <div className="rounded-2xl border border-border-default/30 dark:border-border-subtle bg-surface-primary/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-lg dark:shadow-slate-900/50 p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email Input */}
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

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                    Password
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                  className="w-full py-3 px-4 rounded-lg bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue hover:shadow-lg mt-2"
                >
                  {loading ? (
                    <>
                      <TrialGoLoaderInline />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      Sign In
                      <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-text-secondary dark:text-text-secondary">
                  No account?{" "}
                  <Link href="/register" className="text-secondary-600 dark:text-secondary-400 hover:underline font-semibold">
                    Create one
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </PageTransition>
      </div>
    </AuroraBackgroundAuth>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
