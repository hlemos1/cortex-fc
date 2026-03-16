/**
 * Cortex FC Design System — Semantic Tokens
 *
 * Single source of truth for colors, spacing, radii, shadows, and typography.
 * All values map to CSS variables defined in globals.css.
 */

// ============================================
// Colors — Semantic
// ============================================

export const colors = {
  // Surfaces
  surface: {
    base: "bg-zinc-950",        // page background
    raised: "bg-zinc-900/80",   // cards, panels
    overlay: "bg-zinc-800/50",  // dropdowns, popovers
    inset: "bg-zinc-800/30",    // inputs, recessed areas
    glass: "glass",             // glassmorphism panels
    glassStrong: "glass-strong", // header, strong blur
  },

  // Borders
  border: {
    default: "border-zinc-800",
    subtle: "border-zinc-800/60",
    muted: "border-zinc-700/40",
    focus: "border-emerald-500/50",
    active: "border-emerald-500/30",
  },

  // Text
  text: {
    primary: "text-zinc-100",
    secondary: "text-zinc-300",
    tertiary: "text-zinc-400",
    muted: "text-zinc-500",
    faint: "text-zinc-600",
    ghost: "text-zinc-700",
  },

  // Accent — Emerald (primary brand)
  accent: {
    text: "text-emerald-400",
    textHover: "text-emerald-300",
    bg: "bg-emerald-500/10",
    bgSolid: "bg-emerald-600",
    bgHover: "bg-emerald-700",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
  },

  // Semantic status
  status: {
    success: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    error: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    warning: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    info: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  },

  // Data visualization
  data: {
    blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    red: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  },
} as const

// ============================================
// Spacing Scale (maps to Tailwind)
// ============================================

export const spacing = {
  page: "p-4 md:p-6",
  section: "space-y-6",
  card: "p-4",
  cardCompact: "p-3",
  cardLarge: "p-6 md:p-8",
  inline: "gap-2",
  stack: "gap-4",
  stackTight: "gap-2",
  stackLoose: "gap-6",
} as const

// ============================================
// Border Radius
// ============================================

export const radii = {
  sm: "rounded-md",      // 6px — inputs, small buttons
  md: "rounded-lg",      // 8px — cards, badges
  lg: "rounded-xl",      // 12px — panels, modals
  xl: "rounded-2xl",     // 16px — hero sections
  full: "rounded-full",  // pills, avatars
} as const

// ============================================
// Shadows
// ============================================

export const shadows = {
  sm: "shadow-sm",
  card: "shadow-lg shadow-black/20",
  elevated: "shadow-xl shadow-black/30",
  glow: {
    emerald: "shadow-lg shadow-emerald-900/20",
    cyan: "shadow-lg shadow-cyan-900/20",
    red: "shadow-lg shadow-red-900/20",
  },
} as const

// ============================================
// Typography Variants
// ============================================

export const typography = {
  // Display — hero, page titles
  display: "text-3xl font-bold tracking-tight",

  // Headline — section headers
  headline: "text-2xl font-bold tracking-tight",

  // Title — card titles, panel headers
  title: "text-sm font-semibold",
  titleLg: "text-lg font-semibold",

  // Body — paragraphs, descriptions
  body: "text-sm",
  bodyLg: "text-base",

  // Caption — timestamps, metadata
  caption: "text-xs",
  captionSm: "text-[10px]",

  // Label — form labels, section markers
  label: "text-xs font-medium uppercase tracking-wider",

  // Mono — numbers, scores, IDs
  mono: "font-mono",
  monoSm: "text-xs font-mono",
  monoLg: "text-lg font-bold font-mono",
  monoXl: "text-2xl font-bold font-mono tracking-tight",
} as const

// ============================================
// Interactive States
// ============================================

export const interactive = {
  cardHover: "card-hover",
  rowHover: "row-hover",
  inputGlow: "input-glow",
  btnPress: "btn-press",
  chipHover: "chip-hover",
} as const

// ============================================
// Animations
// ============================================

export const animations = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  slideDown: "animate-slide-down",
  scaleIn: "animate-scale-in",
  shimmer: "animate-shimmer",
  pulseGlow: "animate-pulse-glow",
  float: "animate-float",
  toastIn: "animate-toast-in",
  shake: "animate-shake",
  pageTransition: "page-transition",
  stagger: (n: 1 | 2 | 3 | 4 | 5) => `stagger-${n}` as const,
} as const

// ============================================
// Component Presets — Common combinations
// ============================================

export const presets = {
  card: "bg-zinc-900/80 border border-zinc-800 rounded-xl",
  cardGlass: "bg-zinc-900/80 border border-zinc-800 glass rounded-xl",
  cardInteractive: "bg-zinc-900/80 border border-zinc-800 rounded-xl card-hover",

  badge: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold",
  pill: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs",

  sectionHeader: "text-xs font-medium text-zinc-500 uppercase tracking-wider",
  pageHeader: "text-2xl font-bold text-zinc-100 tracking-tight",

  input: "bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm rounded-md",

  iconBox: (color: string) => `w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center ring-1 ring-${color}-500/20`,
} as const
