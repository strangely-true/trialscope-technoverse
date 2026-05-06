"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Trials", href: "/trials", icon: FlaskConical },
  { label: "Symptom Log", href: "/patient/symptom-log", icon: HeartPulse },
  { label: "Consent", href: "/consent", icon: FileCheck },
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
  { label: "Candidates", href: "/pharma/candidates", icon: UserSearch },
  { label: "Discovery", href: "/pharma/discovery", icon: Globe },
  { label: "FHIR Export", href: "/pharma/fhir", icon: FileJson },
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

export function AppSidebar({
  role,
  userName = "User",
  collapsed = false,
  onCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const navItems = NAV_MAP[role];

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapse?.(next);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-[var(--border-default)] bg-[var(--surface-primary)] transition-all duration-300 dark:bg-slate-900",
        isCollapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border-default)] px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary-100)]">
            <ActivitySquare className="h-5 w-5 text-[var(--secondary-600)]" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight">
              Trial<span className="text-[var(--secondary-600)]">Go</span>
            </span>
          )}
        </Link>
        {!isCollapsed && (
          <span className="ml-auto rounded-full bg-[var(--secondary-100)] px-2 py-0.5 text-[11px] font-semibold text-[var(--secondary-600)]">
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
                      ? "bg-[var(--secondary-50)] text-[var(--secondary-600)] dark:bg-[var(--secondary-100)]"
                      : "text-[var(--text-secondary)] hover:bg-slate-50 hover:text-[var(--text-primary)] dark:hover:bg-slate-800"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--secondary-600)] transition-all duration-200" />
                  )}
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-[var(--secondary-600)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
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
      <div className="border-t border-[var(--border-default)] p-3">
        {/* User info */}
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-100)] text-xs font-semibold text-[var(--secondary-600)]">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {userName}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {ROLE_LABELS[role]}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-slate-50 hover:text-[var(--text-secondary)] dark:hover:bg-slate-800"
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
