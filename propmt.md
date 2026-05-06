Reasoning: The user wants me to rewrite/enhance this prompt specifically for a UI/UX developer perspective, making it more detailed and actionable for building all routes.

# TrialGo — Senior UI/UX Developer Implementation Prompt

---

## PROMPT START

---

You are a senior UI/UX developer building the complete frontend for **TrialGo** — an AI-powered clinical trial recruitment platform. You must implement every single route, component, interaction, and state with production-grade quality. The design philosophy is **minimal, clinical, trustworthy, and buttery smooth**. Every pixel matters. Every transition must feel intentional. This is a healthcare product that needs to inspire confidence while feeling modern and effortless.

---

## PART 1: DESIGN FOUNDATION

### 1.1 Design Principles

1. **Trust through clarity** — Healthcare users need to feel safe. Clean layouts, generous whitespace, predictable patterns
2. **Progressive disclosure** — Never overwhelm. Show information in layers. Use tabs, accordions, multi-step forms
3. **Motion with purpose** — Every animation communicates state change. Nothing moves for decoration alone
4. **Consistency breeds confidence** — Same patterns everywhere. Once a user learns one sidebar, they know all three
5. **Accessibility is non-negotiable** — WCAG 2.1 AA minimum. Screen readers, keyboard nav, color contrast all perfect

### 1.2 Color System

```
PRIMARY SURFACE:        #FFFFFF (white — cards, modals, primary surfaces)
BACKGROUND:             #FAFBFC (off-white — page backgrounds, sections)
SECONDARY/ACCENT:       #2563EB (blue-600 — CTAs, active states, links)
SECONDARY DARK:         #1D4ED8 (blue-700 — hover states, pressed)
SECONDARY MEDIUM:       #3B82F6 (blue-500 — lighter interactive elements)
SECONDARY LIGHT:        #93C5FD (blue-300 — highlights, progress fills)
SECONDARY ULTRA-LIGHT:  #DBEAFE (blue-100 — backgrounds, chatbot bubbles, selection states)
SECONDARY GHOST:        #EFF6FF (blue-50 — subtle hover backgrounds)

TEXT PRIMARY:           #0F172A (slate-900 — headings, body text)
TEXT SECONDARY:         #475569 (slate-600 — descriptions, secondary info)
TEXT MUTED:             #94A3B8 (slate-400 — timestamps, placeholders, captions)
TEXT DISABLED:          #CBD5E1 (slate-300 — disabled states)

BORDER DEFAULT:         #E2E8F0 (slate-200 — card borders, dividers)
BORDER FOCUS:           #2563EB (blue-600 — input focus rings)
BORDER SUBTLE:          #F1F5F9 (slate-100 — subtle separators)

SUCCESS:                #10B981 (emerald-500) | Light: #D1FAE5 | Dark: #065F46
WARNING:                #F59E0B (amber-500)  | Light: #FEF3C7 | Dark: #92400E
DANGER:                 #EF4444 (red-500)    | Light: #FEE2E2 | Dark: #991B1B
INFO:                   #3B82F6 (blue-500)   | Light: #DBEAFE | Dark: #1E40AF

DARK MODE:
  Surface:              #0F172A (slate-900)
  Card:                 #1E293B (slate-800)
  Card elevated:        #334155 (slate-700)
  Border:               #334155 (slate-700)
  Text primary:         #F8FAFC (slate-50)
  Text secondary:       #CBD5E1 (slate-300)
  Text muted:           #64748B (slate-500)
```

### 1.3 Typography Scale

```
Font: Inter (loaded via next/font/google, weights: 400, 500, 600, 700)

DISPLAY:    56px / 64px / 700 / -0.025em  (Landing hero only)
H1:         48px / 56px / 700 / -0.02em   (Landing sections)
H1-DASH:    32px / 40px / 700 / -0.02em   (Dashboard page titles)
H2:         28px / 36px / 600 / -0.015em  (Section headings)
H3:         20px / 28px / 600 / -0.01em   (Card titles, subsections)
H4:         18px / 26px / 600 / 0         (Small headings)
BODY-LG:    18px / 28px / 400 / 0         (Landing paragraphs)
BODY:       16px / 24px / 400 / 0         (Default body text)
BODY-SM:    14px / 20px / 400 / 0         (Secondary text, table cells)
CAPTION:    12px / 16px / 500 / 0.01em    (Labels, timestamps, badges)
OVERLINE:   11px / 16px / 600 / 0.05em    (Section labels, uppercase)
```

### 1.4 Spacing & Layout Grid

```
Base unit: 4px
Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 120

Page max-width: 1440px (centered)
Content max-width: 1200px (within page)
Form max-width: 480px (auth), 640px (settings), 720px (create trial)
Reading max-width: 800px (trial detail, FHIR preview)

Sidebar width: 260px (desktop), 280px (expanded), 64px (collapsed icons only)
Header height: 64px (sticky)
Mobile bottom nav: 64px

Section vertical padding: 80px (desktop), 48px (mobile)
Card padding: 24px (desktop), 16px (mobile)
Card gap in grids: 24px (desktop), 16px (mobile)

Grid columns: 12 (desktop), 8 (tablet), 4 (mobile)
Gutter: 24px
```

### 1.5 Border Radius System

```
RADIUS-SM:    6px   (badges, small tags, chips)
RADIUS-MD:    10px  (inputs, textareas, small buttons)
RADIUS-LG:    12px  (buttons, dropdowns)
RADIUS-XL:    16px  (cards, dialogs, panels)
RADIUS-2XL:   20px  (large feature cards, hero elements)
RADIUS-FULL:  9999px (avatars, pills, circular buttons, progress rings)
```

### 1.6 Shadow System

```
SHADOW-XS:    0 1px 2px rgba(0, 0, 0, 0.04)
SHADOW-SM:    0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)
SHADOW-MD:    0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)
SHADOW-LG:    0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.06)
SHADOW-XL:    0 20px 25px rgba(0, 0, 0, 0.06), 0 8px 10px rgba(0, 0, 0, 0.04)
SHADOW-2XL:   0 25px 50px rgba(0, 0, 0, 0.12)
SHADOW-BLUE:  0 10px 40px rgba(37, 99, 235, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)
SHADOW-INNER: inset 0 2px 4px rgba(0, 0, 0, 0.04)

Hover elevation: SHADOW-SM → SHADOW-BLUE (cards)
Dialog:        SHADOW-2XL
Dropdown:      SHADOW-LG
Toast:         SHADOW-XL
Sticky header: 0 1px 0 var(--border-default), SHADOW-XS
```

### 1.7 Icon System

```
Library: Lucide React (consistent stroke-width: 1.5px for 24px icons, 2px for 16px icons)
Sizes: 16px (inline), 20px (buttons/nav), 24px (feature cards), 32px (empty states), 48px (landing features)
Color: inherit from parent text color (ensures dark mode compatibility)
```

---

## PART 2: COMPONENT LIBRARY (Build These First)

### 2.1 TrialGo Loader Component

Build a reusable `<TrialGoLoader />` component with three sizes: `sm` (56px), `md` (112px), `lg` (168px).

```tsx
// components/ui/trialgo-loader.tsx
interface TrialGoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**CSS Implementation (exact keyframes):**

Three boxes that morph and rearrange in a 4-second infinite loop. Border color: `var(--color-secondary)` (blue in light, white in dark mode).

```css
.trialgo-loader { position: relative; }
.trialgo-loader.sm { width: 56px; height: 56px; }
.trialgo-loader.sm .box1, .trialgo-loader.sm .box2, .trialgo-loader.sm .box3 { border-width: 8px; }
.trialgo-loader.md { width: 112px; height: 112px; }
.trialgo-loader.md .box1, .trialgo-loader.md .box2, .trialgo-loader.md .box3 { border-width: 16px; }
.trialgo-loader.lg { width: 168px; height: 168px; }
.trialgo-loader.lg .box1, .trialgo-loader.lg .box2, .trialgo-loader.lg .box3 { border-width: 24px; }

.box1, .box2, .box3 {
  border-color: #2563EB;
  box-sizing: border-box;
  position: absolute;
  display: block;
}

/* Scale all dimensions proportionally per size */
/* md (base): box dimensions as provided */
.trialgo-loader.md .box1 { width: 112px; height: 48px; margin-top: 64px; margin-left: 0px; animation: abox1 4s 1s forwards ease-in-out infinite; }
.trialgo-loader.md .box2 { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; animation: abox2 4s 1s forwards ease-in-out infinite; }
.trialgo-loader.md .box3 { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; animation: abox3 4s 1s forwards ease-in-out infinite; }

@keyframes abox1 {
  0% { width: 112px; height: 48px; margin-top: 64px; margin-left: 0px; }
  12.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  25% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  37.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  50% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  62.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 0px; }
  75% { width: 48px; height: 112px; margin-top: 0px; margin-left: 0px; }
  87.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  100% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
}

@keyframes abox2 {
  0% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  12.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  25% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  37.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 0px; }
  50% { width: 112px; height: 48px; margin-top: 0px; margin-left: 0px; }
  62.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  75% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  87.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  100% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
}

@keyframes abox3 {
  0% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  12.5% { width: 48px; height: 48px; margin-top: 0px; margin-left: 64px; }
  25% { width: 48px; height: 112px; margin-top: 0px; margin-left: 64px; }
  37.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  50% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  62.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  75% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  87.5% { width: 48px; height: 48px; margin-top: 64px; margin-left: 64px; }
  100% { width: 112px; height: 48px; margin-top: 64px; margin-left: 0px; }
}

/* Dark mode */
.dark .box1, .dark .box2, .dark .box3 {
  border-color: #F8FAFC;
}
```

**Usage contexts:**
- Full-page loading: Centered vertically + horizontally with "Loading..." text below (muted, 14px)
- Inline data loading: `sm` size next to content area
- Form submission: `sm` size replacing button text
- Pipeline processing: `md` with step labels below ("Scraping registries...", "Analyzing candidates...")

---

### 2.2 Aurora Background Component

```tsx
// components/ui/aurora-background.tsx
"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  showRadialGradient?: boolean;
}
```

**Implementation details:**
- Use CSS custom properties for aurora colors: `--blue-300: #93c5fd`, `--blue-400: #60a5fa`, `--blue-500: #3b82f6`, `--indigo-300: #a5b4fc`
- NO violet or purple — keep strictly blue-indigo monochrome
- `intensity` prop controls opacity: subtle=30%, medium=50%, strong=70%
- Animation: `animate-aurora` keyframe that shifts background-position over 15s infinite
- Radial gradient mask: ellipse at top-right, fading to transparent (creates light source effect)
- In dark mode: invert the white gradient to dark gradient, aurora becomes more visible
- Performance: use `will-change: transform`, `pointer-events: none` on aurora layer
- Children render above with `position: relative; z-index: 10`

**Use on these pages:**
- `/` (landing hero) — intensity: strong
- `/login`, `/register` — intensity: medium
- `/coordinator/login`, `/pharma/login` — intensity: medium
- `/404`, `/500` error pages — intensity: subtle

---

### 2.3 Page Transition Wrapper

```tsx
// components/ui/page-transition.tsx
"use client";
import { motion } from "framer-motion";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

Wrap every page's main content in this. The layout (sidebar, header) should NOT animate — only the content area transitions.

---

### 2.4 Animated Counter

```tsx
// components/ui/animated-counter.tsx
// Counts from 0 to target number when element enters viewport
// Uses IntersectionObserver + requestAnimationFrame
// Duration: 1.2s, ease: easeOutExpo
// Formats: number (1234), abbreviated (1.2K), percentage (87%)
```

---

### 2.5 Skeleton Components

Build shimmer skeletons for every data type:
- `SkeletonCard` — Card shape with title line + 2 body lines + badge placeholder
- `SkeletonTable` — Table header + 5 rows with alternating widths
- `SkeletonChart` — Chart area placeholder
- `SkeletonText` — Paragraph with 3 lines (90%, 100%, 60% width)
- `SkeletonAvatar` — Circle + text lines

Shimmer: `background: linear-gradient(90deg, var(--surface) 25%, var(--blue-50) 50%, var(--surface) 75%)` with `background-size: 200% 100%` animated left-to-right over 1.5s infinite.

---

### 2.6 Toast System (Sonner customized)

```tsx
// Customize Sonner toaster with:
// Position: top-right
// Max visible: 3
// Duration: 4000ms (with progress bar)
// Types: success (green left-border), error (red), warning (amber), info (blue)
// Animation: slide in from right + fade, exit slide up + fade
// Close button on hover
// Action button support (e.g., "Undo", "View")
```

---

### 2.7 Sidebar Component (Shared Shell)

Build ONE sidebar component that accepts `role` prop and renders role-specific navigation:

```tsx
// components/layout/app-sidebar.tsx
interface AppSidebarProps {
  role: 'patient' | 'coordinator' | 'pharma';
}

// Patient nav items:
// - Dashboard (LayoutDashboard icon)
// - My Trials (FlaskConical)
// - Symptom Log (HeartPulse)
// - Consent (FileCheck)
// - Chatbot (MessageCircle)
// - Profile (User)

// Coordinator nav items:
// - Cohort Dashboard (Users)
// - Anomalies (AlertTriangle)
// - Settings (Settings)

// Pharma nav items:
// - Analytics (BarChart3)
// - My Trials (FlaskConical)
// - Create Trial (PlusCircle)
// - Candidates (UserSearch)
// - Discovery (Globe)
// - FHIR Export (FileJson)
// - Settings (Settings)
```

**Sidebar behavior:**
- Fixed position, full height (100vh - header if header exists)
- Logo at top: "TrialGo" text + DNA icon, clickable → home
- Each nav item: icon (20px) + label (14px, medium)
- Active state: `bg-blue-50 text-blue-600 border-l-3 border-blue-600` (border animates from center outward 0.2s)
- Hover state: `bg-slate-50` (light mode), `bg-slate-800` (dark mode)
- Bottom section: User avatar (32px circle) + full name + role badge + logout button
- **Collapse behavior (desktop):** Toggle button at bottom — collapses to 64px showing only icons with tooltips
- **Mobile:** Hidden by default, triggered by hamburger in header, slides in from left with backdrop overlay (fade 0.2s), sidebar slides 0.3s ease
- Divider lines between nav groups (subtle, 1px)
- Role badge next to logo: "Patient" / "Coordinator" / "Pharma" in small colored pill

---

### 2.8 Data Table Component

Reusable table for Patients tab, Candidates list, Anomalies list:

```tsx
// components/ui/data-table.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  expandable?: boolean;
  renderExpanded?: (row: T) => ReactNode;
  pagination?: { page: number; total: number; perPage: number; };
  emptyState?: { icon: LucideIcon; title: string; description: string; action?: ReactNode; };
  onRowClick?: (row: T) => void;
}
```

**Features:**
- Column header click → sort (animated arrow indicator rotates)
- Search input above table (debounced 300ms)
- Expandable rows: click row → detail panel slides down (smooth height animation)
- Loading: skeleton rows shimmer
- Empty: centered illustration + text + optional CTA
- Alternating row colors: white / `#F8FAFC`
- Hover row: `bg-blue-50/50`
- Pagination: « 1 2 3 ... 12 » with current page highlighted blue
- Mobile: horizontal scroll with sticky first column

