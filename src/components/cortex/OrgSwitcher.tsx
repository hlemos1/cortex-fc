"use client"

import { useState, useEffect } from "react"
import { Building2, ChevronDown, Check } from "lucide-react"

interface OrgOption {
  orgId: string
  orgName: string
  orgSlug: string
  orgTier: string
  role: string
}

interface Props {
  currentOrgId: string
  currentOrgName: string
}

export function OrgSwitcher({ currentOrgId, currentOrgName }: Props) {
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    fetch("/api/orgs")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setOrgs(data.data)
      })
      .catch(() => {})
  }, [])

  // Don't show switcher if user only has 1 or 0 orgs
  if (orgs.length <= 1) {
    return (
      <span className="text-xs text-zinc-500 flex items-center gap-1.5">
        <Building2 className="w-3 h-3" />
        {currentOrgName || "Carregando..."}
      </span>
    )
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrgId || switching) return
    setSwitching(true)
    try {
      const res = await fetch("/api/orgs/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      })
      if (res.ok) {
        // Force page reload to refresh session
        window.location.reload()
      }
    } catch {}
    setSwitching(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800/50"
      >
        <Building2 className="w-3 h-3" />
        <span className="max-w-[120px] truncate">{currentOrgName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 animate-fade-in">
            <div className="px-3 py-1.5 border-b border-zinc-800">
              <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Organizacoes</p>
            </div>
            {orgs.map((org) => (
              <button
                key={org.orgId}
                onClick={() => handleSwitch(org.orgId)}
                disabled={switching}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-zinc-800/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-zinc-200 font-medium">{org.orgName}</p>
                  <p className="text-[10px] text-zinc-600 capitalize">{org.role} — {org.orgTier.replace("_", " ")}</p>
                </div>
                {org.orgId === currentOrgId && (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
