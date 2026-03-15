"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  updatedAt: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  tokensUsed?: number
  createdAt: string
}

const SUGGESTIONS = [
  "Qual o panorama geral do nosso elenco?",
  "Quais jogadores tem o melhor SCN+?",
  "Resuma nosso pipeline de scouting",
  "Quais posicoes precisam de reforco?",
  "Compare os jogadores analisados recentemente",
  "Qual alvo de scouting tem melhor custo-beneficio?",
]

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat")
      const json = await res.json()
      setConversations(json.data ?? [])
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    fetch(`/api/chat?conversationId=${activeConvId}`)
      .then((r) => r.json())
      .then((json) => setMessages(json.data ?? []))
  }, [activeConvId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function createConversation() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    })
    const json = await res.json()
    if (json.data) {
      setConversations((prev) => [json.data, ...prev])
      setActiveConvId(json.data.id)
      setMessages([])
    }
  }

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || sending) return

    // Auto-create conversation if none active
    let convId = activeConvId
    if (!convId) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      })
      const json = await res.json()
      if (json.data) {
        convId = json.data.id
        setConversations((prev) => [json.data, ...prev])
        setActiveConvId(convId)
      }
    }

    if (!convId) return

    setInput("")
    setSending(true)

    // Optimistic user message
    const tempUserMsg: Message = {
      id: "temp-user",
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: msg }),
      })
      const json = await res.json()

      if (json.data) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "temp-user"),
          { ...tempUserMsg, id: "user-" + Date.now() },
          json.data,
        ])
        // Update conversation title in sidebar
        fetchConversations()
      } else {
        // Error - remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== "temp-user"))
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function deleteConv(id: string) {
    await fetch(`/api/chat?conversationId=${id}`, { method: "DELETE" })
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConvId === id) {
      setActiveConvId(null)
      setMessages([])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r border-zinc-800/60 bg-zinc-900/30 transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        {/* New conversation */}
        <div className="p-3 border-b border-zinc-800/60">
          <Button
            onClick={createConversation}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova conversa
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8 px-4">
              Nenhuma conversa ainda. Comece perguntando sobre seus jogadores.
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors",
                  activeConvId === conv.id
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                )}
              >
                <button
                  onClick={() => setActiveConvId(conv.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-xs truncate">{conv.title}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {new Date(conv.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConv(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-12 border-b border-zinc-800/60 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform",
                sidebarOpen && "rotate-180"
              )}
            />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-zinc-300">
              Chat IA Contextual
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono ml-auto">
            claude-sonnet-4
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !activeConvId ? (
            // Empty state with suggestions
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-200 mb-2">
                Chat IA Contextual
              </h2>
              <p className="text-sm text-zinc-500 text-center max-w-md mb-8">
                Converse com a IA usando o contexto completo da sua organizacao:
                elenco, analises, scouting e mais.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-emerald-500/20 transition-all group"
                  >
                    <p className="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-2">
                      {s}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            // Active conversation but no messages
            <div className="flex flex-col items-center justify-center h-full">
              <Bot className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-600">
                Comece a conversa...
              </p>
            </div>
          ) : (
            // Messages list
            <div className="py-4 space-y-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "px-6 py-4",
                    msg.role === "assistant" && "bg-zinc-900/30"
                  )}
                >
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                        msg.role === "assistant"
                          ? "bg-emerald-500/20"
                          : "bg-zinc-800"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <User className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-400">
                          {msg.role === "assistant" ? "CORTEX IA" : "Voce"}
                        </span>
                        <span className="text-[10px] text-zinc-700">
                          {formatTime(msg.createdAt)}
                        </span>
                        {msg.tokensUsed && (
                          <span className="text-[10px] text-zinc-700 font-mono">
                            {msg.tokensUsed} tokens
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="px-6 py-4 bg-zinc-900/30">
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-500/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-500/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-zinc-600">Analisando contexto...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-800/60 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre jogadores, analises, scouting..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-zinc-700/40 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = "44px"
                    target.style.height = target.scrollHeight + "px"
                  }}
                />
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 w-11 p-0 rounded-xl disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-2 text-center">
              Respostas baseadas nos dados da sua organizacao. Claude Sonnet 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
