"use client"

import { Parallax } from "@/components/ui/motion"

export function HeroParallax({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Parallax offset={15} className={className}>
      {children}
    </Parallax>
  )
}
