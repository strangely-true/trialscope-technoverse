"use client";

import Link from "next/link";
import { ActivitySquare } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "API", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "HIPAA Compliance", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
  Connect: [
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "GitHub", href: "#" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-700 bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <ActivitySquare className="h-5 w-5 text-[var(--secondary-500)]" />
              <span className="text-lg font-bold">TrialGo</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered clinical trial recruitment connecting patients to
              life-saving research.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-6 sm:flex-row sm:justify-between">
          <div>
            <p className="font-medium text-white">Stay updated</p>
            <p className="text-sm text-slate-400">
              Get the latest on clinical trial innovation.
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-10 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm text-white placeholder:text-slate-500 focus:border-[var(--secondary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--secondary-500)] sm:w-64"
            />
            <button className="h-10 rounded-lg bg-[var(--secondary-600)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--secondary-700)]">
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-700 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} TrialGo. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Built with ❤️ for clinical research
          </p>
        </div>
      </div>
    </footer>
  );
}
