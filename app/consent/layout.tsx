"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("Pharma User");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    const role = localStorage.getItem("trialgo_role");
    if (!token || role !== "pharma") { router.replace("/login"); return; }
    try {
      const u = JSON.parse(localStorage.getItem("trialgo_user") || "{}");
      setUserName(u.full_name || u.email || "Pharma User");
    } catch {}
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AppSidebar role="pharma" userName={userName} collapsed={collapsed} onCollapse={setCollapsed} />
      <div className="flex flex-1 flex-col transition-all duration-300" style={{ marginLeft: collapsed ? "64px" : "260px" }}>
        <AppHeader role="pharma" userName={userName} onMenuClick={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