---

### 2.9 Stat Card Component

```tsx
// components/ui/stat-card.tsx
interface StatCardProps {
  title: string;           // "Total Enrolled"
  value: string | number;  // "847" or 847
  icon?: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down'; }; // +12% ↑
  badge?: { text: string; variant: 'success' | 'warning' | 'danger'; };
  miniChart?: ReactNode;   // Inline sparkline or mini donut
  loading?: boolean;
  animate?: boolean;       // Counter animation on mount
}
```

**Design:**
- White card, `border-radius: 16px`, `padding: 24px`
- Icon top-left in blue circle background (40px, `bg-blue-50`)
- Title: 14px, muted, uppercase tracking
- Value: 32px, bold, animates counting up on mount
- Trend: small text below value, green (up) or red (down) with arrow icon
- Hover: subtle lift + blue shadow
- Loading: skeleton pulse on value area

---

### 2.10 Modal/Dialog Component (Enhanced)

Use Radix Dialog under the hood but with these animations:

```
Open:  backdrop opacity 0→1 (0.2s), content scale(0.95)→scale(1) + opacity (0.25s, delay 0.05s)
Close: content opacity→0 + scale(0.98) (0.15s), backdrop opacity→0 (0.2s, delay 0.05s)
```

Add: close on Escape, close on backdrop click, focus trap, return focus on close.

---

## PART 3: MICRO-INTERACTIONS SPECIFICATION

### 3.1 Global Interaction Tokens

```css
/* Apply to ALL interactive elements */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Button interactions */
button:hover   → scale(1.02), background darken 5%, shadow-sm → shadow-md
button:active  → scale(0.98), transition 100ms
button:focus   → ring-2 ring-blue-500 ring-offset-2

/* Card interactions */
.card:hover    → translateY(-2px), shadow-sm → shadow-blue, transition 200ms
.card:active   → translateY(0px), transition 100ms

/* Link interactions */
a:hover        → color blue-600, text-decoration underline (animated slide from left)

/* Input interactions */
input:focus    → border-color blue-500, ring-2 ring-blue-100, label slides up + turns blue
input:invalid  → border-color red-500, ring-2 ring-red-100

/* Badge pulse (for anomaly alerts) */
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.badge-danger-pulse { animation: badge-pulse 2s ease-in-out infinite; }
```

### 3.2 Scroll-Triggered Animations

Use IntersectionObserver (threshold: 0.15) + Framer Motion:

```tsx
// Every section on landing page, every card grid:
const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  })
};
```

**Apply to:**
- Landing page sections (each section fades up on scroll)
- Stats cards (stagger 100ms between each)
- Feature grid cards (stagger 50ms)
- Trial cards on `/trials` (stagger 50ms per card)
- Table rows (stagger 30ms per row on initial load only)
- Timeline steps (stagger 200ms with line drawing between)

### 3.3 Specific Micro-Interactions by Component

**1. Number Counter (Stats)**
- Trigger: element enters viewport
- Animation: count from 0 to target using `requestAnimationFrame`
- Duration: 1200ms, easing: easeOutExpo
- Format: integers get commas (1,234), percentages get %, decimals to 1 place

**2. Progress Ring (Match Score)**
- SVG circle, stroke-dasharray animation
- Fills clockwise from top over 800ms on mount
- Color: >80% = green, 60-80% = amber, <60% = slate
- Center: percentage number (counter animated)

**3. Tab Indicator Bar**
- Blue underline bar (3px height, rounded full)
- Slides horizontally to active tab position
- Uses `layoutId` in Framer Motion for shared layout animation
- Duration: 250ms, spring easing

**4. Sidebar Active Item**
- Left border: grows from center (height 0→100%) over 200ms
- Background: fades in from transparent to blue-50 over 150ms
- Text color: transitions to blue-600 over 150ms
- Icon: transitions to blue-600 simultaneously

**5. Form Field Focus**
- Label: translates from inside input (placeholder position) to above input
- Label color: muted → blue-600
- Border: slate-200 → blue-500
- Ring: 0 → 4px blue-100 glow
- All over 200ms ease

**6. Multi-step Form Transitions**
- Forward (Next): current step slides out left + fades, new step slides in from right + fades in
- Backward (Back): current step slides out right + fades, new step slides in from left + fades in
- Progress bar: width animates smoothly (spring easing, 400ms)
- Step number: scale bounce on activation (1 → 1.1 → 1, 300ms)

**7. Card Expand/Collapse (Accordion, Table Row Expand)**
- Height: animate from 0 to auto (use `framer-motion` `animate={{height: "auto"}}`)
- Content: fade in after height completes (50ms delay)
- Chevron: rotates 180° over 200ms
- Other rows: don't shift (use absolute positioning or proper layout)

**8. Toast Notifications**
- Enter: translateX(120%) → translateX(0) with spring easing
- Progress bar: width animates from 100% to 0% over duration (4s default)
- Exit: opacity 1→0 + translateY(-10px) over 200ms
- Stack: new toasts push existing ones down (animate position)

**9. Chatbot Messages**
- New message: slides up from bottom (20px) + fades in over 200ms
- Typing indicator: 3 dots with staggered bounce animation (each dot 100ms delay)
- Send button: rotates 45° on click (arrow → diagonal → back)

**10. Dropdown/Select Open**
- Scale from 0.95 to 1 + opacity, origin from top
- Duration: 150ms
- Items: stagger 20ms fade-in on open
- Selected item: blue-50 background + checkmark appears

**11. Drag & Drop Zone (File Upload)**
- Default: dashed border (blue-300), icon centered
- Dragover: border becomes solid, background blue-50, icon scales up 1.1, "Drop here" text appears
- File dropped: checkmark animation, file name slides in from left
- Invalid file: shake animation (translateX -5px, 5px, -3px, 3px, 0) over 300ms + red border flash

**12. Real-time WebSocket Updates (Coordinator Dashboard)**
- New data: affected card/number has brief blue glow (box-shadow pulse once)
- New anomaly: slides into feed from top, brief yellow/red flash on card
- Counter update: number morphs (old fades up + out, new fades down + in)
- "Live" indicator: green dot with perpetual pulse ring expanding outward

---

## PART 4: ROUTE-BY-ROUTE IMPLEMENTATION

---

### ROUTE 1: `/` — Landing Page

**File:** `app/page.tsx`  
**Layout:** No sidebar, no header (custom landing header within page)  
**Background:** White base with Aurora on hero section

#### Section 1: Header (Sticky)

```
┌─────────────────────────────────────────────────────────────────┐
│  🧬 TrialGo          Features  How it Works  Pharma  Patients   │
│                                               [Login] [Get Started]│
└─────────────────────────────────────────────────────────────────┘
```

- Position: fixed top, z-50, full width
- Default: transparent background (text white on aurora hero)
- After 80px scroll: white background + `shadow-xs` + border-bottom + text switches to dark
- Transition: background 0.3s, box-shadow 0.3s
- Logo: "TrialGo" (bold, 20px) + DNA helix icon (20px, animated subtle rotation on hover)
- Nav links: 14px medium, hover → blue color + underline slide from left
- Buttons: "Login" = ghost (border white → border blue after scroll), "Get Started" = solid blue pill
- Mobile: hamburger icon → full-screen menu slides down

#### Section 2: Hero (Aurora Background)

```
┌─────────────────────────────────────────────────────────────────┐
│              ╔══════════════════════════════╗                    │
│              ║   AI-Powered Clinical Trial  ║                    │
│              ║      Recruitment             ║                    │
│              ║                              ║                    │
│              ║  Connect patients to life-   ║                    │
│              ║  saving trials with 12...    ║                    │
│              ║                              ║                    │
│              ║  [Find Trials] [For Pharma]  ║                    │
│              ╚══════════════════════════════╝                    │
│                                                                  │
│         ┌──────────── Dashboard Mockup ────────────┐            │
│         │  (floating, parallax on scroll)           │            │
│         └───────────────────────────────────────────┘            │
│                                                                  │
│    Trusted by:  [Logo] [Logo] [Logo] [Logo] [Logo]              │
└─────────────────────────────────────────────────────────────────┘
```

- Height: 100vh (minimum), flexbox centered
- Aurora component (intensity: strong) as absolute background
- Headline: 56px/64px bold white, max-width 700px, centered
- Subheadline: 18px white/80%, max-width 560px, centered, 16px margin-top
- CTAs: 24px margin-top, gap 16px
  - "Find Trials" — white bg, blue text, rounded-full, padding 16px 32px, hover scale(1.02)
  - "For Pharma Teams" — transparent bg, white border, white text, rounded-full, hover bg-white/10
- Dashboard mockup: positioned below text, 60% width, rounded-xl shadow-2xl, slight rotateX(2deg)
  - Parallax: moves up 30px as user scrolls down 300px (smooth, requestAnimationFrame)
- Trusted by: 80px below mockup, logos grayscale at 40% opacity, fade in staggered
- Scroll indicator: animated chevron bouncing at bottom of viewport

#### Section 3: Stats

```
┌────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 🌐  18   │  │ 🤖  12   │  │ 📡  40+  │  │ ⚡ Real- │     │
│  │Registries│  │AI Agents │  │Endpoints │  │  time    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└────────────────────────────────────────────────────────────────┘
```

- Background: white (contrast from aurora section above)
- 4 cards in grid (responsive: 4 cols → 2 → 1)
- Each card: icon in blue circle (48px bg), number (32px bold, animated counter), label (14px muted)
- Cards: white surface, shadow-sm, rounded-xl, padding 32px, text-center
- Stagger animation: 100ms between cards on scroll reveal
- Divider line above section (subtle gradient blue → transparent → blue)

#### Section 4: Features Grid

```
┌────────────────────────────────────────────────────────────────┐
│  "Everything You Need for Trial Success"                        │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ 🎯 Smart Match  │  │ 📋 Consent      │  │ 🛡️ Dropout     ││
│  │ AI matches...   │  │ Simplified...   │  │ Prevention...   ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ 🔍 Anomaly     │  │ 🏥 FHIR Export  │  │ 🌍 Multilingual ││
│  │ Detection...    │  │ Standard...     │  │ 9+ languages... ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

- Section heading: H2 centered + subtitle (muted, 16px)
- 3x2 grid (responsive: 3→2→1 columns)
- Each card:
  - Padding: 32px
  - Icon: 48px in light blue circle
  - Title: H3, 4px below icon
  - Description: body-sm, muted, 8px below title, max 2 lines
  - Hover: translateY(-2px) + shadow-blue + blue left-border appears (width 0→4px, from center)
  - Stagger reveal: 50ms per card

#### Section 5: How It Works

```
┌────────────────────────────────────────────────────────────────┐
│  "How TrialGo Works"                                            │
│                                                                  │
│     ①──────────────②──────────────③                            │
│  Register &      AI Matches      Enroll &                       │
│  Profile         You              Monitor                       │
│                                                                  │
│  Create your     Our 12 agents   Sign consent,                  │
│  medical profile find perfect    track health,                  │
│  in minutes      trial matches   stay supported                 │
└────────────────────────────────────────────────────────────────┘
```

- Background: `#FAFBFC` (slight contrast)
- 3 steps horizontally (stacked vertically on mobile)
- Each step: numbered circle (48px, blue border, white fill; active = blue fill white text)
- Connecting line: SVG path, draws itself on scroll (stroke-dashoffset animation 1s per segment)
- Below each circle: icon/illustration (64px), title (H3), description (body-sm, muted)
- Mobile: vertical layout with line going down

#### Section 6: For Pharma

- Split layout: text left (50%), image right (50%)
- Left: H2 + subtitle + 4 bullet points (each with blue checkmark icon) + CTA button
- Right: screenshot/mockup of pharma dashboard (rounded-xl, shadow-xl, slight perspective tilt)
- Scroll reveal: text slides from left, image slides from right

#### Section 7: Footer

- Background: slate-900 (dark), text white/slate-300
- 4 columns:
  - Product: Features, Pricing, Documentation, API
  - Company: About, Careers, Blog, Contact
  - Legal: Privacy Policy, Terms of Service, HIPAA Compliance, Cookie Policy
  - Connect: Twitter, LinkedIn, GitHub + Newsletter input
- Newsletter: input (dark bg, white text, placeholder muted) + "Subscribe" button (blue)
- Bottom bar: copyright + "Built with ❤️ for clinical research"
- Separation line: subtle slate-700 border-top above bottom bar

---

### ROUTE 2: `/register` — Registration

**File:** `app/register/page.tsx`  
**Layout:** Full screen, no sidebar  
**Background:** Aurora (intensity: medium, dimmed)

#### Overall Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    AURORA BACKGROUND (dimmed)                     │
│                                                                  │
│              ┌──────────────────────────────┐                    │
│              │  ● ● ○  (progress dots)      │                    │
│              │                              │                    │
│              │  Step Title                  │                    │
│              │                              │                    │
│              │  [Form Content]              │                    │
│              │                              │                    │
│              │  [Back]          [Continue]  │                    │
│              └──────────────────────────────┘                    │
│                                                                  │
│              Already have an account? Login                      │
└─────────────────────────────────────────────────────────────────┘
```

- Card: max-width 480px, white, rounded-2xl, shadow-xl, padding 40px
- Centered both horizontally and vertically
- Progress dots: 3 dots at top, active = blue filled, completed = blue filled + checkmark, upcoming = gray outline
- "Already have an account? Login" link below card

#### Step 1: Role Selection

**Heading:** "Join TrialGo" (H2) + "Select your role to get started" (muted)

```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │  👤  Patient                    │  │
│  │  Find and enroll in clinical   │  │
│  │  trials matching your profile  │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  📋  Coordinator               │  │
│  │  Monitor enrolled patients     │  │
│  │  and manage trial cohorts      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  🏢  Pharma                    │  │
│  │  Create trials and recruit     │  │
│  │  candidates with AI            │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

- 3 role cards stacked vertically, full width within the form card
- Each: padding 20px, rounded-xl, border 2px solid slate-200
- Icon (32px) + role name (16px semibold) + description (14px muted)
- Hover: border-blue-200, bg-blue-50/50, translateY(-1px)
- Selected: border-blue-500, bg-blue-50, blue checkmark in top-right corner (animated scale bounce)
- Transition: all 200ms ease
- "Continue" button: disabled until selection made (opacity 50%, not clickable)

#### Step 2: Account Details

**Heading:** "Create your account" (H2)

**Fields (stacked, full width, 16px gap):**

1. **Full Name** — text input, floating label
2. **Email** — email input, floating label, real-time validation (debounced check if exists)
3. **Phone Number** — tel input with country code selector (dropdown left, flag + code), floating label
4. **Password** — password input, floating label, show/hide toggle (eye icon)
   - Below: password strength bar (4 segments: weak=red, fair=amber, good=blue, strong=green)
   - Below bar: requirements checklist (8+ chars ✓, uppercase ✓, number ✓, special ✓) — each turns green when met
5. **Confirm Password** — password input, floating label, mismatch error inline

**Floating Label Behavior:**
- Default: label sits inside input (16px, muted color, translateY(0))
- Focus/filled: label moves up (translateY(-24px)), shrinks (12px), turns blue
- Transition: 200ms ease
- Error: label turns red, input border red, error message appears below (14px red, slides down)

