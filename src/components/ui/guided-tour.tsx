"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface TourStep {
  target: string
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
}

interface GuidedTourProps {
  steps: TourStep[]
  tourId: string
  onComplete?: () => void
}

function getStorageKey(tourId: string) {
  return `tour-${tourId}-completed`
}

function isTourCompleted(tourId: string): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem(getStorageKey(tourId)) === "true"
  } catch {
    return false
  }
}

function markTourCompleted(tourId: string) {
  try {
    localStorage.setItem(getStorageKey(tourId), "true")
  } catch {
    // localStorage not available
  }
}

function clearTourCompleted(tourId: string) {
  try {
    localStorage.removeItem(getStorageKey(tourId))
  } catch {
    // localStorage not available
  }
}

interface TooltipPosition {
  top: number
  left: number
  arrowSide: "top" | "bottom" | "left" | "right"
}

function calculateTooltipPosition(
  rect: DOMRect,
  position: "top" | "bottom" | "left" | "right",
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const gap = 16
  const padding = 12

  let top = 0
  let left = 0
  const arrowSide = position === "top" ? "bottom" : position === "bottom" ? "top" : position === "left" ? "right" : "left"

  switch (position) {
    case "top":
      top = rect.top - tooltipHeight - gap
      left = rect.left + rect.width / 2 - tooltipWidth / 2
      break
    case "bottom":
      top = rect.bottom + gap
      left = rect.left + rect.width / 2 - tooltipWidth / 2
      break
    case "left":
      top = rect.top + rect.height / 2 - tooltipHeight / 2
      left = rect.left - tooltipWidth - gap
      break
    case "right":
      top = rect.top + rect.height / 2 - tooltipHeight / 2
      left = rect.right + gap
      break
  }

  // Clamp to viewport
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (left < padding) left = padding
  if (left + tooltipWidth > vw - padding) left = vw - tooltipWidth - padding
  if (top < padding) top = padding
  if (top + tooltipHeight > vh - padding) top = vh - tooltipHeight - padding

  return { top, left, arrowSide }
}

