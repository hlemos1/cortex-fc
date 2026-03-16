"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Activity,
  Search,
  FileText,
  MessageSquare,
  ArrowRightLeft,
  Monitor,
  Building2,
  Shield,
  CreditCard,
  Settings,
  Plus,
  Command,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href?: string
  shortcut?: string
  group: string
  action?: () => void
}

const PAGES: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Visao geral", icon: <LayoutDashboard className="w-4 h-4" />, href: "/dashboard", group: "Paginas" },
  { id: "players", label: "Jogadores", description: "Base de dados", icon: <Users className="w-4 h-4" />, href: "/players", group: "Paginas" },
  { id: "analysis", label: "Analises", description: "Resultados neurais", icon: <Activity className="w-4 h-4" />, href: "/analysis", group: "Paginas" },
  { id: "scouting", label: "Scouting", description: "Pipeline de alvos", icon: <Search className="w-4 h-4" />, href: "/scouting", group: "Paginas" },
  { id: "reports", label: "Relatorios", description: "Pareceres e PDFs", icon: <FileText className="w-4 h-4" />, href: "/reports", group: "Paginas" },
  { id: "chat", label: "Chat IA", description: "Assistente neural", icon: <MessageSquare className="w-4 h-4" />, href: "/chat", group: "Paginas" },
  { id: "simulator", label: "Simulador", description: "Cenarios de transferencia", icon: <ArrowRightLeft className="w-4 h-4" />, href: "/simulator", group: "Paginas" },
  { id: "agent-console", label: "Console IA", description: "Agentes autonomos", icon: <Monitor className="w-4 h-4" />, href: "/agent-console", group: "Paginas" },
  { id: "holding", label: "Holding", description: "Multi-organizacao", icon: <Building2 className="w-4 h-4" />, href: "/holding", group: "Paginas" },
  { id: "audit-log", label: "Audit Log", description: "Historico de acoes", icon: <Shield className="w-4 h-4" />, href: "/audit-log", group: "Paginas" },
  { id: "billing", label: "Assinatura", description: "Planos e pagamento", icon: <CreditCard className="w-4 h-4" />, href: "/billing", group: "Paginas" },
  { id: "settings", label: "Configuracoes", description: "IA, API, notificacoes", icon: <Settings className="w-4 h-4" />, href: "/settings", group: "Paginas" },
]

const ACTIONS: CommandItem[] = [
  { id: "new-analysis", label: "Nova Analise", description: "Cmd+N", icon: <Plus className="w-4 h-4" />, href: "/analysis/new", shortcut: "N", group: "Acoes" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const allItems = [...ACTIONS, ...PAGES]

  const filtered = query.length === 0
    ? allItems
    : allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )

  const groups = Array.from(new Set(filtered.map((i) => i.group)))

  const execute = useCallback((item: CommandItem) => {
    setOpen(false)
    setQuery("")
    if (item.href) router.push(item.href)
    if (item.action) item.action()
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery("")
        setSelectedIndex(0)
      }

      // Cmd+N for new analysis
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !open) {
        e.preventDefault()
        router.push("/analysis/new")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, router])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Navigate with arrows
  useEffect(() => {
    if (!open) return

    function handleNav(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault()
        execute(filtered[selectedIndex])
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleNav)
    return () => document.removeEventListener("keydown", handleNav)
  }, [open, selectedIndex, filtered, execute])

  // Reset index on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (!open) return null

  let flatIndex = -1

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15%] z-[201] flex justify-center px-4 animate-scale-in">
        <div role="dialog" aria-modal="true" aria-label="Busca rapida" className="w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
            <Command className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pagina, acao ou jogador..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 font-mono border border-zinc-700/50">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-600 text-sm">
                Nenhum resultado para &ldquo;{query}&rdquo;
              </div>
            )}

            {groups.map((group) => {
              const groupItems = filtered.filter((i) => i.group === group)
              return (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
                    {group}
                  </div>
                  {groupItems.map((item) => {
                    flatIndex++
                    const idx = flatIndex
                    const isSelected = idx === selectedIndex

                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={() => execute(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "text-zinc-400 hover:bg-zinc-800/50"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0",
                          isSelected ? "text-emerald-400" : "text-zinc-600"
                        )}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.description && (
                            <span className="ml-2 text-xs text-zinc-600">{item.description}</span>
                          )}
                        </div>
                        {item.shortcut && (
                          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 font-mono border border-zinc-700/50">
                            Cmd+{item.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono border border-zinc-700/50">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono border border-zinc-700/50">Enter</kbd>
              Selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono border border-zinc-700/50">Esc</kbd>
              Fechar
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