**Validation:**
- All fields required
- Email: valid format + unique check (API call, debounced 500ms)
- Phone: valid format for selected country
- Password: minimum 8 chars, 1 uppercase, 1 number, 1 special
- Confirm: must match password

#### Step 3: OTP Verification

**Heading:** "Verify your phone" (H2) + "We sent a 6-digit code to +91 ****1234" (muted)

```
┌──────────────────────────────────────┐
│     ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐      │
│     │ │ │ │ │ │ │ │ │ │ │ │        │
│     └─┘ └─┘ └─┘ └─┘ └─┘ └─┘      │
│                                      │
│     Didn't receive? Resend (0:42)   │
│                                      │
│     [Verify & Complete]              │
└──────────────────────────────────────┘
```

- 6 individual input boxes (48px × 48px each, centered, gap 8px)
- Each box: rounded-lg, border-2 slate-200, text-center, font-size 24px bold
- Focus: border-blue-500, shadow ring
- Auto-advance: typing a digit moves focus to next box
- Backspace: moves to previous box
- Paste: splits 6-digit code across all boxes
- "Resend" link: disabled with countdown (60s), muted text, becomes blue link when timer ends
- On verify: loader appears in button, then:
  - Success: all boxes turn green border, checkmark animation (SVG draws itself), auto-redirect after 1.5s
  - Failure: boxes shake (translateX -5, 5, -3, 3, 0 over 300ms), turn red, "Invalid code" error

#### Form Submission Flow

- "Continue" button: full width, blue, 48px height, rounded-lg
- Loading state: text replaced by spinner (white, 20px), button stays same width
- On final step success: TrialGo loader briefly, then redirect to `/onboarding/questionnaire` (patient) or respective dashboard

---

### ROUTE 3: `/login` — Patient Login

**File:** `app/login/page.tsx`  
**Layout:** Split screen (desktop), full form (mobile)

#### Desktop Layout

```
┌──────────────────────────────┬─────────────────────────────────┐
│                              │                                   │
│     AURORA BACKGROUND        │     "Welcome Back"                │
│                              │                                   │
│     🧬 TrialGo              │     Email: _______________        │
│                              │     Password: ____________        │
│     "Connecting patients     │                                   │
│      to life-saving          │     □ Remember me    Forgot?      │
│      clinical trials"        │                                   │
│                              │     [Sign In]                     │
│     [floating medical        │                                   │
│      illustrations]          │     ─── or ───                    │
│                              │                                   │
│                              │     Don't have an account?        │
│                              │     Register →                    │
│                              │                                   │
│                              │     ──────────────                │
│                              │     Coordinator? | Pharma?        │
└──────────────────────────────┴─────────────────────────────────┘
         60% width                        40% width
```

**Left Panel (hidden on mobile):**
- Aurora background (intensity: medium)
- Logo: large (32px text), white
- Tagline: 20px, white/80%, max-width 300px
- Floating illustrations: 2-3 abstract medical/science SVG elements with gentle float animation (translateY 10px up/down, 6s infinite ease-in-out, staggered starts)
- Entire panel: flex column, justify-center, padding 80px

**Right Panel:**
- White background, flex column, justify-center, padding 48px (desktop) / 24px (mobile)
- "Welcome Back" (H1-DASH, 32px)
- "Sign in to your account" (muted, 16px, 8px below)
- Form (24px below):
  - Email input with floating label
  - Password input with floating label + show/hide toggle
  - Row: "Remember me" checkbox (left) + "Forgot password?" link (right, blue, 14px)
  - "Sign In" button: full width, blue, 48px, rounded-lg, 24px margin-top
    - Loading: spinner replaces text
    - Success: brief green flash, redirect
    - Error: button shakes, toast appears
- Divider: "or" with lines either side (flex row, gap 16px, line = border-top flex-1)
- "Don't have an account? **Register**" (16px, register is blue link)
- Bottom section (40px margin-top): "Are you a **Coordinator**?" / "Are you **Pharma**?" — links to respective login pages

**Mobile:**
- Full width, no split
- Aurora as subtle background gradient at top (fading into white)
- Logo centered at top
- Form below with same structure

---

### ROUTE 4: `/coordinator/login` — Coordinator Login

**File:** `app/coordinator/login/page.tsx`  
**Same split layout as patient login with these differences:**

- Left panel: Coordinator-themed — illustration shows a dashboard/monitoring graphic
- Badge above heading: "Coordinator Portal" — small blue-outlined pill badge
- No "Forgot password?" (coordinators use admin reset)
- Bottom link: "Patient login" / "Pharma login"
- After login: redirect to `/coordinator/cohort`

---

### ROUTE 5: `/pharma/login` — Pharma Login

**File:** `app/pharma/login/page.tsx`  
**Same split layout with differences:**

- Left panel: Pharma-themed — illustration shows pipeline/AI agent flow graphic
- Badge: "Pharma Portal" pill
- Optional additional field: "Company Name" (below email)
- Bottom link: "Patient login" / "Coordinator login"
- After login: redirect to `/pharma/analytics`

---

### ROUTE 6: `/dashboard` — Patient Dashboard

**File:** `app/dashboard/page.tsx`  
**Layout:** Patient sidebar + main content  
**Auth:** Protected, role=patient

#### Header Bar

```
┌─────────────────────────────────────────────────────────────────┐
│  My Dashboard                            Good morning, Sarah 🔔  │
└─────────────────────────────────────────────────────────────────┘
```

- Sticky top within content area (not overlapping sidebar)
- Left: page title (H1-DASH)
- Right: greeting (14px, muted) + notification bell icon (24px, relative)
  - Bell has red dot (8px circle, absolute top-right) if unread notifications
  - Bell click: dropdown with notification list (max 5, "View all" link)

#### Stats Row (3 cards)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🧪 Enrolled │  │ 📋 Tasks Due │  │ 💚 Health   │
│     3        │  │     2        │  │   Good       │
│   trials     │  │  this week   │  │  (green)     │
└──────────────┘  └──────────────┘  └──────────────┘
```

- Use `StatCard` component
- "Health Score" card has badge: GREEN=green, AMBER=amber badge with text
- Cards animate in on mount (stagger 100ms)
- Responsive: 3 cols → 1 col on mobile

#### Enrolled Trials Section

**Heading:** "Your Trials" (H2) + "View All" link (right-aligned)

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ █ Trial: BEACON-CRC Phase III           │ │
│ │   Colorectal Cancer | Recruiting         │ │
│ │   Match: ████████░░ 82%   Enrolled 3/12 │ │
│ │   ────────                               │ │
│ │   Enrolled: Jan 15, 2025                 │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ █ Trial: NOVA-DM2 Phase II              │ │
│ │   Type 2 Diabetes | Active               │ │
│ │   Match: ██████████ 94%   Enrolled 1/5  │ │
│ │   ────────                               │ │
│ │   Pending Consent ⚠️                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- Card per enrolled trial:
  - Blue left accent bar (4px, rounded)
  - Trial title (H3) + disease badge (pill) + status badge (pill, colored)
  - Match score: horizontal progress bar (colored by tier) + percentage text
  - Enrollment date or pending action (amber warning if consent pending)
  - Click → navigates to `/trials/[id]`
  - Hover: lift + blue shadow
- Empty state: illustration (person looking at empty folder) + "No trials yet" + "Browse Trials" blue CTA
- Loading: 3 skeleton cards with shimmer

#### Recent Activity

**Heading:** "Recent Activity" (H3)

- Vertical timeline (thin line left, colored dots)
- Each entry: dot (8px) + icon (16px) + description + timestamp (muted, relative "2 hours ago")
- Types:
  - Green dot: "Consent signed for BEACON-CRC"
  - Blue dot: "Symptom log submitted"
  - Amber dot: "New trial match available"
  - Gray dot: "Profile updated"
- Max 5 entries shown, "View all" link at bottom
- Stagger animation on mount

---

### ROUTE 7: `/trials` — Trial Discovery

**File:** `app/trials/page.tsx`  
**Layout:** Patient sidebar + main content  
**Auth:** Protected, role=patient

#### Search & Filters

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍  Search trials by condition, location, or keyword...        │
├─────────────────────────────────────────────────────────────────┤
│  [Oncology] [Cardiology] [Diabetes] [Phase II] [Phase III] [+] │
│                                                                  │
│  Showing 12 active trials matching your profile                  │
└─────────────────────────────────────────────────────────────────┘
```

- Search: full-width input, 48px height, rounded-xl, left icon (Search, 20px muted)
  - Debounced 300ms, shows inline spinner while searching
  - Clear button (X) appears when text entered
- Filter chips: horizontal scrollable row (24px below search)
  - Each chip: pill shape, padding 8px 16px, rounded-full, 14px medium
  - Default: bg-slate-100, text-slate-600, border transparent
  - Active: bg-blue-50, text-blue-600, border-blue-200
  - Click toggles on/off
  - "+" button at end: opens modal with all filter categories
- Results count: 14px, muted, 16px below filters

#### Trial Cards Grid

```
┌────────────────────────┐  ┌────────────────────────┐
│ ████████████████████   │  │ ████████████████████   │
│ BEACON-CRC Phase III   │  │ NOVA-DM2 Phase II     │
│ Pfizer Inc.            │  │ Novo Nordisk           │
│                        │  │                        │
│ [Colorectal] [Phase 3] │  │ [Diabetes] [Phase 2]   │
│                        │  │                        │
│ Advanced immunotherapy │  │ Novel GLP-1 agonist    │
│ for stage III-IV...    │  │ combination therapy... │
│                        │  │                        │
│ Match: ⬤ 87%          │  │ Match: ⬤ 72%          │
│                        │  │                        │
│ [View Details] [Apply] │  │ [View Details] [Apply] │
└────────────────────────┘  └────────────────────────┘
```

- Grid: 2 columns desktop, 1 mobile, gap 24px
- Each card:
  - Top accent: 4px blue-500 top border (or gradient blue-400 → blue-600)
  - Padding: 24px
  - Title: H3, 1 line, truncate with ellipsis
  - Sponsor: 14px muted, 4px below
  - Badges row: disease pill + phase pill (8px gap), 12px below sponsor
    - Disease badge: bg-blue-50, text-blue-700, rounded-sm
    - Phase badge: bg-slate-100, text-slate-600, rounded-sm
  - Description: body-sm, muted, 2 lines max (line-clamp-2), 12px below badges
  - Match score: 16px below description
    - Circle indicator (12px) colored by tier + percentage text (16px semibold)
    - >80%: green circle + green text
    - 60-80%: amber
    - <60%: slate gray
  - Actions row: 16px below match, flex justify-between
    - "View Details": outline button (slate border, slate text, hover → blue)
    - "Apply": solid blue button
  - Hover: translateY(-2px) + shadow-blue, 200ms
  - Enter animation: stagger 50ms per card, fade up 10px

- **Pagination** (below grid, 40px margin-top):
  - « Previous | 1 | 2 | **3** | 4 | ... | 12 | Next »
  - Current page: blue bg, white text, rounded
  - Others: transparent, hover blue-50

- **Loading state:** 4 skeleton cards (2x2 grid) with shimmer
- **Empty state:** "No trials match your criteria" + "Try adjusting your filters" + clear filters button

---

### ROUTE 8: `/trials/[id]` — Trial Detail

**File:** `app/trials/[id]/page.tsx`  
**Layout:** Patient sidebar + main content (max-width 800px)  
**Auth:** Protected, role=patient

#### Breadcrumb + Hero

```
Trials > BEACON-CRC Phase III

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  BEACON-CRC Phase III                                           │
│  Pfizer Inc.                                                    │
│                                                                  │
│  [Recruiting ●] [Phase III] [Colorectal Cancer]     ┌────┐     │
│                                                      │ 87%│     │
│                                                      │ ⬤  │     │
│                                                      └────┘     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Overview]  [Eligibility]  [Timeline]  [Apply]                  │
│   ═══════                                                        │
└─────────────────────────────────────────────────────────────────┘
```

- Breadcrumb: "Trials" (blue link) > "Trial Name" (muted)
- Title: H1-DASH (32px)
- Sponsor: 16px muted, 4px below
- Badges row: status + phase + disease (same pill style as card)
- Match score ring: positioned right (desktop), below title (mobile)
  - SVG circle, 80px diameter
  - Stroke fills clockwise from top on mount (800ms, ease-out)
  - Center: percentage number (animated counter)
  - Color by tier

- **Tab navigation:**
  - 4 tabs horizontally, 14px medium text
  - Active: blue text + animated underline bar (3px, blue, rounded-full, slides with layoutId)
  - Inactive: muted text, hover → blue-600
  - Content below crossfades (opacity 0→1, 200ms)

#### Overview Tab

- Description paragraph (body, 16px)
- Key details grid (2x3 on desktop, 1x6 on mobile):
  - Each cell: label (caption, muted, uppercase) + value (body, semibold)
  - Cells: Start Date, End Date, Target Enrollment, Current Enrollment, Location, Primary Contact
  - Grid has subtle borders between cells

#### Eligibility Tab

```
┌──────────────────────────────┬──────────────────────────────┐
│  ✅ Inclusion Criteria        │  ❌ Exclusion Criteria        │
│                              │                              │
│  ✓ Age 18-75                 │  ✗ Prior chemotherapy        │
│  ✓ Confirmed diagnosis       │  ✗ Active autoimmune disease │
│  ✓ ECOG score 0-2           │  ✗ Pregnant or nursing       │
│  ✓ Adequate organ function   │  ✗ HIV positive              │
└──────────────────────────────┴──────────────────────────────┘
```

- Two columns (stacked on mobile)
- Left column: green theme (green-500 checkmarks)
- Right column: red theme (red-500 X marks)
- Each criterion: icon (16px) + text (14px), 12px gap between rows
- Columns have subtle colored top borders (green-200 / red-200)

#### Timeline Tab

- Vertical timeline (line on left, 2px, slate-200)
- Milestone nodes: circle (12px), connected by line
- Past milestones: blue filled circle, bold text
- Current: blue pulsing ring
- Future: gray outline circle, muted text
- Each node: date (caption muted) + milestone name (body medium) + description (small muted)

#### Apply Tab

**Multi-step form within the tab:**

Step indicators (mini dots, inside tab content)

**Step 1: Medical Conditions**
- "Select your current conditions" (H3)
- Searchable multi-select (combobox): type to search ICD-10 codes + condition names
- Selected: appear as removable tags below input
- Each tag: blue-50 bg, blue text, X button

**Step 2: Current Medications**
- Dynamic rows: each row = medication name + dosage + frequency
- "Add Medication" button (+ icon, outline)
- Remove: trash icon (red on hover), row animates out (height collapse)
- Add: new row slides in from top

**Step 3: Symptoms & Severity**
- List of symptoms (from conditions selected)
- Each: symptom name + severity slider (1-10)
- Slider track: gradient green→yellow→red
- Thumb: blue circle, shows value on drag (tooltip above thumb)

**Step 4: Review**
- Summary of all entered data in readonly format
- Edit buttons per section (pencil icon, navigates back to that step)
- "Submit Application" button (blue, large)
- Disclaimer checkbox: "I confirm this information is accurate"

