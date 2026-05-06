"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("Patient");
  const [role, setRole] = useState<"patient" | "coordinator" | "pharma">("patient");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    const r = localStorage.getItem("trialgo_role") as "patient" | "coordinator" | "pharma" | null;
    if (!token || !r) { router.replace("/login"); return; }
    setRole(r);
    try {
      const u = JSON.parse(localStorage.getItem("trialgo_user") || "{}");
      setUserName(u.full_name || u.email || "User");
    } catch {}
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppSidebar role={role} userName={userName} collapsed={collapsed} onCollapse={setCollapsed} />
      <div className="flex flex-1 flex-col transition-all duration-300" style={{ marginLeft: collapsed ? "64px" : "260px" }}>
        <AppHeader role={role} userName={userName} onMenuClick={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
