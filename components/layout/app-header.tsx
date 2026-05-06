"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { UserRole } from "@/types/user";

interface AppHeaderProps {
  role: UserRole;
  userName?: string;
  onMenuClick?: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient",
  coordinator: "Coordinator",
  pharma: "Pharma",
};

const LOGOUT_ROUTES: Record<UserRole, string> = {
  patient: "/login",
  coordinator: "/login",
  pharma: "/login",
};

export function AppHeader({ role, userName = "User", onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("trialgo_token");
    localStorage.removeItem("trialgo_role");
    localStorage.removeItem("trialgo_user_id");
    localStorage.removeItem("trialgo_user");
    router.replace(LOGOUT_ROUTES[role]);
  };

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80"
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb / title */}
      <div className="flex flex-1 items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
        >
          <img src="/trialgo.png" alt="TrialGo Logo" className="h-8 w-8 rounded-lg" />
          <span className="hidden text-sm font-semibold md:block text-slate-900 dark:text-white">
            Trial<span className="text-blue-600 dark:text-blue-400">Go</span>
          </span>
        </Link>
        <span className="text-slate-400">/</span>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {ROLE_LABELS[role]}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User pill */}
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 md:flex dark:border-slate-700">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="max-w-[120px] truncate text-sm font-medium text-slate-900 dark:text-white">
            {userName}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
