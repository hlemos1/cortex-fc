"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Brain, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Senhas nao coincidem")
      return
    }

    if (password.length < 8) {
      setError("Senha deve ter no minimo 8 caracteres")
      return
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Senha deve conter maiuscula, minuscula e numero")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha")
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-zinc-100 mb-2">Link invalido</h1>
            <p className="text-sm text-zinc-500 mb-4">
              O link de redefinicao esta ausente ou expirou.
            </p>
            <Link
              href="/forgot-password"
              className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 card-hover">
          <div className="flex flex-col items-center mb-8 animate-slide-down">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Brain className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Nova Senha</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Crie uma senha forte para sua conta
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400">
                  Senha redefinida com sucesso.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-900/30"
              >
                Fazer login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400" htmlFor="password">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caracteres"
                    required
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600">Maiuscula + minuscula + numero</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400" htmlFor="confirm">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
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
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