function GuidedTour({ steps, tourId, onComplete }: GuidedTourProps) {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null)

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  // Check if tour should show on mount
  useEffect(() => {
    if (!isTourCompleted(tourId) && steps.length > 0) {
      // Small delay to let dashboard elements render
      const timer = setTimeout(() => queueMicrotask(() => setActive(true)), 800)
      return () => clearTimeout(timer)
    }
  }, [tourId, steps.length])

  // Find and measure target element
  const measureTarget = useCallback(() => {
    if (!active || !step) return
    const el = document.querySelector(step.target)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      // Wait for scroll to settle
      const timer = setTimeout(() => {
        const rect = el.getBoundingClientRect()
        queueMicrotask(() => setTargetRect(rect))
      }, 300)
      return () => clearTimeout(timer)
    } else {
      // Target not found — skip step or close
      queueMicrotask(() => setTargetRect(null))
    }
  }, [active, step])

  useEffect(() => {
    const cleanup = measureTarget()
    return cleanup
  }, [measureTarget])

  // Recalculate on resize
  useEffect(() => {
    if (!active) return
    const handleResize = () => {
      if (!step) return
      const el = document.querySelector(step.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        queueMicrotask(() => setTargetRect(rect))
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [active, step])

  // Position tooltip after rect is known
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return
    const tooltipEl = tooltipRef.current
    const pos = calculateTooltipPosition(
      targetRect,
      step?.position ?? "bottom",
      tooltipEl.offsetWidth,
      tooltipEl.offsetHeight
    )
    queueMicrotask(() => setTooltipPos(pos))
  }, [targetRect, step])

  const closeTour = useCallback(() => {
    setActive(false)
    markTourCompleted(tourId)
    onComplete?.()
  }, [tourId, onComplete])

  const nextStep = useCallback(() => {
    if (isLast) {
      closeTour()
    } else {
      setTooltipPos(null)
      setTargetRect(null)
      setCurrentStep((s) => s + 1)
    }
  }, [isLast, closeTour])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setTooltipPos(null)
      setTargetRect(null)
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  // Keyboard navigation
  useEffect(() => {
    if (!active) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault()
        nextStep()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prevStep()
      } else if (e.key === "Escape") {
        e.preventDefault()
        closeTour()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [active, nextStep, prevStep, closeTour])

  if (!active || !step) return null

  const spotlightPadding = 8

  return (
    <div
      className="fixed inset-0 animate-fade-in"
      style={{ zIndex: 9999 }}
    >
      {/* Dark overlay with spotlight cutout */}
      {targetRect ? (
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(0,0,0,0.6)",
            clipPath: `polygon(
              0% 0%, 0% 100%,
              ${targetRect.left - spotlightPadding}px 100%,
              ${targetRect.left - spotlightPadding}px ${targetRect.top - spotlightPadding}px,
              ${targetRect.right + spotlightPadding}px ${targetRect.top - spotlightPadding}px,
              ${targetRect.right + spotlightPadding}px ${targetRect.bottom + spotlightPadding}px,
              ${targetRect.left - spotlightPadding}px ${targetRect.bottom + spotlightPadding}px,
              ${targetRect.left - spotlightPadding}px 100%,
              100% 100%, 100% 0%
            )`,
          }}
          onClick={closeTour}
        />
      ) : (
        <div
          className="absolute inset-0 bg-black/60"
          onClick={closeTour}
        />
      )}

      {/* Spotlight ring around target */}
      {targetRect && (
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute animate-scale-in"
        style={{
          top: tooltipPos?.top ?? -9999,
          left: tooltipPos?.left ?? -9999,
          width: 300,
          opacity: tooltipPos ? 1 : 0,
        }}
      >
        {/* Arrow */}
        {tooltipPos && (
          <div
            className="absolute w-3 h-3 rotate-45"
            style={{
              background: "rgba(24, 24, 27, 0.9)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              ...(tooltipPos.arrowSide === "top" && {
                top: -6,
                left: "50%",
                marginLeft: -6,
                borderBottom: "none",
                borderRight: "none",
              }),
              ...(tooltipPos.arrowSide === "bottom" && {
                bottom: -6,
                left: "50%",
                marginLeft: -6,
                borderTop: "none",
                borderLeft: "none",
              }),
              ...(tooltipPos.arrowSide === "left" && {
                left: -6,
                top: "50%",
                marginTop: -6,
                borderTop: "none",
                borderRight: "none",
              }),
              ...(tooltipPos.arrowSide === "right" && {
                right: -6,
                top: "50%",
                marginTop: -6,
                borderBottom: "none",
                borderLeft: "none",
              }),
            }}
          />
        )}

        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(24, 24, 27, 0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.08)",
          }}
        >
          <h3 className="text-sm font-bold text-zinc-100 mb-1">{step.title}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">{step.description}</p>

          {/* Step indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">
                {currentStep + 1} de {steps.length}
              </span>
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                    style={{
                      background: i === currentStep
                        ? "#10b981"
                        : i < currentStep
                          ? "rgba(16, 185, 129, 0.3)"
                          : "#3f3f46",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={closeTour}
                className="px-3 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
              >
                Pular
              </button>
              <button
                onClick={nextStep}
                className="px-3 py-1.5 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
              >
                {isLast ? "Concluir" : "Proximo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TourRestartButton({ tourId, onRestart }: { tourId: string; onRestart: () => void }) {
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const val = isTourCompleted(tourId)
    queueMicrotask(() => setCompleted(val))
  }, [tourId])

  if (!completed) return null

  return (
    <button
      onClick={() => {
        clearTourCompleted(tourId)
        setCompleted(false)
        onRestart()
      }}
      className="fixed bottom-6 right-6 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-zinc-400 hover:text-emerald-400 transition-all duration-200 animate-fade-in"
      style={{
        zIndex: 50,
        background: "rgba(24, 24, 27, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(63, 63, 70, 0.5)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
      title="Reiniciar tour"
    >
      ?
    </button>
  )
}

export { GuidedTour, TourRestartButton, clearTourCompleted, isTourCompleted }
export type { TourStep, GuidedTourProps }
