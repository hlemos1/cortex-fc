"use client"

import { useReducedMotion } from "framer-motion"
import * as motion from "framer-motion/client"
import { cn } from "@/lib/utils"

// ============================================
// Reduced motion hook wrapper
// ============================================

export { useReducedMotion }

// ============================================
// Spring presets
// ============================================

export const springs = {
  gentle: { type: "spring" as const, stiffness: 120, damping: 14, mass: 0.8 },
  snappy: { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.5 },
  bouncy: { type: "spring" as const, stiffness: 400, damping: 10, mass: 0.8 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 },
}

// ============================================
// FadeIn — simple opacity animation
// ============================================

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// SlideUp — slide from below with spring
// ============================================

export function SlideUp({
  children,
  className,
  delay = 0,
  distance = 12,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  distance?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// ScaleIn — scale from center with spring
// ============================================

export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springs.snappy, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// StaggerList — children animate one by one
// ============================================

export function StaggerList({
  children,
  className,
  staggerDelay = 0.06,
  initialDelay = 0,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// StaggerItem — child of StaggerList
// ============================================

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: springs.gentle,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Hover Scale — interactive card wrapper
// ============================================

export function HoverScale({
  children,
  className,
  scale = 1.02,
  lift = -2,
}: {
  children: React.ReactNode
  className?: string
  scale?: number
  lift?: number
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      whileHover={{ scale, y: lift }}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Parallax — subtle scroll-based movement
// ============================================

export function Parallax({
  children,
  className,
  offset = 20,
}: {
  children: React.ReactNode
  className?: string
  offset?: number
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ y: offset }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ ...springs.smooth, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// NumberTick — animated number counting
// ============================================

export function NumberTick({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.snappy}
      className={cn("inline-block tabular-nums", className)}
    >
      {value}
    </motion.span>
  )
}

// ============================================
// Pulse — attention-drawing pulse effect
// ============================================

export function Pulse({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(16, 185, 129, 0)",
          "0 0 0 8px rgba(16, 185, 129, 0.15)",
          "0 0 0 0 rgba(16, 185, 129, 0)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn("rounded-full", className)}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// AnimatePresence re-export
// ============================================

export { AnimatePresence } from "framer-motion"
