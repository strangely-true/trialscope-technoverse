"use client";

import { Bell, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title: string;
  userName?: string;
  greeting?: boolean;
  notificationCount?: number;
  onLogout?: () => void;
  className?: string;
}

export function AppHeader({
  title,
  userName,
  greeting = true,
  notificationCount = 0,
  onLogout,
  className,
}: AppHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-primary)]/80 px-6 backdrop-blur-sm dark:bg-slate-900/80",
        className
      )}
    >
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {greeting && userName && (
          <span className="hidden text-sm text-[var(--text-muted)] sm:block">
            {getGreeting()}, {userName}
          </span>
        )}

        {/* Notification bell */}
        <button className="relative rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-slate-50 hover:text-[var(--text-primary)] dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <ModeToggle />

        {onLogout && (
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-[var(--danger)] dark:hover:bg-red-900/20"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
