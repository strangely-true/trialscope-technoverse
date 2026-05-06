import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary Surface
        surface: {
          DEFAULT: "#FFFFFF",
          high: "#F1F5F9",
          highest: "#E2E8F0",
        },

        // Background
        background: "#FAFBFC",

        // Secondary/Accent (Blue)
        secondary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          300: "#93C5FD",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },

        // Text
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          disabled: "#CBD5E1",
        },

        // Slate (neutral)
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        // Status Colors
        success: "#10B981",
        "success-light": "#D1FAE5",
        "success-dark": "#065F46",

        warning: "#F59E0B",
        "warning-light": "#FEF3C7",
        "warning-dark": "#92400E",

        danger: "#EF4444",
        "danger-light": "#FEE2E2",
        "danger-dark": "#991B1B",

        info: "#3B82F6",
        "info-light": "#DBEAFE",
        "info-dark": "#1E40AF",

        // Borders
        border: {
          DEFAULT: "#E2E8F0",
          focus: "#2563EB",
          subtle: "#F1F5F9",
        },

        // Dark Mode Colors
        dark: {
          surface: "#0F172A",
          "surface-card": "#1E293B",
          "surface-elevated": "#334155",
          "text-primary": "#F8FAFC",
          "text-secondary": "#CBD5E1",
          "text-muted": "#64748B",
        },
      },

      // Typography
      fontSize: {
        display: ["56px", { lineHeight: "64px", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h1": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h1-dash": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["28px", { lineHeight: "36px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "h3": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h4": ["18px", { lineHeight: "26px", letterSpacing: "0", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "400" }],
        "body": ["16px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
        "overline": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },

      // Spacing (base unit: 4px)
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        base: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
        "4xl": "48px",
        "5xl": "56px",
        "6xl": "64px",
        "7xl": "80px",
        "8xl": "96px",
        "9xl": "120px",
      },

      // Border Radius
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },

      // Shadows
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.06)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.06), 0 8px 10px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px rgba(0, 0, 0, 0.12)",
        blue: "0 10px 40px rgba(37, 99, 235, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)",
        inner: "inset 0 2px 4px rgba(0, 0, 0, 0.04)",
      },

      // Animations
      animation: {
        aurora: "aurora 15s ease-in-out infinite",
      },

      keyframes: {
        aurora: {
          "0%, 100%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
