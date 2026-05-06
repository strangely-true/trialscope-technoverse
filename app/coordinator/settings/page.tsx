"use client";

import { useState, useEffect } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Settings, User, Phone, Globe, Save, Bell } from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Bengali",
  "Marathi", "Kannada", "Malayalam", "Gujarati",
];

export default function CoordinatorSettingsPage() {
  const [userMe, setUserMe] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone_number: "", preferred_language: "English" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setUserMe(d);
          setForm({ full_name: d.full_name || "", phone_number: d.phone_number || "", preferred_language: d.preferred_language || "English" });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("trialgo_token");
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");
      setUserMe(data);
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("trialgo_token");
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userMe?.id, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");
      toast.success("Phone verified successfully!");
      setOtpStep(false);
      setOtp("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-[var(--text-muted)]">Loading...</div>;
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
            <Settings className="h-6 w-6 text-[var(--secondary-600)]" />
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your coordinator account settings</p>
        </div>

        {/* Profile card */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 dark:bg-slate-800">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary-100)] text-2xl font-bold text-[var(--secondary-600)]">
            {form.full_name ? form.full_name.charAt(0).toUpperCase() : "C"}
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{form.full_name || "Coordinator"}</p>
            <p className="text-sm text-[var(--text-muted)]">{userMe?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              Coordinator
            </span>
          </div>
        </div>

        {!otpStep ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 dark:bg-slate-800">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <User className="h-4 w-4 text-[var(--secondary-600)]" /> Personal Info
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
                  <input
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--secondary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-700"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-2.5 text-sm text-[var(--text-muted)] dark:bg-slate-700/50"
                    value={userMe?.email || ""}
                    readOnly disabled
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                    <Phone className="h-4 w-4" /> Phone (for Twilio calls)
                  </label>
                  <input
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--secondary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-700"
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Used to connect coordinator calls via Twilio</p>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                    <Globe className="h-4 w-4" /> Preferred Language
                  </label>
                  <select
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--secondary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-700"
                    value={form.preferred_language}
                    onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[var(--secondary-600)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--secondary-700)] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 dark:bg-slate-800">
            <div className="mb-6 text-center">
              <div className="mb-3 text-4xl">📱</div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Verify Your Phone</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">We sent a code to {form.phone_number}</p>
            </div>
            <form onSubmit={handleVerifyOtp}>
              <input
                className="mx-auto mb-6 block w-40 rounded-xl border border-[var(--border-default)] bg-[var(--background)] px-4 py-4 text-center text-2xl font-bold tracking-widest text-[var(--text-primary)] focus:border-[var(--secondary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-700"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="1234"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setOtpStep(false)} className="flex-1 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]">Back</button>
                <button type="submit" disabled={otp.length !== 4 || saving} className="flex-1 rounded-lg bg-[var(--secondary-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--secondary-700)] disabled:opacity-50">{saving ? "Verifying..." : "Verify"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