**On submit:**
- Button shows loader
- Success: confetti animation (subtle, 2 seconds) + success message card appears
- Card: green checkmark (animated draw) + "Application Submitted!" + "You'll hear back within 48 hours" + "Back to Dashboard" button
- Failure: error toast + form stays editable

**Mobile sticky bar:**
- Fixed bottom, white bg, shadow upward, padding 16px
- "Apply Now" button full width (navigates to Apply tab + scrolls to form)

---

### ROUTE 9: `/patient/symptom-log` — Weekly Symptom Log

**File:** `app/patient/symptom-log/page.tsx`  
**Layout:** Patient sidebar + main content  
**Auth:** Protected, role=patient

```
┌─────────────────────────────────────────────────────────────────┐
│  Weekly Symptom Log          Trial: [BEACON-CRC ▼]              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                │
│  │Mon│Tue│Wed│Thu│Fri│Sat│Sun│  Week of Jan 13-19              │
│  │ ✓ │ ✓ │ ✓ │   │   │   │   │                                │
│  └───┴───┴───┴───┴───┴───┴───┘                                │
│                                                                  │
│  Symptoms:                                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ + Add symptom...    [Fatigue ✕][Nausea✕]│                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  Fatigue:     ●───────────●───── 6/10                          │
│  Nausea:      ●──●──────────────  3/10                          │
│                                                                  │
│  Notes: ____________________________________                    │
│                                                                  │
│  How are you feeling overall?                                    │
│  😊  🙂  😐  🙁  😣                                          │
│                                                                  │
│  [Submit Log]                                                    │
├─────────────────────────────────────────────────────────────────┤
│  Past Entries                                          ▼ Expand  │
│  ┌─────────────────────────────────────────┐                    │
│  │ Week of Jan 6-12 | Avg severity: 4.2    │                    │
│  │ Week of Dec 30-5 | Avg severity: 3.8    │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Trial selector** (top right): dropdown if enrolled in multiple trials
2. **Week calendar**: 7-day row showing current week
   - Each day: circle (32px), date number inside
   - Today: blue border
   - Logged days: green fill + white checkmark
   - Past unlogged: amber border
3. **Symptom selector**: combobox with search, selected symptoms appear as removable tags
4. **Severity sliders**: per symptom
   - Custom slider with gradient track (green at 1, yellow at 5, red at 10)
   - Blue thumb (24px)
   - Current value displayed right of slider
   - Value label follows thumb position
5. **Notes**: textarea, optional, 120px height
6. **Overall feeling**: 5 emoji buttons in a row
   - Default: all gray/muted
   - Selected: scales up 1.2 + full color + blue ring below
   - Animation: bounce on select (scale 1→1.2→1.1, 300ms)
7. **Submit**: blue button, full width
   - Success: green toast "Symptom log saved for this week"
8. **Past entries**: accordion list
   - Each: week range + average severity + chevron
   - Expanded: shows all symptoms with their severity bars (readonly)
   - Stagger animation on open

---

### ROUTE 10: `/onboarding/questionnaire` — Medical Questionnaire

**File:** `app/onboarding/questionnaire/page.tsx`  
**Layout:** Full screen, no sidebar, progress bar fixed at top  
**Auth:** Protected, role=patient (only shown once, on first login)

#### Overall Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ████████████░░░░░░░░░░░░░░░░  Step 2 of 7                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ②                                                            │
│    Medical History                                               │
│    Tell us about your health conditions                          │
│                                                                  │
│    ┌─────────────────────────────────────┐                      │
│    │                                     │                      │
│    │  [FORM CONTENT FOR THIS STEP]       │                      │
│    │                                     │                      │
│    └─────────────────────────────────────┘                      │
│                                                                  │
│    [← Back]                    [Next →]                          │
│                                                                  │
│    ─ ─ ─ ─ ─ Auto-saved ✓ ─ ─ ─ ─ ─                          │
└─────────────────────────────────────────────────────────────────┘
```

**Progress bar (fixed top, full width):**
- Height: 4px, blue gradient fill
- Width percentage animates smoothly between steps (spring, 400ms)
- Step indicator (right of bar): "Step 2 of 7" — small, muted

**Content area:** max-width 640px, centered, padding 48px vertical

**Step number:** large (48px), blue circle with white number (positioned left)  
**Step title:** H2 (right of number)  
**Step description:** muted body text below

**Step transitions:**
- Forward: current slides out left + fades, new slides in from right + fades in (250ms)
- Back: reverse direction
- Use AnimatePresence with direction-aware variants

**Steps detailed:**

**Step 1: Demographics**
- Age: number input (or date of birth date picker)
- Gender: radio group (Male, Female, Non-binary, Prefer not to say) — pill-shaped radio buttons
- Ethnicity: searchable select (multi-select)
- Location: country + city inputs (city autocomplete)

**Step 2: Medical History**
- Chronic conditions: combobox with ICD-10 search
  - As user types, suggestions show code + condition name
  - Selected: tag pills below input with remove button
- Previous diagnoses: same pattern
- Allergies: text input with "Add" button → tag list

**Step 3: Current Medications**
- Dynamic row pattern:
  - Row: [Medication Name] [Dosage] [Frequency dropdown (daily/weekly/etc)]
  - "+ Add Medication" button: adds row with slide-in animation
  - Remove: trash icon on row, row collapses out (height animation)
  - Min 0, max 20 rows

**Step 4: Current Symptoms**
- Symptom input (searchable, multi-select)
- Per selected symptom: severity slider (1-10) with gradient track
- Duration dropdown per symptom (days/weeks/months/years)

**Step 5: Lifestyle**
- Smoking: icon-based selector (3 options: Never / Former / Current) — card-style selection
- Alcohol: similar (Never / Occasional / Regular)
- Exercise: frequency selector (None / 1-2x/wk / 3-4x/wk / Daily)
- Each option: icon + label, card-select pattern (border highlight + blue check)

**Step 6: Trial Preferences**
- Preferred conditions/areas: multi-select pills
- Locations: "Near me" toggle + radius slider (10-500 km)
- Travel willingness: toggle (yes/no)
- Trial phase preference: checkbox group (Phase I, II, III, IV)

**Step 7: Review**
- All answers displayed in readonly summary cards (grouped by step)
- Each section has "Edit" button (pencil icon) → navigates to that step
- Summary card per step: title + content preview
- Bottom: "Submit Profile" button (large, blue, full width)
- Below button: "You can update this anytime in Settings"

**On final submit:**
- TrialGo loader briefly
- Success screen: 
  - Large green checkmark (animated SVG draw)
  - "Profile Complete!" heading
  - "We'll start matching you with trials" subtext
  - Subtle confetti (CSS particles, 3 seconds, then fades)
  - "Go to Dashboard" button auto-appears after 2s

**Auto-save:**
- Debounced save on every field change (1s after last keystroke)
- Indicator: "Saved ✓" text (muted, bottom center) — appears on save, fades after 2s

---

### ROUTE 11: `/consent` — Consent Management

**File:** `app/consent/page.tsx`  
**Layout:** Patient sidebar + main content  
**Auth:** Protected, role=patient

#### If Multiple Pending Consents

Show selector at top: dropdown or card selector per trial needing consent

#### Main Consent Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Consent Form — BEACON-CRC Phase III                            │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [View Original]  [View Simplified ✨]                     │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │                                                     │ │  │
│  │  │  CONSENT DOCUMENT CONTENT                           │ │  │
│  │  │  (Scrollable, 500px max-height)                     │ │  │
│  │  │                                                     │ │  │
│  │  │  📘 Key Obligation:                                 │ │  │
│  │  │  You agree to weekly check-ins...                   │ │  │
│  │  │                                                     │ │  │
│  │  │  📗 Your Right:                                     │ │  │
│  │  │  You may withdraw at any time...                    │ │  │
│  │  │                                                     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Form Fields:                                                    │
│  Full Name: _______________                                      │
│  Date of Birth: ___/___/____                                     │
│  Emergency Contact: _______________                              │
│                                                                  │
│  Signature:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │  (Draw your signature here)                                 ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│  [Clear]                                                         │
│  Or type your name: _______________                              │
│                                                                  │
│  ☐ I have read and understand this consent form                  │
│                                                                  │
│  [Submit Consent]                                                │
│                                                                  │
│  ▶ View Audit Trail                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Document viewer:**
- Toggle tabs: "View Original" / "View Simplified ✨"
  - Original: rendered PDF (use iframe or react-pdf)
  - Simplified: AI-generated plain English version
    - Key obligations: blue callout box (border-left blue, bg blue-50)
    - Rights: green callout box (border-left green, bg green-50)
    - Risks: amber callout box
- Scrollable container: max-height 500px, internal scroll with fade gradient at bottom

**Form fields:**
- Dynamically extracted from consent template ({{name}}, [[dob]], etc.)
- Each rendered as appropriate input type with floating label
- Required fields marked with red asterisk

**Signature pad:**
- Canvas element (full width, 150px height, border rounded-lg, bg slate-50)
- Touch/mouse drawing
- "Clear" button below (outline, small)
- Alternative: typed name input below with "Or type your name:"
- Signature stored as image data URL, uploaded to S3

**Confirmation:**
- Checkbox: "I have read and understand this consent form" — required
- "Submit Consent" button: blue, full width, disabled until checkbox + signature
- Loading: TrialGo loader in button
- Success: green banner slides down from top + "Consent submitted successfully. You are now enrolled." + redirect countdown

**Audit trail (expandable):**
- Accordion section at bottom
- Timeline format: "Document viewed — Jan 15, 4:32 PM", "Form started — Jan 15, 4:35 PM", "Signed — Jan 15, 4:41 PM"
- Each entry: timestamp + action + IP (masked partially)

---

### ROUTE 12: `/chatbot` — Trust Chatbot

**File:** `app/chatbot/page.tsx`  
**Layout:** Minimal — optional thin sidebar or standalone  
**Auth:** Protected, role=patient

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🧬 TrialGo Assistant         ● Online                      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                             ││
│  │  ┌──────────────────────────┐                               ││
│  │  │ Hi Sarah! I'm here to   │                               ││
│  │  │ help you understand your │                               ││
│  │  │ trial enrollment. What   │                               ││
│  │  │ would you like to know?  │                               ││
│  │  └──────────────────────────┘                               ││
│  │                                                             ││
│  │                    ┌─────────────────────┐                  ││
│  │                    │ What are the risks? │                  ││
│  │                    └─────────────────────┘                  ││
│  │                                                             ││
│  │  ┌──────────────────────────┐                               ││
│  │  │ Great question! Let me   │                               ││
│  │  │ explain the known risks  │                               ││
│  │  │ for BEACON-CRC...        │                               ││
│  │  │ ● ● ●                    │  ← typing indicator          ││
│  │  └──────────────────────────┘                               ││
│  │                                                             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  [What side effects?] [Can I withdraw?] [How long?]         ││
│  │                                                             ││
│  │  ┌──────────────────────────────────────────┐  ┌──┐        ││
│  │  │ Ask about your trial...                  │  │➤ │        ││
│  │  └──────────────────────────────────────────┘  └──┘        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Chat container:**
- Max-width 640px, centered (or full on mobile)
- Height: calc(100vh - header), flex column

**Header:**
- "TrialGo Assistant" + bot avatar (blue circle with robot/DNA icon)
- "Online" text + green dot (pulsing glow animation: ring expands and fades)
- Back button (arrow left) → returns to dashboard

**Messages area (scrollable, flex-grow):**
- Bot messages: left-aligned
  - Background: `#DBEAFE` (blue-100)
  - Border radius: 16px 16px 16px 4px (no bottom-left)
  - Max-width: 75%
  - Text: 15px, slate-900
  - Avatar: small blue circle (24px) to the left
- User messages: right-aligned
  - Background: `#2563EB` (blue-600)
  - Text: white
  - Border radius: 16px 16px 4px 16px (no bottom-right)
  - Max-width: 75%
- Timestamps: centered, muted, 12px, shown between message groups (if >5 min apart)
- New messages: slide in from bottom (translateY(10px) → 0, opacity, 200ms)
- Auto-scroll to bottom on new message (smooth scroll behavior)

**Typing indicator:**
- Three dots in a bot-style bubble
- Each dot: 8px circle, blue-400
- Animation: staggered bounce (translateY 0→-6px→0), each dot 150ms delayed
- Appears while waiting for WebSocket response

**Quick reply chips (above input):**
- Horizontal scroll row
- Each: pill button, bg white, border slate-200, text 13px
- Hover: border-blue-200, text-blue-600
- Click: sends as message, chips animate out (fade + slide down)
- New chips may appear after bot response

**Input bar (fixed bottom within chat):**
- Input: full width minus send button, 48px height, rounded-full, padding 0 20px
  - Placeholder: "Ask about your trial..." (muted)
  - On focus: border-blue-300, subtle shadow
- Send button: 40px circle, blue bg, white arrow icon
  - Disabled (opacity 50%) when input empty
  - On click: arrow rotates 45° briefly (100ms) as message sends
  - Icon: ArrowUp or Send from Lucide

**WebSocket behavior:**
- Connect on mount to `/chatbot/{candidate_id}`
- Show typing indicator when waiting for response
- Handle disconnection gracefully (show "Reconnecting..." banner)
- Message history loaded on mount (GET `/chat/history/{id}`)

---

### ROUTE 13: `/pharma/analytics` — Pharma Analytics Dashboard

**File:** `app/pharma/analytics/page.tsx`  
**Layout:** Pharma sidebar + main content  
**Auth:** Protected, role=pharma

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics Dashboard                                             │
│  Trial: [BEACON-CRC Phase III ▼]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Total     │ │Avg Match │ │Dropout   │ │Active    │          │
│  │Enrolled  │ │Score     │ │Risk      │ │Anomalies │          │
│  │   847    │ │  78.4%   │ │  12.3%   │ │   ⚠️ 5   │          │
│  │  ↑ +23  │ │  ↑ +2.1  │ │  ↓ -1.2  │ │  ↑ +2   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │  Enrollment Over Time       │ │  Risk Distribution           ││
│  │  📈 (Line chart)            │ │  🍩 (Donut chart)            ││
│  │                             │ │                             ││
│  │  ▁▂▃▄▅▆▇█████             │ │   GREEN: 72%               ││
│  │                             │ │   AMBER: 18%               ││
│  └─────────────────────────────┘ │   RED:   10%               ││
│  ┌─────────────────────────────┐ └─────────────────────────────┘│
│  │  Match Score Distribution   │ ┌─────────────────────────────┐│
│  │  📊 (Bar chart)             │ │  Anomaly Types              ││
│  │                             │ │  📊 (H-bar chart)           ││
│  │  ▐▐▐▐▐▐▐▐▐▐               │ │  Heart Rate  ████░ 45%     ││
│  │                             │ │  Glucose     ███░░ 30%     ││
│  └─────────────────────────────┘ │  BP          ██░░░ 25%     ││
│                                   └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Trial selector:**
- Top of page, dropdown select or horizontal scrollable pills
- Changing trial: all data transitions (numbers morph, charts animate to new values)

**Stats row:** 4 `StatCard` components (see component spec above)
- Animated counters on mount
- Trend arrows: green ↑ for positive, red ↓ for negative (context dependent — lower dropout = green ↓)
- "Active Anomalies" card: red badge count, badge-pulse animation

