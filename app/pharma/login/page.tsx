"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuroraBackgroundAuth } from "@/components/ui/aurora-background";
import { PageTransition } from "@/components/ui/page-transition";
import { TrialGoLoaderInline } from "@/components/ui/trialgo-loader";
import { LogIn } from "lucide-react";

export default function PharmaLoginPage() {
  const router = useRouter();
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
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      if (data.role !== "pharma") throw new Error("Not a pharma account");
      localStorage.setItem("trialgo_token", data.access_token);
      localStorage.setItem("trialgo_role", data.role);
      router.push("/pharma/analytics");
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
              <div className="mt-4 inline-block rounded-lg bg-info-light dark:bg-info/10 border border-info dark:border-info/30 px-3 py-1 text-sm font-medium text-info dark:text-info mb-3">
                🏥 Pharma Portal
              </div>
              <h1 className="text-h1-dash text-text-primary dark:text-text-primary">
                Pharma Sign In
              </h1>
            </div>

            {/* Card Container */}
            <div className="rounded-2xl border border-border-default/30 dark:border-border-subtle bg-surface-primary/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-lg dark:shadow-slate-900/50 p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                    Corporate Email
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary mb-2">
                    Password
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-border-default dark:border-border-subtle bg-surface-primary dark:bg-slate-700 text-text-primary dark:text-text-primary placeholder-text-muted dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-secondary-600 focus:border-transparent transition-all"
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
                <div className="rounded-lg bg-info-light/10 dark:bg-info/10 border border-info-light dark:border-info/30 p-3">
                  <p className="text-xs font-medium text-info dark:text-info-light">
                    💡 Demo: <span className="font-semibold">pharma@trialgo.ai</span> / <span className="font-semibold">demo1234</span>
                  </p>
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
                      Access Portal
                      <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Footer Link */}
                <p className="text-center text-sm text-text-secondary dark:text-text-secondary">
                  New to TrialGo?{" "}
                  <Link href="/register" className="text-secondary-600 dark:text-secondary-400 hover:underline font-semibold">
                    Register your company
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
