"use client"

import { useState } from "react"
import Link from "next/link"
import { Brain, Mail, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erro ao enviar email")
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError("Erro de conexao. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 card-hover">
          <div className="flex flex-col items-center mb-8 animate-slide-down">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Brain className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Redefinir Senha</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Enviaremos um link para redefinir sua senha
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400">
                  Se o email estiver cadastrado, voce recebera um link de redefinicao.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-900/30"
              >
                {loading ? "Enviando..." : "Enviar link de redefinicao"}
              </button>

              <Link
                href="/login"
                className="block text-center text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Voltar ao login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