**Charts (2x2 grid, responsive → 1 col on mobile):**

1. **Enrollment over time** (Line chart):
   - Recharts `AreaChart` + `Line`
   - Blue line (2px), area fill blue-100 (opacity 0.1)
   - X-axis: dates, Y-axis: count
   - Tooltip on hover: shows date + exact count (custom tooltip component, white card + shadow)
   - Animate on mount: line draws from left to right (1s)
   - Grid lines: dotted, slate-200

2. **Risk distribution** (Donut chart):
   - Recharts `PieChart` with inner radius
   - 3 segments: GREEN (#10B981), AMBER (#F59E0B), RED (#EF4444)
   - Center text: total count
   - Legend below: colored dot + label + count
   - Animate: segments grow from 0° to final angle (800ms, staggered)
   - Hover segment: slight expansion (outerRadius + 5px)

3. **Match score distribution** (Bar chart):
   - Recharts `BarChart`
   - X-axis: score ranges (0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
   - Y-axis: candidate count
   - Bars: blue with rounded top, hover → brighter blue + tooltip
   - Animate: bars grow from bottom (staggered 50ms)

4. **Anomaly types** (Horizontal bar chart):
   - Recharts `BarChart` layout="vertical"
   - Categories: Heart Rate, Glucose, Blood Pressure, Temperature
   - Bars: red-300 to red-500 gradient
   - Percentage labels at end of bars

**All charts:**
- White card container, rounded-xl, padding 24px
- Title (H4) in top-left corner
- Loading: chart skeleton (gray rectangle area)
- Responsive: maintain aspect ratio, reduce padding on mobile

---

### ROUTE 14: `/pharma/create-trial` — Create Trial

**File:** `app/pharma/create-trial/page.tsx`  
**Layout:** Pharma sidebar + centered form (max-width 720px)  
**Auth:** Protected, role=pharma

#### Step Indicator

```
  ①───────②───────③───────④───────⑤
Basic    Criteria  Config   Review   Launch
```

- 5 numbered circles connected by lines (horizontal)
- Completed: blue fill + white checkmark inside
- Active: blue fill + white number
- Upcoming: gray border + gray number
- Lines: completed segments = blue, upcoming = gray
- Transitions: line fills blue when moving forward (animated width)

#### Step 1: Basic Information

- Trial Name (text input, required)
- Description (textarea, 150px height, max 500 chars with counter)
- Disease/Condition (searchable select with suggestions)
- Phase (select dropdown: Phase I, II, III, IV)
- Sponsor (text input, pre-filled with company name)
- All with floating labels + validation

#### Step 2: Criteria

```
Inclusion Criteria:
┌─────────────────────────────────────────────────────────┐
│  1. Age 18-75 years                              [🗑️]  │
│  2. Confirmed histological diagnosis             [🗑️]  │
│  3. _____________________________________ [+ Add]      │
└─────────────────────────────────────────────────────────┘

Exclusion Criteria:
┌─────────────────────────────────────────────────────────┐
│  1. Prior treatment with immunotherapy           [🗑️]  │
│  2. _____________________________________ [+ Add]      │
└─────────────────────────────────────────────────────────┘
```

- Two sections: Inclusion + Exclusion
- Dynamic rows: text input + remove button (trash icon)
- "+ Add" button: outline, adds row with slide-in animation
- Remove: row slides out (height collapses, opacity fades)
- Minimum 1 row per section (first row can't be removed)
- Drag to reorder (optional enhancement): grab handle left of each row

#### Step 3: Configuration

- Target Enrollment: number input
- Start Date: date picker (calendar popup)
- End Date: date picker
- Locations: multi-select with search (pre-loaded list of countries/cities)
  - Selected: tag pills with remove
- **Consent Template Upload:**
  - Drag & drop zone:
    - Dashed border (2px, blue-300, rounded-xl)
    - Upload icon (48px, centered) + "Drop PDF here or click to browse" text
    - Accepted: .pdf only, max 10MB
    - Drag over state: border solid blue-500, bg blue-50, icon scales up 1.1
  - After upload:
    - File info row: PDF icon + filename + file size + "Remove" button (X)
    - Slide-in animation replacing drop zone
  - Invalid file: shake + red border flash + error toast

#### Step 4: Review

- Summary cards per step (readonly display)
- Each section: heading + content + "Edit" button (navigates back)
- All criteria listed as bullet points
- File upload shown as: "consent_template.pdf (2.4 MB) ✓"

#### Step 5: Confirm & Launch

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Ready to Launch                                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ℹ️  Launching this trial will trigger the AI recruitment    ││
│  │    pipeline. Our 12 agents will begin:                      ││
│  │    • Scraping 18 international trial registries             ││
│  │    • Discovering candidates on social platforms             ││
│  │    • NLP extraction and matching                            ││
│  │    • Sending outreach to top matches                        ││
│  │                                                             ││
│  │    This process typically takes 15-30 minutes.              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [🚀 Launch Trial]                                              │
└─────────────────────────────────────────────────────────────────┘
```

- Info box: blue-50 bg, blue-200 border, blue-700 text
- "Launch Trial" button: large (56px height), full width, blue bg, rocket icon
- On click:
  1. Button shows spinner
  2. Transitions to pipeline progress screen:
     - TrialGo loader (md size) centered
     - Below: step labels appearing one by one with stagger
     - "Scraping registries... ✓"
     - "Analyzing data..."
     - "Matching candidates..."
  3. After API confirms creation: success screen
     - "Trial Created Successfully! 🎉"
     - "We'll notify you when candidates are ready"
     - "View Trial" button → `/pharma/candidates/[id]`
     - "Create Another" button → reset form

---

### ROUTE 15: `/pharma/candidates/[trialId]` — Matched Candidates

**File:** `app/pharma/candidates/[trialId]/page.tsx`  
**Layout:** Pharma sidebar + main content  
**Auth:** Protected, role=pharma

```
┌─────────────────────────────────────────────────────────────────┐
│  BEACON-CRC Phase III — Matched Candidates (24)                  │
├─────────────────────────────────────────────────────────────────┤
│  Match Score: [═══●═══════] 40% - 100%    Status: [All ▼]      │
│  Sort by: [Match Score ▼]                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 👤 Candidate #TGO-A3F2     Match: ████████░░ 92%           ││
│  │                                                             ││
│  │ [Diabetes ✓] [Age 45-55 ✓] [No prior chemo ✓]             ││
│  │ Source: 📋 Registry                         Status: Pending ││
│  │                                                             ││
│  │ [✅ Approve]  [❌ Reject]  [👁️ View Profile]               ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 👤 Candidate #TGO-B7E1     Match: ███████░░░ 78%           ││
│  │ ...                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Pipeline still running... new candidates appearing]            │
└─────────────────────────────────────────────────────────────────┘
```

**Header:**
- Trial name + "Matched Candidates" + count badge (blue circle, white number)
- Back arrow → `/pharma/trials`

**Filters bar:**
- Match score range slider (dual thumb): 0-100%, default shows all
- Status dropdown: All / Pending / Approved / Rejected
- Sort: Match Score (desc) / Date Added / Source
- Responsive: filters stack on mobile

**Candidate cards (list layout, full width):**
- Each card:
  - Left: avatar placeholder (40px circle, initials or generic icon)
  - Anonymous ID: "Candidate #TGO-A3F2" (bold, monospace ID)
  - Match score: horizontal bar (colored by tier) + percentage bold
  - Matched criteria: row of tag pills (blue-50 bg, blue-700 text, 12px)
  - Source badge: icon + text (Registry/Reddit/Twitter), colored by source
  - Status badge: 
    - Pending: gray-100 bg, gray-600 text
    - Approved: green-100 bg, green-700 text
    - Rejected: red-100 bg, red-700 text
  - Action buttons:
    - "Approve": green outline button (turns solid on hover)
    - "Reject": red outline button
    - "View Profile": blue text button
  - On approve click: card border flashes green, status updates with animation
  - On reject: card fades slightly (opacity 0.6), status updates

- **Expandable detail (on "View Profile" or row click):**
  - Slides open below card (height animation)
  - Shows: full match breakdown (which criteria matched/didn't, with ✓/✗)
  - Medical profile summary (conditions, medications, demographics)
  - If consent signed + identity revealed: show real name + contact info (with unlock icon)
  - If not: 🔒 "Identity locked until consent is signed" message

- **Identity Reveal Section (per candidate):**
  - Before consent: padlock icon + "Consent required to reveal identity" (gray text)
  - After consent: button "Reveal Identity" → confirmation dialog → shows real name + email + phone
  - Post-reveal: identity card appears (green border, name + contact)

- **Loading/Empty states:**
  - Pipeline running: TrialGo loader (sm) + "AI agents processing... Candidates will appear shortly"
  - No matches: "No candidates match this trial's criteria" + "Try adjusting criteria" link
  - Loading: skeleton card list (5 items) with shimmer

- **Real-time updates:** New candidates slide in from top with blue glow animation (brief)

---

### ROUTE 16: `/pharma/discovery/[trialId]` — Social Discovery

**File:** `app/pharma/discovery/[trialId]/page.tsx`  
**Layout:** Pharma sidebar + main content  
**Auth:** Protected, role=pharma

```
┌─────────────────────────────────────────────────────────────────┐
│  Social Discovery — BEACON-CRC Phase III                         │
├─────────────────────────────────────────────────────────────────┤
│  Summary: 47 leads found | 12 outreach sent | 3 responded       │
├─────────────────────────────────────────────────────────────────┤
│  [All (47)]  [Reddit (31)]  [Twitter (16)]                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ 🟠 Reddit                │  │ 🐦 Twitter               │    │
│  │ u/health_warrior_22      │  │ @trial_hopeful           │    │
│  │                          │  │                          │    │
│  │ [Type 2 Diabetes]        │  │ [Colorectal] [Stage III] │    │
│  │ [Fatigue] [Nausea]       │  │                          │    │
│  │                          │  │ "Looking for new treatment│    │
│  │ "Been struggling with    │  │  options after 2nd round │    │
│  │  my diagnosis for..."    │  │  of chemo failed..."     │    │
│  │                          │  │                          │    │
│  │ Confidence: 74% 🟡       │  │ Confidence: 89% 🟢       │    │
│  │ Sentiment: Neutral 😐    │  │ Sentiment: Positive 🙂   │    │
│  │                          │  │                          │    │
│  │ [Send Outreach] [Dismiss]│  │ [Send Outreach] [Dismiss]│    │
│  └──────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Stats summary bar:**
- 3 metrics inline: Total leads | Outreach sent | Responses
- Each with icon + number + label

**Source tabs:**
- All / Reddit / Twitter (with counts)
- Animated tab indicator

**Lead cards (2-column grid):**
- Platform icon top-left (Reddit orange, Twitter blue)
- Username (anonymized or actual handle)
- Condition tags: blue pills
- Post snippet: 2 lines, muted, italic (expandable on "Read more" click)
- Confidence score: percentage + colored dot (>80% green, 50-80% amber, <50% red)
- Sentiment: emoji + text (Positive 🙂 / Neutral 😐 / Negative 🙁)
- Actions:
  - "Send Outreach": blue solid button, on click → confirmation → "Sent ✓" replaces button
  - "Dismiss": gray outline button, on click → card fades out + moves to dismissed section
- Card hover: lift + blue shadow
- Stagger animation on load

**Dismissed section (bottom, collapsible):**
- Accordion with count: "Dismissed (8)"
- Grayed out cards, "Undo" button on each

---

### ROUTE 17: `/pharma/fhir/[trialId]` — FHIR Export

**File:** `app/pharma/fhir/[trialId]/page.tsx`  
**Layout:** Pharma sidebar + main content  
**Auth:** Protected, role=pharma

```
┌─────────────────────────────────────────────────────────────────┐
│  FHIR Export — BEACON-CRC Phase III                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ℹ️ FHIR (Fast Healthcare Interoperability Resources)        ││
│  │ Export patient data in HL7 FHIR R4 standard format.         ││
│  │ Includes: Patient, Condition, Observation, Medication,      ││
│  │ Procedure resources for all enrolled patients.              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Resource Type        │ Count  │ Last Updated                ││
│  │─────────────────────│────────│─────────────────────────────││
│  │ Patient              │  24    │ Jan 15, 2025 4:32 PM       ││
│  │ Condition            │  87    │ Jan 15, 2025 4:32 PM       ││
│  │ Observation          │ 342    │ Jan 15, 2025 4:30 PM       ││
│  │ MedicationStatement  │  56    │ Jan 14, 2025 2:15 PM       ││
│  │ Procedure            │  12    │ Jan 12, 2025 11:00 AM      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Format: [JSON ●] [XML ○]                                       │
│                                                                  │
│  [📥 Download Bundle]  [📋 Copy to Clipboard]                   │
│                                                                  │
│  Preview:                                                        │
│  ▶ Patient Resources (24)                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ {                                                           ││
│  │   "resourceType": "Bundle",                                 ││
│  │   "type": "collection",                                     ││
│  │   "entry": [                                                ││
│  │     {                                                       ││
│  │       "resource": {                                         ││
│  │         "resourceType": "Patient",                          ││
│  │         "id": "TGO-A3F2",                                   ││
│  │         ...                                                 ││
│  │       }                                                     ││
│  │     }                                                       ││
│  │   ]                                                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│  [📋 Copy]                                                      │
│                                                                  │
│  ▶ Condition Resources (87)                                     │
│  ▶ Observation Resources (342)                                  │
│  ▶ MedicationStatement Resources (56)                           │
│  ▶ Procedure Resources (12)                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Info card:** blue-50 bg, blue-200 border, info icon, descriptive text about FHIR

**Resource table:**
- Clean table, alternating rows
- Columns: Resource Type (bold), Count (number), Last Updated (relative + absolute on hover tooltip)

**Format toggle:** Radio buttons styled as pill group (JSON / XML)

**Action buttons:**
- "Download Bundle": primary blue, download icon
- "Copy to Clipboard": outline, copy icon → on click, icon changes to checkmark for 2s + toast "Copied!"

**Preview section (accordion per resource type):**
- Each: chevron + "Patient Resources (24)" — click expands
- Code block:
  - Monospace font (JetBrains Mono or Fira Code)
  - Background: slate-900 (dark) with syntax highlighting
  - JSON keys: blue-300, strings: green-300, numbers: amber-300, brackets: white
  - Max-height: 400px, internal scroll
  - Top-right corner: copy button (ghost, white icon)
  - Rounded-lg
- Only one accordion open at a time (closes others)
- Expand animation: height grows + code fades in

---

### ROUTE 18: `/coordinator/cohort` — Coordinator Cohort Dashboard

**File:** `app/coordinator/cohort/page.tsx`  
**Layout:** Coordinator sidebar + main content (full width)  
**Auth:** Protected, role=coordinator

This is the most complex page. Build it with careful attention to real-time updates.

```
┌─────────────────────────────────────────────────────────────────┐
│  Cohort Dashboard              Trial: [BEACON-CRC ▼]  ● Live    │
├─────────────────────────────────────────────────────────────────┤
│  [Overview]  [Anomalies (5)]  [Patients]                        │
│   ═══════                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              [TAB CONTENT AREA]                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Header:**
- "Cohort Dashboard" (H1-DASH)
- Trial selector dropdown (right side)
- "Live" indicator: green dot (pulsing ring animation) + "Live" text (12px, green)
  - When WebSocket disconnected: red dot + "Disconnected" + "Retry" button

**Tabs:**
- Overview | Anomalies (with red badge count) | Patients
- Animated sliding indicator
- Badge on "Anomalies" tab: red circle with white number, badge-pulse animation

---

#### Overview Tab

**Stats row (5 cards):**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Enrolled  │ │Avg Match │ │Risk Dist.│ │Anomalies │ │Dropout   │
│   24     │ │  78.4%   │ │ 🟢🟡🔴  │ │  ⚠️ 5    │ │  12.3%   │
│  ↑ +3   │ │  ─ 0.0   │ │ (mini)   │ │  ↑ +2   │ │  ↓ -1.2  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

- "Risk Dist." card: mini inline donut chart (40px) showing GREEN/AMBER/RED proportions
- "Anomalies" card: red accent, badge-pulse if count > 0
- All counters animate on mount AND on WebSocket update (number morphs: old fades up, new fades down)

**Charts (below stats, 2-column grid):**
1. Risk Distribution (large donut):
   - 3 segments with legend
   - Center: total enrolled number
   - Updates live (segments animate to new values smoothly)
2. Enrollment Timeline (line chart):
   - Cumulative enrollment over time
   - Blue line + area fill
   - New data points appear with dot animation

**Real-time Event Feed (right side or below charts):**
- "Latest Events" heading
- Scrollable list (max-height 300px)
- Each event: colored dot + description + relative timestamp
- New events slide in from top with brief highlight (background flash blue-50)
- Types:
  - 🟢 "Patient #TGO-A3F2 enrolled"
  - 🔴 "Anomaly detected: High heart rate for #TGO-B7E1"
  - 🟡 "Dropout risk elevated for #TGO-C2D4"
  - 🔵 "Symptom log submitted by #TGO-A3F2"

---

#### Anomalies Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Active Anomalies (5)                                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │🔴│ #TGO-B7E1 | Heart Rate | 142 bpm | Z: 3.2 |  2h ago   ││
│  │  │ Significantly elevated resting heart rate                ││
│  │  │                                       [Resolve]          ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │🟡│ #TGO-C2D4 | Glucose | 210 mg/dL | Z: 2.7 |  5h ago    ││
│  │  │ Elevated fasting glucose                                 ││
│  │  │                                       [Resolve]          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ▶ Resolved (12)                                                │
└─────────────────────────────────────────────────────────────────┘
```

- Cards stacked vertically, full width
- Left border colored by severity (4px):
  - RED: `#EF4444` + badge-pulse animation on badge
  - AMBER: `#F59E0B`
- Card content:
  - Patient ID (monospace, bold)
  - Metric name
  - Current value + unit
  - Z-score
  - Timestamp (relative)
  - Description/message (second line, muted)
  - "Resolve" button (outline, right-aligned)
- On resolve click:
  - Confirmation dialog: "Mark this anomaly as resolved?"
  - On confirm: card fades + collapses out (height 0, opacity 0, 300ms)
  - Moves to Resolved section
- RED cards: subtle red background glow/tint
- New anomalies (from WebSocket): slide in from top with red flash

- **Resolved section:**
  - Collapsible accordion
  - Cards grayed out (opacity 0.6), no actions
  - Show resolved-by + resolved timestamp

---

#### Patients Tab

- **Full data table** (use DataTable component):
  - Columns:
    - Patient ID (monospace)
    - Enrollment Date (formatted)
    - Match Score (% + mini color bar)
    - Dropout Risk (badge: GREEN/AMBER/RED, pulsing if RED)
    - Last Activity (relative timestamp, e.g., "2 hours ago")
    - Symptom Logs (count this week)
    - Anomalies (count, red if > 0)
  - Sortable by clicking column headers (animated sort arrow)
  - Search input above table
  - Click row → expand inline:
    - Patient detail panel (slides down):
      - Recent symptoms (last 3 logs summary)
      - Wearable data highlights (latest HR, glucose, etc.)
      - Engagement timeline (mini chart)
      - "Call Patient" button (Twilio integration)
  - Loading: skeleton table
  - Pagination: 10 per page

---

### ROUTE 19: `/coordinator/anomalies` — Anomalies (Standalone)

**File:** `app/coordinator/anomalies/page.tsx`  
**Layout:** Coordinator sidebar + main content  
**Auth:** Protected, role=coordinator

Same as Anomalies tab but with additional features:

**Filters bar:**
- Severity: [All] [RED] [AMBER] — pill toggle
- Metric: [All] [Heart Rate] [Glucose] [Blood Pressure] [Temperature] — dropdown
- Date range: date picker (from → to)
- "Export CSV" button (outline, download icon)

**Bulk actions:**
- Checkbox on each card
- When any checked: floating action bar appears at bottom
  - "{n} selected" + "Resolve Selected" button
  - Slide in from bottom (translateY(100%) → 0)

**List same as Anomalies tab content**

---

### ROUTE 20: `/pharma/trials` — Pharma Trials List

**File:** `app/pharma/trials/page.tsx`  
**Layout:** Pharma sidebar + main content  
**Auth:** Protected, role=pharma

```
┌─────────────────────────────────────────────────────────────────┐
│  My Trials                                  [+ Create New Trial] │
├─────────────────────────────────────────────────────────────────┤
│  [Grid ▦] [List ≡]     Sort: [Most Recent ▼]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  BEACON-CRC Phase III                    [Recruiting ●]     ││
│  │  Colorectal Cancer | Phase III                              ││
│  │                                                             ││
│  │  Enrollment: ██████████░░░░ 24/100                          ││
│  │                                                             ││
│  │  Candidates: 47   Enrolled: 24   Dropout Risk: 12%         ││
│  │                                                             ││
│  │  [View Candidates] [Analytics] [FHIR Export]                ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  NOVA-DM2 Phase II                       [Active ●]        ││
│  │  ...                                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Header:** "My Trials" (H1-DASH) + "Create New Trial" button (top right, blue, + icon)

**View toggle:** Grid/List icons (grid = 2-col cards, list = full-width rows)

**Trial cards:**
- Title + status badge (colored pill: Recruiting=blue, Active=green, Completed=gray, Suspended=red)
- Disease + Phase text (14px muted)
- **Enrollment progress bar:**
  - Full width, 8px height, rounded-full
  - Fill: blue gradient (left to right)
  - Label: "24/100" right of bar
  - Animate width on mount
- Stats row: Candidates | Enrolled | Dropout Risk (14px, evenly spaced)
- Quick action buttons: outline buttons, icon + text, 13px
  - "View Candidates" → `/pharma/candidates/[id]`
  - "Analytics" → `/pharma/analytics` (with trial pre-selected)
  - "FHIR Export" → `/pharma/fhir/[id]`
- Hover: lift + blue shadow
- Stagger animation

**Empty state:**
- Illustration (lab flask/beaker empty)
- "No trials yet"
- "Create your first trial and let our AI agents find candidates"
- "Create Trial" blue CTA button

---

## PART 5: GLOBAL STATES & PATTERNS

### Loading.tsx Files (Per Route)

Every route group should have a `loading.tsx` that renders:

```tsx
// app/dashboard/loading.tsx (and all other routes)
import { TrialGoLoader } from "@/components/ui/trialgo-loader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <TrialGoLoader size="md" />
        <p className="text-sm text-muted animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
```

### Error.tsx Files (Per Route)

```tsx
// Consistent error boundary per route
// Illustration + "Something went wrong" + error message (dev only) + "Try Again" button
```

### Not-Found (404)

- Aurora background (subtle)
- Large "404" text (display size, blue, semi-transparent)
- "Page not found" heading
- "The page you're looking for doesn't exist or has been moved"
- "Go Home" button (blue) + "Go Back" button (outline)

### RoleGuard Component

```tsx
// components/auth/role-guard.tsx
// Wraps protected pages
// Checks: token exists in localStorage → decode → check role matches
// If no token: redirect to /login (or role-specific login)
// If wrong role: redirect to correct dashboard
// Shows TrialGo loader while checking
```

---

## PART 6: RESPONSIVE BEHAVIOR SPECIFICATION

### Breakpoints

```
Mobile:  < 768px
Tablet:  768px - 1023px
Desktop: 1024px - 1439px
Wide:    ≥ 1440px
```

### Mobile Adaptations

1. **Sidebar:** Hidden, replaced by:
   - Hamburger button (top-left in header)
   - Sidebar slides in as overlay (left) with backdrop
   - OR bottom navigation bar (64px, 5 icons max)
2. **Grids:** All multi-column grids become single column
3. **Tables:** Horizontal scroll with sticky first column + gradient fade on right edge
4. **Charts:** Full width, stacked vertically, reduced height (200px)
5. **Stat cards:** 2 per row (2x2 grid) or horizontal scroll
6. **Trial cards:** Single column, full width
7. **Forms:** Single column always, inputs full width
8. **Chatbot:** Full screen, no sidebar
9. **Modals:** Full screen on mobile (bottom sheet style, slide up from bottom)
10. **Fixed elements:** Bottom sticky bar for primary CTAs on detail pages

### Tablet Adaptations

1. **Sidebar:** Collapsed to 64px (icons only), expandable on click
2. **Grids:** 2 columns max
3. **Charts:** 2x1 layout (stacked pairs)
4. **Tables:** Horizontal scroll enabled
5. **Forms:** Same as desktop but narrower max-width

---

## PART 7: DARK MODE SPECIFICATION

### Implementation

- Use `next-themes` with `attribute="class"` strategy
- Toggle: in sidebar (bottom section) or header — sun/moon icon
- Toggle animation: icon rotates 180° and morphs (sun → moon)
- Transition: all colors transition over 200ms (add `transition-colors` to body)
- Store preference in localStorage, respect system preference as default

### Color Mapping (Light → Dark)

```
Page background:     #FAFBFC  →  #0F172A
Card/surface:        #FFFFFF  →  #1E293B
Card elevated:       #FFFFFF  →  #334155
Text primary:        #0F172A  →  #F8FAFC
Text secondary:      #475569  →  #CBD5E1
Text muted:          #94A3B8  →  #64748B
Border:              #E2E8F0  →  #334155
Input background:    #FFFFFF  →  #1E293B
Code blocks:         #1E293B  →  #0F172A (stays dark)
Blue accent:         #2563EB  →  #3B82F6 (slightly lighter for contrast)
Blue backgrounds:    #DBEAFE  →  #1E3A5F (dark blue, not light)
Shadows:             as defined → more subtle (reduce opacity by 50%)
Skeleton shimmer:    slate-100 gradient → slate-700 gradient
Charts grid lines:   slate-200 → slate-700
Chart data colors:   same but brighter variants (+100 in scale)
Loader boxes:        blue border → white border (#F8FAFC)
Aurora:              inverts automatically via dark: prefix in component
```

---

## PART 8: ACCESSIBILITY SPECIFICATION

1. **Focus management:**
   - Visible focus rings on all interactive elements (2px blue, 2px offset)
   - Focus trapped in modals/dialogs
   - Focus returned to trigger element on modal close
   - Skip-to-content link (visually hidden until focused)

2. **ARIA:**
   - `role="navigation"` on sidebar
   - `aria-current="page"` on active nav item
   - `aria-label` on icon-only buttons
   - `aria-live="polite"` on toast container
   - `aria-live="assertive"` on anomaly alerts
   - `role="alert"` on error messages
   - `aria-expanded` on accordions/expandable rows
   - `aria-selected` on tabs

3. **Keyboard:**
   - Tab through all interactive elements in logical order
   - Enter/Space to activate buttons, toggle checkboxes, select options
   - Arrow keys to navigate within tab groups, radio groups, sliders
   - Escape to close modals/dropdowns/menus

4. **Color contrast:**
   - All text: minimum 4.5:1 ratio (body), 3:1 (large text)
   - Interactive elements: 3:1 against adjacent colors
   - Never rely solely on color (always pair with icon/text/pattern)

5. **Motion:**
   - Respect `prefers-reduced-motion`:
     - Disable all transforms, transitions set to 0ms
     - Counters show final value immediately
     - Page transitions: instant (no animation)
     - Loader: static (shows all 3 boxes without animation)
   - `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

---

## PART 9: PERFORMANCE OPTIMIZATION

1. **Code splitting:** Each route is its own chunk (Next.js App Router handles this)
2. **Lazy load:** Charts components loaded dynamically (`next/dynamic` with loading fallback)
3. **Images:** All via `next/image` with proper sizing, lazy loading below fold
4. **Fonts:** Inter loaded via `next/font/google` with `display: swap`
5. **CSS:** TailwindCSS purges unused styles in production
6. **Bundle:** Tree-shake Lucide icons (import individually, not `from 'lucide-react'` wildly)
7. **Caching:** TanStack Query with `staleTime: 30000` for dashboard data, `staleTime: 60000` for static content
8. **Prefetching:** `<Link prefetch>` on likely navigation targets (sidebar items, card CTAs)
9. **WebSocket:** Single connection per coordinator session, reconnect with exponential backoff
10. **Virtual scroll:** For long lists (>50 items), use virtual scrolling (react-virtual)

---

## PART 10: FILE STRUCTURE (Frontend Only)

```
app/
├── page.tsx                           # Landing page
├── layout.tsx                         # Root layout (fonts, providers, theme)
├── loading.tsx                        # Root loading state
├── error.tsx                          # Root error boundary
├── not-found.tsx                      # 404 page
├── globals.css                        # Tailwind + custom CSS + loader keyframes
│
├── (auth)/                            # Auth route group (no sidebar layout)
│   ├── layout.tsx                     # Aurora background wrapper
│   ├── login/page.tsx                 #Reasoning: Continuing the file structure and remaining parts of the prompt.

```
├── (auth)/                            # Auth route group (no sidebar layout)
│   ├── layout.tsx                     # Aurora background wrapper
│   ├── login/page.tsx                 # Patient login
│   ├── register/page.tsx              # Multi-step registration
│   ├── coordinator/
│   │   └── login/page.tsx             # Coordinator login
│   └── pharma/
│       └── login/page.tsx             # Pharma login
│
├── (patient)/                         # Patient route group (patient sidebar layout)
│   ├── layout.tsx                     # Patient sidebar + header shell
│   ├── loading.tsx                    # TrialGo loader for patient routes
│   ├── dashboard/page.tsx             # Patient dashboard
│   ├── trials/
│   │   ├── page.tsx                   # Trial discovery/listing
│   │   └── [id]/page.tsx             # Trial detail + apply
│   ├── patient/
│   │   └── symptom-log/page.tsx      # Weekly symptom log
│   ├── onboarding/
│   │   └── questionnaire/page.tsx    # Medical questionnaire (full-screen override)
│   ├── consent/page.tsx              # Consent signing workflow
│   └── chatbot/page.tsx              # Trust chatbot (full-screen override)
│
├── (coordinator)/                     # Coordinator route group
│   ├── layout.tsx                     # Coordinator sidebar + header shell
│   ├── loading.tsx                    # TrialGo loader
│   └── coordinator/
│       ├── cohort/page.tsx           # Cohort dashboard (tabs: overview/anomalies/patients)
│       ├── anomalies/page.tsx        # Standalone anomalies page
│       └── settings/page.tsx         # Coordinator settings
│
├── (pharma)/                          # Pharma route group
│   ├── layout.tsx                     # Pharma sidebar + header shell
│   ├── loading.tsx                    # TrialGo loader
│   └── pharma/
│       ├── analytics/page.tsx        # Analytics dashboard
│       ├── trials/page.tsx           # My trials list
│       ├── create-trial/page.tsx     # Create trial multi-step
│       ├── candidates/
│       │   └── [trialId]/page.tsx    # Matched candidates
│       ├── discovery/
│       │   └── [trialId]/page.tsx    # Social discovery leads
│       ├── fhir/
│       │   └── [trialId]/page.tsx    # FHIR export
│       └── settings/page.tsx         # Pharma settings

components/
├── ui/                                # Primitive UI components (shadcn + custom)
│   ├── trialgo-loader.tsx            # Custom 3-box animated loader
│   ├── aurora-background.tsx         # Aurora gradient background
│   ├── page-transition.tsx           # Framer Motion page wrapper
│   ├── animated-counter.tsx          # Scroll-triggered number animation
│   ├── stat-card.tsx                 # Stats card with icon/trend/badge
│   ├── data-table.tsx                # Reusable sortable/searchable table
│   ├── progress-ring.tsx             # SVG circular progress (match scores)
│   ├── skeleton.tsx                  # Skeleton shimmer variants
│   ├── empty-state.tsx               # Empty state with illustration + CTA
│   ├── badge.tsx                     # Status/severity badges
│   ├── button.tsx                    # Button with variants (CVA)
│   ├── input.tsx                     # Input with floating label
│   ├── textarea.tsx                  # Textarea with floating label
│   ├── select.tsx                    # Custom select/dropdown
│   ├── combobox.tsx                  # Searchable multi-select (cmdk-based)
│   ├── slider.tsx                    # Severity slider with gradient track
│   ├── checkbox.tsx                  # Custom checkbox
│   ├── radio-group.tsx               # Radio group (pill/card variants)
│   ├── date-picker.tsx               # Calendar date picker
│   ├── file-upload.tsx               # Drag & drop file upload zone
│   ├── signature-pad.tsx             # Canvas signature input
│   ├── tabs.tsx                      # Animated tabs with sliding indicator
│   ├── accordion.tsx                 # Smooth expand/collapse
│   ├── dialog.tsx                    # Modal with enter/exit animations
│   ├── dropdown-menu.tsx             # Animated dropdown
│   ├── tooltip.tsx                   # Hover tooltip
│   ├── toast.tsx                     # Sonner customization
│   ├── breadcrumb.tsx                # Breadcrumb navigation
│   ├── pagination.tsx                # Page pagination
│   ├── otp-input.tsx                 # 6-digit OTP boxes
│   ├── password-strength.tsx         # Password strength indicator
│   ├── code-block.tsx                # Syntax-highlighted JSON/code viewer
│   ├── emoji-selector.tsx            # 5-emoji feeling scale
│   ├── filter-chips.tsx              # Toggleable pill filter chips
│   ├── live-indicator.tsx            # Pulsing green "Live" dot + text
│   └── chart-wrapper.tsx             # Loading/error wrapper for Recharts
│
├── layout/                            # Layout shells
│   ├── app-sidebar.tsx               # Role-aware sidebar (patient/coordinator/pharma)
│   ├── sidebar-item.tsx              # Individual nav item with active state
│   ├── app-header.tsx                # Top header bar (greeting, notifications, dark mode toggle)
│   ├── mobile-nav.tsx                # Mobile hamburger menu + drawer
│   └── notification-bell.tsx         # Bell icon with dropdown
│
├── landing/                           # Landing page section components
│   ├── landing-header.tsx            # Sticky header with scroll behavior
│   ├── hero-section.tsx              # Aurora hero with CTAs
│   ├── stats-section.tsx             # 4 animated stat cards
│   ├── features-grid.tsx            # 3x2 feature cards
│   ├── how-it-works.tsx             # 3-step timeline with SVG line draw
│   ├── pharma-section.tsx           # Split layout for pharma
│   ├── landing-footer.tsx           # Dark footer with columns
│   └── trusted-logos.tsx            # Logo bar with grayscale animation
│
├── auth/                              # Auth-specific components
│   ├── role-guard.tsx                # Authentication + role check wrapper
│   ├── role-selector.tsx             # Step 1 role selection cards
│   ├── login-form.tsx                # Reusable login form
│   └── otp-verification.tsx          # OTP step component
│
├── dashboard/                         # Patient dashboard components
│   ├── enrolled-trial-card.tsx       # Trial enrollment card
│   ├── activity-feed.tsx             # Recent activity timeline
│   └── health-score-badge.tsx        # Color-coded health indicator
│
├── trials/                            # Trial-related components
│   ├── trial-card.tsx                # Trial listing card
│   ├── trial-filters.tsx            # Search + filter chips bar
│   ├── eligibility-list.tsx         # Inclusion/exclusion columns
│   ├── trial-timeline.tsx           # Vertical milestone timeline
│   └── application-form.tsx         # Multi-step apply form
│
├── consent/                           # Consent components
│   ├── document-viewer.tsx           # PDF/simplified toggle viewer
│   ├── consent-form-fields.tsx      # Dynamic extracted fields
│   ├── signature-canvas.tsx         # Signature drawing canvas
│   └── audit-trail.tsx              # Timestamped interaction log
│
├── chatbot/                           # Chatbot components
│   ├── chat-message.tsx             # Individual message bubble
│   ├── typing-indicator.tsx         # 3-dot bounce animation
│   ├── quick-replies.tsx            # Suggested question chips
│   └── chat-input.tsx               # Input bar with send button
│
├── coordinator/                       # Coordinator dashboard components
│   ├── cohort-stats.tsx             # Stat cards row
│   ├── risk-donut-chart.tsx         # GREEN/AMBER/RED donut
│   ├── enrollment-chart.tsx         # Line chart over time
│   ├── anomaly-card.tsx             # Individual anomaly alert card
│   ├── patient-detail-panel.tsx     # Expandable patient inline details
│   ├── event-feed.tsx               # Real-time scrolling event feed
│   └── websocket-status.tsx         # Live/disconnected indicator
│
├── pharma/                            # Pharma dashboard components
│   ├── trial-card-pharma.tsx        # Pharma trial list card
│   ├── candidate-card.tsx           # Matched candidate row/card
│   ├── discovery-lead-card.tsx      # Social discovery lead card
│   ├── pipeline-progress.tsx        # AI pipeline step indicators
│   ├── analytics-charts.tsx         # Chart grid wrapper
│   ├── criteria-builder.tsx         # Dynamic add/remove criteria rows
│   └── fhir-preview.tsx             # JSON code block with copy
│
└── charts/                            # Recharts wrapper components
    ├── area-chart.tsx                # Enrollment area chart
    ├── donut-chart.tsx               # Risk distribution donut
    ├── bar-chart.tsx                 # Score distribution bars
    ├── horizontal-bar.tsx           # Anomaly types horizontal bars
    └── sparkline.tsx                 # Mini inline charts for stat cards

hooks/
├── use-auth.ts                        # Auth state, login, logout, token management
├── use-current-user.ts               # Get current user from token
├── use-mobile.ts                      # Viewport detection
├── use-websocket.ts                   # WebSocket connection manager (Socket.io)
├── use-intersection.ts               # IntersectionObserver hook (scroll reveal)
├── use-animated-counter.ts           # Counter animation hook
├── use-debounce.ts                   # Debounced value hook
├── use-local-storage.ts             # Persistent state hook
└── use-media-query.ts               # Media query listener hook

lib/
├── utils.ts                           # cn() utility, formatters
├── api.ts                             # Axios instance with interceptors
├── constants.ts                       # App constants (routes, roles, etc.)
├── validators.ts                      # Zod schemas for all forms
└── format.ts                          # Date, number, percentage formatters

services/
├── auth.service.ts                    # Login, register, verify API calls
├── trials.service.ts                  # Trial CRUD, listing, filtering
├── patients.service.ts               # History, symptom logs, wearables
├── consent.service.ts                # Consent upload, sign, audit
├── monitoring.service.ts             # Cohort, dropout, anomalies
├── pharma.service.ts                 # Analytics, candidates, discovery
├── chat.service.ts                   # Chat history, messaging
└── questionnaire.service.ts          # Questionnaire submit/retrieve

types/
├── user.ts                            # User, role, auth types
├── trial.ts                           # Trial, phase, status types
├── patient.ts                         # Patient, questionnaire, symptom types
├── consent.ts                         # Consent, audit types
├── monitoring.ts                      # Anomaly, dropout, cohort types
├── candidate.ts                       # Matched candidate, discovery lead types
├── chat.ts                            # Message, conversation types
└── api.ts                             # Generic API response wrapper types

providers/
├── query-provider.tsx                 # TanStack Query provider
├── theme-provider.tsx                 # next-themes provider
├── auth-provider.tsx                  # Auth context provider
└── socket-provider.tsx                # WebSocket context provider
```

---

## PART 11: DATA FETCHING & STATE MANAGEMENT

### 11.1 API Client Setup

```typescript
// lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('trialgo_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || 'Something went wrong';

    if (status === 401) {
      // Token expired or invalid
      localStorage.removeItem('trialgo_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('Access denied. You do not have permission.');
    } else if (status === 422) {
      toast.error('Validation error. Please check your input.');
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 11.2 TanStack Query Configuration

```typescript
// providers/query-provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,          // 30s before refetch
        gcTime: 5 * 60_000,         // 5min garbage collection
        retry: 2,
        refetchOnWindowFocus: false,
        throwOnError: false,
      },
      mutations: {
        retry: 0,
        throwOnError: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 11.3 Service Layer Pattern

Every API call is wrapped in a typed service function, then consumed via TanStack Query hooks:

```typescript
// services/trials.service.ts
import api from '@/lib/api';
import { Trial, TrialListResponse, TrialCreatePayload } from '@/types/trial';

export const trialsService = {
  list: async (params?: { search?: string; phase?: string; disease?: string; page?: number }) => {
    const { data } = await api.get<TrialListResponse>('/trials', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Trial>(`/trials/${id}`);
    return data;
  },

  create: async (payload: TrialCreatePayload) => {
    const { data } = await api.post<Trial>('/trials/create', payload);
    return data;
  },
};

// Usage in component:
// hooks/use-trials.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trialsService } from '@/services/trials.service';

export function useTrials(params?: Parameters<typeof trialsService.list>[0]) {
  return useQuery({
    queryKey: ['trials', params],
    queryFn: () => trialsService.list(params),
  });
}

export function useTrial(id: string) {
  return useQuery({
    queryKey: ['trial', id],
    queryFn: () => trialsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trialsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trials'] });
      toast.success('Trial created successfully!');
    },
  });
}
```

### 11.4 WebSocket Integration (Coordinator Dashboard)

```typescript
// hooks/use-websocket.ts
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketOptions {
  trialId: string;
  enabled?: boolean;
  onEvent?: (event: CohortEvent) => void;
}

interface CohortEvent {
  type: 'enrollment' | 'anomaly' | 'dropout_update' | 'symptom_log';
  data: Record<string, unknown>;
  timestamp: string;
}

export function useCohortWebSocket({ trialId, enabled = true, onEvent }: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<CohortEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !trialId) return;

    const token = localStorage.getItem('trialgo_token');
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000', {
      path: '/ws/dashboard',
      query: { trial_id: trialId },
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('cohort_update', (event: CohortEvent) => {
      setLastEvent(event);
      onEvent?.(event);
    });

    socket.on('connect_error', () => {
      reconnectAttempts.current += 1;
    });

    socketRef.current = socket;
  }, [trialId, enabled, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [connect]);

  return { isConnected, lastEvent, reconnect: connect };
}
```

### 11.5 Auth State Management

```typescript
// hooks/use-auth.ts
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, LoginPayload, RegisterPayload } from '@/types/user';
import { toast } from 'sonner';

const TOKEN_KEY = 'trialgo_token';
const USER_KEY = 'trialgo_user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize: check token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Validate token by fetching /auth/me
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem(USER_KEY, JSON.stringify(data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.full_name}!`);

    // Redirect based on role
    const roleRoutes = {
      patient: '/dashboard',
      coordinator: '/coordinator/cohort',
      pharma: '/pharma/analytics',
    };
    router.push(roleRoutes[data.user.role] || '/dashboard');
  }, [router]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    return data; // Returns user_id for OTP step
  }, []);

  const verifyOtp = useCallback(async (userId: number, otp: string) => {
    const { data } = await api.post('/auth/verify-phone', { user_id: userId, otp_code: otp });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    logout,
  };
}
```

---

## PART 12: FORM VALIDATION SCHEMAS

```typescript
// lib/validators.ts
import { z } from 'zod';

// ===== AUTH SCHEMAS =====

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').max(15),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirm_password: z.string(),
  role: z.enum(['patient', 'coordinator', 'pharma']),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// ===== QUESTIONNAIRE SCHEMA =====

export const questionnaireSchema = z.object({
  age: z.number().min(18).max(120),
  gender: z.string().min(1, 'Gender is required'),
  ethnicity: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  chronic_conditions: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })).min(0),
  current_medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
  })),
  current_symptoms: z.array(z.object({
    symptom: z.string().min(1),
    severity: z.number().min(1).max(10),
    duration: z.string().optional(),
  })),
  lifestyle: z.object({
    smoking: z.enum(['never', 'former', 'current']),
    alcohol: z.enum(['never', 'occasional', 'regular']),
    exercise: z.enum(['none', '1-2x', '3-4x', 'daily']),
  }),
  preferences: z.object({
    trial_types: z.array(z.string()),
    locations: z.array(z.string()),
    travel_willingness: z.boolean(),
  }),
});

// ===== TRIAL CREATION SCHEMA =====

export const createTrialSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(500),
  description: z.string().max(2000).optional(),
  disease: z.string().min(1, 'Disease/condition is required'),
  phase: z.enum(['Phase I', 'Phase II', 'Phase III', 'Phase IV']),
  sponsor: z.string().min(1, 'Sponsor is required'),
  inclusion_criteria: z.array(z.string().min(1)).min(1, 'At least 1 inclusion criterion'),
  exclusion_criteria: z.array(z.string().min(1)).min(1, 'At least 1 exclusion criterion'),
  target_enrollment: z.number().min(1).max(100000),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  locations: z.array(z.string()).min(1, 'At least 1 location'),
});

// ===== SYMPTOM LOG SCHEMA =====

export const symptomLogSchema = z.object({
  trial_id: z.number(),
  symptoms: z.array(z.object({
    symptom: z.string().min(1),
    severity: z.number().min(1).max(10),
    notes: z.string().optional(),
  })).min(1, 'Log at least 1 symptom'),
  overall_feeling: z.number().min(1).max(5),
  notes: z.string().optional(),
});

// ===== CONSENT SCHEMA =====

export const consentSubmitSchema = z.object({
  form_data: z.record(z.string(), z.string()),
  signature: z.string().min(1, 'Signature is required'),
  confirmed: z.literal(true, { errorMap: () => ({ message: 'You must confirm you have read the form' }) }),
});
```

---

## PART 13: TYPE DEFINITIONS

```typescript
// types/user.ts
export type UserRole = 'patient' | 'coordinator' | 'pharma';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  phone_verified: boolean;
  language: string;
  company_name: string | null;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// types/trial.ts
export type TrialPhase = 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV';
export type TrialStatus = 'draft' | 'recruiting' | 'active' | 'completed' | 'suspended';

export interface Trial {
  id: number;
  title: string;
  description: string | null;
  disease: string;
  phase: TrialPhase;
  status: TrialStatus;
  sponsor: string | null;
  created_by: number;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  target_enrollment: number;
  current_enrollment: number;
  location: string[];
  start_date: string | null;
  end_date: string | null;
  consent_template_url: string | null;
  pipeline_status: string;
  created_at: string;
  match_score?: number; // Added when viewing as patient
}

export interface TrialListResponse {
  trials: Trial[];
  total: number;
  page: number;
  per_page: number;
}

export interface TrialCreatePayload {
  title: string;
  description?: string;
  disease: string;
  phase: TrialPhase;
  sponsor: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  target_enrollment: number;
  start_date: string;
  end_date: string;
  locations: string[];
}

// types/candidate.ts
export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'enrolled';
export type DiscoverySource = 'reddit' | 'twitter' | 'forum' | 'registry';

export interface MatchedCandidate {
  id: number;
  trial_id: number;
  anonymous_id: string;
  match_score: number;
  match_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  matched_criteria: string[];
  source: DiscoverySource;
  status: CandidateStatus;
  fraud_flagged: boolean;
  identity_revealed?: boolean;
  real_name?: string;
  contact?: string;
  created_at: string;
}

export interface SocialDiscoveryLead {
  id: number;
  trial_id: number;
  platform: DiscoverySource;
  username: string;
  extracted_conditions: string[];
  confidence_score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  post_snippet: string;
  outreach_sent: boolean;
  outreach_responded: boolean;
  dismissed: boolean;
  created_at: string;
}

// types/monitoring.ts
export type RiskTier = 'GREEN' | 'AMBER' | 'RED';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CohortSummary {
  total_enrolled: number;
  avg_match_score: number;
  risk_distribution: { green: number; amber: number; red: number; };
  active_anomalies: number;
  dropout_rate: number;
  enrollment_trend: { date: string; count: number; }[];
}

export interface DropoutScore {
  id: number;
  user_id: number;
  anonymous_id: string;
  score: number;
  risk_tier: RiskTier;
  factors: string[];
  days_since_login: number;
  symptom_logs_this_week: number;
  calculated_at: string;
}

export interface AnomalyAlert {
  id: number;
  user_id: number;
  anonymous_id: string;
  trial_id: number;
  metric: string;
  value: number;
  z_score: number;
  severity: AlertSeverity;
  risk_tier: RiskTier;
  message: string;
  resolved: boolean;
  resolved_by: number | null;
  resolved_at: string | null;
  detected_at: string;
}

export interface CohortPatient {
  id: number;
  anonymous_id: string;
  enrollment_date: string;
  match_score: number;
  dropout_risk: RiskTier;
  last_activity: string;
  symptom_logs_count: number;
  anomaly_count: number;
}

// types/consent.ts
export interface ConsentTemplate {
  trial_id: number;
  template_url: string;
  fields: string[];
  simplified_text?: string;
}

export interface ConsentSubmission {
  id: number;
  trial_id: number;
  user_id: number;
  status: 'pending' | 'signed' | 'withdrawn';
  signed_at: string | null;
}

export interface ConsentAuditEntry {
  id: number;
  action: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

// types/chat.ts
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
```

---

## PART 14: KEY COMPONENT IMPLEMENTATIONS

### 14.1 Root Layout

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TrialGo — AI-Powered Clinical Trial Recruitment',
  description: 'Connect patients to life-saving clinical trials with intelligent automation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                  style: { borderRadius: '12px' },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 14.2 Patient Layout Shell

```tsx
// app/(patient)/layout.tsx
"use client";
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { RoleGuard } from '@/components/auth/role-guard';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['patient']}>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar role="patient" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
```

### 14.3 Stat Card Component (Complete)

```tsx
// components/ui/stat-card.tsx
"use client";
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  badge?: { text: string; variant: 'success' | 'warning' | 'danger' };
  loading?: boolean;
  className?: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, trend, badge, loading, className, delay = 0 }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700",
        "hover:shadow-[0_10px_40px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        {typeof value === 'number' ? (
          <AnimatedCounter target={value} className="text-2xl font-bold text-slate-900 dark:text-white" />
        ) : (
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
        )}
        {badge && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-md",
            badge.variant === 'success' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            badge.variant === 'warning' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            badge.variant === 'danger' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          )}>
            {badge.text}
          </span>
        )}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs font-medium",
          trend.direction === 'up' ? "text-green-600" : "text-red-600"
        )}>
          <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
          <span>{trend.direction === 'up' ? '+' : ''}{trend.value}%</span>
          <span className="text-slate-400 ml-1">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
```

### 14.4 Progress Ring Component

```tsx
// components/ui/progress-ring.tsx
"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressRing({ percentage, size = 80, strokeWidth = 8, className, showLabel = true }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return { stroke: '#10B981', text: 'text-green-600' };
    if (percentage >= 60) return { stroke: '#F59E0B', text: 'text-amber-600' };
    return { stroke: '#94A3B8', text: 'text-slate-500' };
  };

  const { stroke, text } = getColor();

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        />
      </svg>
      {showLabel && (
        <motion.span
          className={cn("absolute text-sm font-bold", text)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {percentage}%
        </motion.span>
      )}
    </div>
  );
}
```

### 14.5 Animated Tabs Component

```tsx
// components/ui/tabs.tsx
"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  badge?: number;
  badgeVariant?: 'default' | 'danger';
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onTabChange, className }: AnimatedTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-slate-200 dark:border-slate-700", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-4 py-3 text-sm font-medium transition-colors duration-150",
            activeTab === tab.id
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full",
                tab.badgeVariant === 'danger'
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200"
              )}>
                {tab.badge}
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

### 14.6 Anomaly Card Component

```tsx
// components/coordinator/anomaly-card.tsx
"use client";
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnomalyAlert } from '@/types/monitoring';
import { formatDistanceToNow } from 'date-fns';

interface AnomalyCardProps {
  anomaly: AnomalyAlert;
  onResolve: (id: number) => void;
  index?: number;
}

export function AnomalyCard({ anomaly, onResolve, index = 0 }: AnomalyCardProps) {
  const isRed = anomaly.risk_tier === 'RED';
  const isAmber = anomaly.risk_tier === 'AMBER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "relative bg-white dark:bg-slate-800 rounded-xl p-5 border shadow-sm",
        "border-l-4 transition-all duration-200",
        isRed && "border-l-red-500 border-slate-200 dark:border-slate-700",
        isAmber && "border-l-amber-500 border-slate-200 dark:border-slate-700",
        isRed && "bg-red-50/30 dark:bg-red-900/5"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
              {anomaly.anonymous_id}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase",
              isRed && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 animate-pulse",
              isAmber && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            )}>
              <AlertTriangle className="w-3 h-3" />
              {anomaly.risk_tier}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              <strong>{anomaly.metric.replace('_', ' ')}</strong>: {anomaly.value} {getUnit(anomaly.metric)}
            </span>
            <span className="text-slate-400">Z-score: {anomaly.z_score.toFixed(1)}</span>
          </div>

          {anomaly.message && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{anomaly.message}</p>
          )}

          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(anomaly.detected_at), { addSuffix: true })}
          </div>
        </div>

        <button
          onClick={() => onResolve(anomaly.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border",
            "border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50",
            "dark:border-slate-600 dark:text-slate-300 dark:hover:border-green-600 dark:hover:text-green-400 dark:hover:bg-green-900/20",
            "transition-all duration-150"
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Resolve
        </button>
      </div>
    </motion.div>
  );
}

