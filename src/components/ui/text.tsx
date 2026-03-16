"use client"

import { cn } from "@/lib/utils"

type TextVariant =
  | "display"    // 3xl bold — hero titles
  | "headline"   // 2xl bold — page titles
  | "title-lg"   // lg semibold — card titles large
  | "title"      // sm semibold — card titles, panel headers
  | "body-lg"    // base — large body text
  | "body"       // sm — default body text
  | "caption"    // xs — timestamps, metadata
  | "caption-sm" // [10px] — tiny labels
  | "label"      // xs medium uppercase tracking-wider — section markers
  | "mono-xl"    // 2xl bold mono — big numbers
  | "mono-lg"    // lg bold mono — medium numbers
  | "mono"       // xs mono — small numbers, IDs
  | "code"       // xs mono bg — inline code

type TextColor =
  | "default"    // inherits
  | "primary"    // zinc-100
  | "secondary"  // zinc-300
  | "tertiary"   // zinc-400
  | "muted"      // zinc-500
  | "faint"      // zinc-600
  | "ghost"      // zinc-700
  | "accent"     // emerald-400
  | "success"    // emerald-400
  | "error"      // red-400
  | "warning"    // amber-400
  | "info"       // cyan-400

const VARIANT_CLASSES: Record<TextVariant, string> = {
  display: "text-3xl font-bold tracking-tight",
  headline: "text-2xl font-bold tracking-tight",
  "title-lg": "text-lg font-semibold",
  title: "text-sm font-semibold",
  "body-lg": "text-base",
  body: "text-sm",
  caption: "text-xs",
  "caption-sm": "text-[10px]",
  label: "text-xs font-medium uppercase tracking-wider",
  "mono-xl": "text-2xl font-bold font-mono tracking-tight",
  "mono-lg": "text-lg font-bold font-mono",
  mono: "text-xs font-mono",
  code: "text-xs font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded",
}

const COLOR_CLASSES: Record<TextColor, string> = {
  default: "",
  primary: "text-zinc-100",
  secondary: "text-zinc-300",
  tertiary: "text-zinc-400",
  muted: "text-zinc-500",
  faint: "text-zinc-600",
  ghost: "text-zinc-700",
  accent: "text-emerald-400",
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-cyan-400",
}

// Default color per variant for better DX
const DEFAULT_COLORS: Partial<Record<TextVariant, TextColor>> = {
  display: "primary",
  headline: "primary",
  "title-lg": "primary",
  title: "tertiary",
  body: "default",
  "body-lg": "default",
  caption: "muted",
  "caption-sm": "faint",
  label: "muted",
  "mono-xl": "primary",
  "mono-lg": "primary",
  mono: "tertiary",
  code: "tertiary",
}

// Default element per variant
const DEFAULT_ELEMENTS: Partial<Record<TextVariant, keyof React.JSX.IntrinsicElements>> = {
  display: "h1",
  headline: "h2",
  "title-lg": "h3",
  title: "h4",
  label: "span",
  "caption-sm": "span",
  mono: "span",
  "mono-lg": "span",
  "mono-xl": "span",
  code: "code",
}

interface TextProps {
  variant?: TextVariant
  color?: TextColor
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  children: React.ReactNode
}

export function Text({
  variant = "body",
  color,
  as,
  className,
  children,
  ...props
}: TextProps & Omit<React.HTMLAttributes<HTMLElement>, keyof TextProps>) {
  const resolvedColor = color ?? DEFAULT_COLORS[variant] ?? "default"
  const Component = (as ?? DEFAULT_ELEMENTS[variant] ?? "p") as React.ElementType

  return (
    <Component
      className={cn(
        VARIANT_CLASSES[variant],
        COLOR_CLASSES[resolvedColor],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
