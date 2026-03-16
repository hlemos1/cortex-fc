import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryIcon?: LucideIcon
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryIcon: SecondaryIcon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("py-16 text-center animate-fade-in", className)}>
      <div className="flex items-center justify-center gap-3 mb-5">
        {SecondaryIcon && (
          <SecondaryIcon className="w-6 h-6 text-zinc-800" />
        )}
        <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center">
          <Icon className="w-7 h-7 text-zinc-600" />
        </div>
        {SecondaryIcon && (
          <SecondaryIcon className="w-6 h-6 text-zinc-800 scale-x-[-1]" />
        )}
      </div>
      <h3 className="text-zinc-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-zinc-600 text-xs max-w-sm mx-auto">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-5">
          {actionHref ? (
            <Link href={actionHref}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onAction}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