function getUnit(metric: string): string {
  const units: Record<string, string> = {
    heart_rate: 'bpm',
    glucose: 'mg/dL',
    blood_pressure: 'mmHg',
    temperature: '°F',
    steps: 'steps',
  };
  return units[metric] || '';
}
```

---

## PART 15: ANIMATION PRESETS

```typescript
// lib/animations.ts
import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const collapseHeight: Variants = {
  open: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.05 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, delay: 0.05, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

// For multi-step forms
export const formStepForward: Variants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: -50, opacity: 0, transition: { duration: 0.2 } },
};

export const formStepBackward: Variants = {
  enter: { x: -50, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: 50, opacity: 0, transition: { duration: 0.2 } },
};
```

---

## PART 16: IMPLEMENTATION PRIORITIES & ORDER

Build in this exact order for maximum efficiency:

### Phase 1: Foundation (Build first)
1. ✅ Project setup (Next.js, Tailwind, providers, fonts)
2. ✅ `globals.css` with all CSS variables, loader keyframes, aurora styles
3. ✅ `lib/utils.ts` — `cn()` utility
4. ✅ `lib/api.ts` — Axios client with interceptors
5. ✅ `lib/validators.ts` — All Zod schemas
6. ✅ `types/` — All TypeScript interfaces
7. ✅ Root layout with providers (theme, query, auth, toaster)

### Phase 2: Core UI Components
8. ✅ `TrialGoLoader` component (3 sizes)
9. ✅ `AuroraBackground` component
10. ✅ `Button` (all variants: solid, outline, ghost, destructive, sizes)
11. ✅ `Input` with floating label
12. ✅ `Select`, `Combobox`, `Checkbox`, `Slider`
13. ✅ `Badge`, `StatCard`, `ProgressRing`
14. ✅ `AnimatedTabs`, `Accordion`, `Dialog`
15. ✅ `DataTable`, `Pagination`, `Skeleton`
16. ✅ `EmptyState`, `Breadcrumb`, `Tooltip`
17. ✅ `PageTransition` wrapper

### Phase 3: Layout Components
18. ✅ `AppSidebar` (role-aware, collapsible, mobile drawer)
19. ✅ `AppHeader` (greeting, notifications, dark mode toggle)
20. ✅ `RoleGuard` component
21. ✅ Route group layouts (patient, coordinator, pharma, auth)
22. ✅ `loading.tsx` files for all routes

### Phase 4: Auth Pages
23. ✅ Landing page (`/`) — all 7 sections
24. ✅ Registration (`/register`) — 3-step flow
25. ✅ Patient login (`/login`)
26. ✅ Coordinator login (`/coordinator/login`)
27. ✅ Pharma login (`/pharma/login`)
28. ✅ 404 page

### Phase 5: Patient Pages
29. ✅ Dashboard (`/dashboard`)
30. ✅ Trial discovery (`/trials`)
31. ✅ Trial detail (`/trials/[id]`)
32. ✅ Onboarding questionnaire (`/onboarding/questionnaire`)
33. ✅ Symptom log (`/patient/symptom-log`)
34. ✅ Consent (`/consent`)
35. ✅ Chatbot (`/chatbot`)

### Phase 6: Pharma Pages
36. ✅ Analytics (`/pharma/analytics`)
37. ✅ Trials list (`/pharma/trials`)
38. ✅ Create trial (`/pharma/create-trial`)
39. ✅ Candidates (`/pharma/candidates/[trialId]`)
40. ✅ Social discovery (`/pharma/discovery/[trialId]`)
41. ✅ FHIR export (`/pharma/fhir/[trialId]`)

### Phase 7: Coordinator Pages
42. ✅ Cohort dashboard (`/coordinator/cohort`) — all 3 tabs
43. ✅ Anomalies standalone (`/coordinator/anomalies`)

### Phase 8: Polish & Integration
44. ✅ WebSocket integration (coordinator real-time)
45. ✅ All loading/error/empty states
46. ✅ Dark mode testing across all pages
47. ✅ Mobile responsiveness testing
48. ✅ Accessibility audit (keyboard, ARIA, contrast)
49. ✅ Performance optimization (lazy loading, code splitting)
50. ✅ Cross-browser testing

---

## PART 17: QUALITY CHECKLIST

Before considering any page "complete", verify ALL of the following:

### Visual
- [ ] Colors match the design system exactly
- [ ] Typography scale is consistent (no random font sizes)
- [ ] Spacing follows the 4px grid system
- [ ] Border radius is consistent (16px cards, 12px buttons, 10px inputs)
- [ ] Shadows are from the defined shadow system
- [ ] Blue accent is used sparingly and intentionally
- [ ] Generous whitespace — no cramped layouts
- [ ] Icons are from Lucide, consistent size per context

### Interactions
- [ ] All buttons have hover (scale 1.02 + darken) and active (scale 0.98) states
- [ ] Cards have hover lift + blue shadow
- [ ] Inputs have focus ring (blue)
- [ ] Page content fades in on mount (PageTransition)
- [ ] Lists/grids use stagger animation on initial render
- [ ] Tabs have sliding indicator (layoutId)
- [ ] Accordions animate height smoothly
- [ ] Modals have backdrop + scale animation
- [ ] Toasts slide in from right
- [ ] Loading states show TrialGoLoader or skeleton shimmer

### Responsive
- [ ] Renders correctly at 375px width (iPhone SE)
- [ ] Renders correctly at 768px (tablet)
- [ ] Renders correctly at 1024px (laptop)
- [ ] Renders correctly at 1440px (desktop)
- [ ] Sidebar collapses properly on smaller screens
- [ ] Grids reflow (2col → 1col on mobile)
- [ ] Tables scroll horizontally on mobile
- [ ] Touch targets are minimum 44px

### Dark Mode
- [ ] All text is readable on dark backgrounds
- [ ] Cards have dark surface colors (not pure black)
- [ ] Borders use dark border tokens
- [ ] Charts adapt (lighter colors, dark grid lines)
- [ ] Loader uses white borders in dark mode
- [ ] No white flashes during transitions
- [ ] Images/illustrations adapt or remain neutral

### Accessibility
- [ ] All inputs have associated labels (even if visually hidden)
- [ ] Focus order is logical (tab through page makes sense)
- [ ] Focus ring is visible and correct color
- [ ] Color is never the only indicator (always paired with text/icon)
- [ ] ARIA attributes on dynamic content (live regions, expanded states)
- [ ] Keyboard can operate all functionality
- [ ] `prefers-reduced-motion` disables animations

### Performance
- [ ] No layout shift on load (proper sizing/skeleton)
- [ ] Images use next/image with proper dimensions
- [ ] Charts lazy-loaded (not in initial bundle)
- [ ] No unnecessary re-renders (memo, useMemo where appropriate)
- [ ] API calls use TanStack Query (caching, deduplication)

---

## PROMPT END

---

**FINAL NOTE TO DEVELOPER:**

This is a healthcare platform. Users are patients dealing with serious medical conditions, coordinators managing critical safety data, and pharma professionals making regulatory decisions. Every design decision must reinforce **trust**, **clarity**, and **professionalism**.

The UI should feel like it was designed by a world-class agency — not thrown together by developers. Think Apple Health meets Linear meets Stripe Dashboard. Minimal, purposeful, beautiful.

When in doubt:
- Add more whitespace
- Reduce visual noise
- Make the primary action obvious
- Animate to communicate, not to decorate
- Test on mobile first

Build this with pride. Every pixel counts.