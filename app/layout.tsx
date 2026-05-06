import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { RoleGuard } from "./RoleGuard";

export const metadata = {
  title: "TrialGo — AI-Powered Clinical Trial Recruitment",
  description:
    "TrialGo uses 12 specialised AI agents to match patients to clinical trials, handle consent, and monitor trial health in real time.",
  keywords: "clinical trials, AI recruitment, patient matching, healthcare AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <RoleGuard />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "12px",
                },
              }}
              richColors
              closeButton
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
