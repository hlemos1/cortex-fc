"use client"

import { useState, useEffect, useRef } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface ValidationRule {
  test: (value: string) => boolean
  message: string
}

interface FormFieldProps {
  label: string
  id: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: LucideIcon
  required?: boolean
  rules?: ValidationRule[]
  debounceMs?: number
  rightElement?: React.ReactNode
  className?: string
  autoComplete?: string
}

export function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  required,
  rules = [],
  debounceMs = 300,
  rightElement,
  className,
  autoComplete,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState("")
  const [valid, setValid] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!touched) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      validate(value)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, touched])

  function validate(val: string) {
    if (required && !val.trim()) {
      setError("Campo obrigatorio")
      setValid(false)
      return
    }

    for (const rule of rules) {
      if (!rule.test(val)) {
        setError(rule.message)
        setValid(false)
        return
      }
    }

    setError("")
    setValid(val.length > 0)
  }

  const showValid = touched && valid && !error
  const showError = touched && !!error

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1">
        <label className="text-xs font-medium text-zinc-400" htmlFor={id}>
          {label}
        </label>
        {required && <span className="text-red-400 text-xs">*</span>}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            showError ? "text-red-400" : showValid ? "text-emerald-400" : "text-zinc-600"
          )} />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "w-full bg-zinc-900/80 border rounded-lg py-2.5 text-sm text-zinc-200 placeholder-zinc-600 transition-all duration-200",
            "focus:outline-none focus:ring-1",
            Icon ? "pl-10" : "pl-4",
            rightElement ? "pr-10" : "pr-4",
            showError
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
              : showValid
                ? "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/30"
                : "border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/30"
          )}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
        {/* Validation indicator */}
        {!rightElement && touched && value.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {showValid && <Check className="w-4 h-4 text-emerald-400" />}
            {showError && <X className="w-4 h-4 text-red-400" />}
          </div>
        )}
      </div>
      {showError && (
        <p className="text-[11px] text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  )
}

// Common validation rules
export const RULES = {
  email: {
    test: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: "Email invalido",
  },
  minLength: (n: number) => ({
    test: (v: string) => v.length >= n,
    message: `Minimo ${n} caracteres`,
  }),
  maxLength: (n: number) => ({
    test: (v: string) => v.length <= n,
    message: `Maximo ${n} caracteres`,
  }),
  noSpaces: {
    test: (v: string) => !/\s/.test(v),
    message: "Nao pode conter espacos",
  },
}
