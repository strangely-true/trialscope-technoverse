"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function PharmaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState("Pharma User");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    const role = localStorage.getItem("trialgo_role");
    if (!token || role !== "pharma") {
      router.replace("/login");
      return;
    }
    const user = localStorage.getItem("trialgo_user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserName(parsed.full_name || parsed.email || "Pharma User");
      } catch {}
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppSidebar
        role="pharma"
        userName={userName}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "260px",
        }}
      >
        <AppHeader
          role="pharma"
          userName={userName}
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
