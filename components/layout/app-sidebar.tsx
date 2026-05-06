"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FlaskConical,
  HeartPulse,
  FileCheck,
  MessageCircle,
  User,
  Users,
  AlertTriangle,
  Settings,
  BarChart3,
  PlusCircle,
  UserSearch,
  Globe,
  FileJson,
  ActivitySquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const PATIENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { label: "My Trials", href: "/trials", icon: FlaskConical },
  { label: "Symptom Log", href: "/patient/symptom-log", icon: HeartPulse },
  { label: "Chatbot", href: "/chatbot", icon: MessageCircle },
  { label: "Profile", href: "/profile", icon: User },
];

const COORDINATOR_NAV: NavItem[] = [
  { label: "Cohort Dashboard", href: "/coordinator/cohort", icon: Users },
  { label: "Anomalies", href: "/coordinator/anomalies", icon: AlertTriangle },
  { label: "Settings", href: "/coordinator/settings", icon: Settings },
];

const PHARMA_NAV: NavItem[] = [
  { label: "Analytics", href: "/pharma/analytics", icon: BarChart3 },
  { label: "My Trials", href: "/pharma/trials", icon: FlaskConical },
  { label: "Create Trial", href: "/pharma/create-trial", icon: PlusCircle },
  { label: "Consent PDF", href: "/consent", icon: FileCheck },
  { label: "Settings", href: "/pharma/settings", icon: Settings },
];

const NAV_MAP: Record<UserRole, NavItem[]> = {
  patient: PATIENT_NAV,
  coordinator: COORDINATOR_NAV,
  pharma: PHARMA_NAV,
};

const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient",
  coordinator: "Coordinator",
  pharma: "Pharma",
};

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const LOGOUT_ROUTES: Record<UserRole, string> = {
  patient: "/login",
  coordinator: "/coordinator/login",
  pharma: "/pharma/login",
};

export function AppSidebar({
  role,
  userName = "User",
  collapsed = false,
  onCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleLogout = () => {
    localStorage.removeItem("trialgo_token");
    localStorage.removeItem("trialgo_role");
    localStorage.removeItem("trialgo_user_id");
    localStorage.removeItem("trialgo_user");
    router.replace(LOGOUT_ROUTES[role]);
  };
  const navItems = NAV_MAP[role];

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapse?.(next);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900",
        isCollapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <ActivitySquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Trial<span className="text-blue-600 dark:text-blue-400">Go</span>
            </span>
          )}
        </Link>
        {!isCollapsed && (
          <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {ROLE_LABELS[role]}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600 dark:bg-blue-400 transition-all duration-200" />
                  )}
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        {/* User info */}
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ROLE_LABELS[role]}
              </p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

