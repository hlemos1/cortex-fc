"use client"

import { useState } from "react"
import Image from "next/image"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerAvatarProps {
  src: string | null | undefined
  name: string
  size?: number
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function PlayerAvatar({ src, name, size = 40, className }: PlayerAvatarProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div
        className={cn(
          "rounded-full bg-zinc-800 flex items-center justify-center ring-1 ring-zinc-700/50 flex-shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      >
        {name ? (
          <span
            className="font-bold text-zinc-500 select-none"
            style={{ fontSize: size * 0.32 }}
          >
            {getInitials(name)}
          </span>
        ) : (
          <User className="text-zinc-500" style={{ width: size * 0.5, height: size * 0.5 }} />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn("relative rounded-full overflow-hidden bg-zinc-800 ring-1 ring-zinc-700/50 flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  )
}
