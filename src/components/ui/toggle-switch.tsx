"use client"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: ToggleSwitchProps) {
  const trackSize = size === "sm" ? "w-8 h-[18px]" : "w-10 h-[22px]"
  const thumbSize = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5"
  const thumbTranslate = checked
    ? size === "sm"
      ? "translate-x-[14px]"
      : "translate-x-[18px]"
    : "translate-x-0"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className={`
        relative inline-flex items-center rounded-full p-[2px]
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
        ${trackSize}
        ${checked ? "bg-emerald-500" : "bg-zinc-700"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-block rounded-full
          transition-transform duration-200 ease-in-out
          ${thumbSize}
          ${thumbTranslate}
          ${checked ? "bg-white" : "bg-zinc-400"}
        `}
      />
    </button>
  )
}
