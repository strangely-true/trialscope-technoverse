"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState("Coordinator");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    const role = localStorage.getItem("trialgo_role");
    if (!token || role !== "coordinator") {
      router.replace("/login");
      return;
    }
    const user = localStorage.getItem("trialgo_user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserName(parsed.full_name || parsed.email || "Coordinator");
      } catch { }
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppSidebar
        role="coordinator"
        userName={userName}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />
      <div
        className="flex min-w-0 flex-1 flex-col overflow-x-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "260px",
        }}
      >
        <AppHeader
          role="coordinator"
          userName={userName}
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
