"use client"
import { useEffect, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

const publicRoutes = ["/", "/login", "/register", "/pharma/login", "/coordinator/login"]

// Routes only patients can access
const patientRoutes = ["/patient", "/dashboard", "/trials", "/onboarding", "/chatbot", "/profile"]

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function redirectBasedOnRole(role: string | null, router: AppRouterInstance) {
  if (role === "pharma") router.replace("/pharma/trials")
  else if (role === "coordinator") router.replace("/coordinator/cohort")
  else if (role === "patient") router.replace("/patient/dashboard")
  else router.replace("/login")
}

export function RoleGuard() {
  const pathname = usePathname()
  const router = useRouter()
  const mounted = useIsClient()

  useEffect(() => {
    if (!mounted) return

    const token = localStorage.getItem("trialgo_token")
    const role = localStorage.getItem("trialgo_role")

    // If no token and not a public route, redirect to login
    if (!token && !publicRoutes.includes(pathname)) {
      if (pathname.startsWith("/pharma")) {
        router.replace("/pharma/login")
      } else if (pathname.startsWith("/coordinator")) {
        router.replace("/coordinator/login")
      } else {
        router.replace("/login")
      }
      return
    }

    // If logged in, restrict routes by role
    if (token && role) {
      // Prevent access to public login/register pages if already logged in
      if (publicRoutes.includes(pathname) && pathname !== "/") {
        redirectBasedOnRole(role, router)
        return
      }

      // Pharma route protection
      if (pathname.startsWith("/pharma") && !pathname.includes("login")) {
        if (role !== "pharma") {
          redirectBasedOnRole(role, router)
          return
        }
      }

      // Coordinator route protection
      if (pathname.startsWith("/coordinator") && !pathname.includes("login")) {
        if (role !== "coordinator") {
          redirectBasedOnRole(role, router)
          return
        }
      }

      // Pharma consent template manager (/consent is not participant signing; that is on /trials/[id])
      if (pathname.startsWith("/consent")) {
        if (role !== "pharma") {
          redirectBasedOnRole(role, router)
          return
        }
      }

      // Patient route protection (dashboard, trials, patient, onboarding)
      const isPatientRoute = patientRoutes.some((r) => pathname.startsWith(r))

      if (isPatientRoute) {
        if (role !== "patient") {
          redirectBasedOnRole(role, router)
          return
        }
      }
    }
  }, [pathname, router, mounted])

  return null
}
