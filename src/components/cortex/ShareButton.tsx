"use client"

import { memo, useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Share2, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface ShareButtonProps {
  viewType: string
  viewConfig: Record<string, unknown>
  title?: string
}

type Expiration = 7 | 30 | 0

export const ShareButton = memo(function ShareButton({ viewType, viewConfig, title }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expiration, setExpiration] = useState<Expiration>(30)
  const { toast } = useToast()
  const t = useTranslations("share")
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setShareUrl(null)
      setCopied(false)
    }
  }, [open])

  async function handleShare() {
    setLoading(true)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewType,
          viewConfig,
          title,
          expiresInDays: expiration || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) {
        setShareUrl(data.url)
      }
    } catch {
      toast({ type: "error", title: "Erro ao gerar link", description: "Tente novamente" })
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({ type: "success", title: "Link copiado para a area de transferencia" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ type: "error", title: "Erro ao copiar link" })
    }
  }

  const expirationOptions: { value: Expiration; label: string }[] = [
    { value: 7, label: `7 ${t("days")}` },
    { value: 30, label: `30 ${t("days")}` },
    { value: 0, label: t("never") },
  ]

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-zinc-400 hover:text-zinc-200"
        onClick={() => setOpen(!open)}
      >
        <Share2 className="h-4 w-4" />
        <span className="text-xs">{t("shareView")}</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl z-50">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-200">{t("shareView")}</h4>

            {!shareUrl ? (
              <>
                {/* Expiration selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500">{t("expiresIn")}</label>
                  <div className="flex gap-1.5">
                    {expirationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setExpiration(opt.value)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          expiration === opt.value
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleShare}
                  disabled={loading}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("shareView")
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 truncate"
                  />
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  {copied ? t("linkCopied") : t("copyLink")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
