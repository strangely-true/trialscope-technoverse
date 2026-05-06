/**
 * TrialGo Design Tokens
 * Centralizes all design system values for consistency
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const COLORS = {
  // Surfaces
  surface: {
    primary: "#FFFFFF",
    secondary: "#F1F5F9",
    tertiary: "#E2E8F0",
  },

  background: "#FAFBFC",

  // Primary/Secondary (Blue-based)
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

  // Slate/Neutral
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

  // Status
  status: {
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
  },

  // Borders
  border: {
    default: "#E2E8F0",
    focus: "#2563EB",
    subtle: "#F1F5F9",
  },

  // Dark Mode
  dark: {
    surface: "#0F172A",
    "surface-card": "#1E293B",
    "surface-elevated": "#334155",
    "text-primary": "#F8FAFC",
    "text-secondary": "#CBD5E1",
    "text-muted": "#64748B",
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  display: {
    fontSize: "56px",
    lineHeight: "64px",
    fontWeight: 700,
    letterSpacing: "-0.025em",
  },
  h1: {
    fontSize: "48px",
    lineHeight: "56px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  "h1-dash": {
    fontSize: "32px",
    lineHeight: "40px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontSize: "28px",
    lineHeight: "36px",
    fontWeight: 600,
    letterSpacing: "-0.015em",
  },
  h3: {
    fontSize: "20px",
    lineHeight: "28px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  h4: {
    fontSize: "18px",
    lineHeight: "26px",
    fontWeight: 600,
    letterSpacing: "0",
  },
  "body-lg": {
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: 400,
    letterSpacing: "0",
  },
  body: {
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 400,
    letterSpacing: "0",
  },
  "body-sm": {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "0",
  },
  caption: {
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
  overline: {
    fontSize: "11px",
    lineHeight: "16px",
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
};

// ============================================================================
// SPACING (base unit: 4px)
// ============================================================================

export const SPACING = {
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
};

// Common measurements
export const LAYOUT = {
  sidebarWidth: {
    desktop: "260px",
    expanded: "280px",
    collapsed: "64px",
  },
  headerHeight: "64px",
  mobileBottomNav: "64px",
  maxWidth: {
    page: "1440px",
    content: "1200px",
    form: {
      auth: "480px",
      settings: "640px",
      trial: "720px",
    },
    reading: "800px",
  },
  sectionPadding: {
    desktop: "80px",
    mobile: "48px",
  },
  cardPadding: {
    desktop: "24px",
    mobile: "16px",
  },
  gridGap: {
    desktop: "24px",
    mobile: "16px",
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  sm: "6px", // badges, small tags
  md: "10px", // inputs, textareas, small buttons
  lg: "12px", // buttons, dropdowns
  xl: "16px", // cards, dialogs
  "2xl": "20px", // large feature cards
  full: "9999px", // avatars, pills
};

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.06)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.06), 0 8px 10px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px rgba(0, 0, 0, 0.12)",
  blue: "0 10px 40px rgba(37, 99, 235, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)",
  inner: "inset 0 2px 4px rgba(0, 0, 0, 0.04)",
};

// Elevation purposes
export const SHADOW_ELEVATION = {
  card: SHADOWS.sm,
  "card-hover": SHADOWS.blue,
  dialog: SHADOWS["2xl"],
  dropdown: SHADOWS.lg,
  toast: SHADOWS.xl,
  sticky: `1px 0 0 var(--border-default), ${SHADOWS.xs}`,
};

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  tooltip: 60,
  notification: 70,
  loading: 80,
};

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  fast: "0.15s ease-out",
  normal: "0.3s ease-out",
  slow: "0.5s ease-out",
  slowest: "0.8s ease-out",
};

// ============================================================================
// BREAKPOINTS (Mobile-first)
// ============================================================================

export const BREAKPOINTS = {
  mobile: "320px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1440px",
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const COMPONENT_TOKENS = {
  // Loader sizes
  loaderSizes: {
    sm: {
      container: "56px",
      borderWidth: "8px",
    },
    md: {
      container: "112px",
      borderWidth: "16px",
    },
    lg: {
      container: "168px",
      borderWidth: "24px",
    },
  },

  // Aurora intensity
  auroraIntensity: {
    subtle: "0.3",
    medium: "0.5",
    strong: "0.7",
  },

  // Button sizes
  buttonSizes: {
    sm: {
      padding: "8px 16px",
      fontSize: "14px",
    },
    md: {
      padding: "12px 24px",
      fontSize: "16px",
    },
    lg: {
      padding: "16px 32px",
      fontSize: "16px",
    },
  },

  // Icon sizes
  iconSizes: {
    xs: "16px",
    sm: "20px",
    md: "24px",
    lg: "32px",
    xl: "48px",
  },
};
