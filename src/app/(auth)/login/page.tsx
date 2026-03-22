"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Brain, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"
  const urlError = searchParams.get("error")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(urlError ?? "")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      // Check if the failure is due to unverified email
      try {
        const check = await fetch("/api/auth/check-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const data = await check.json()
        if (data.status === "unverified") {
          setError("Email nao verificado. Verifique sua caixa de entrada e clique no link de confirmacao.")
        } else {
          setError("Email ou senha incorretos")
        }
      } catch {
        setError("Email ou senha incorretos")
      }
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        {/* Card */}
        <div className="glass rounded-2xl p-8 card-hover">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 animate-slide-down">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse-glow">
              <Brain className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">CORTEX FC</h1>
            <p className="text-xs text-zinc-500 font-mono tracking-widest mt-0.5">
              NEURAL ANALYTICS
            </p>
          </div>

          {/* Verified banner */}
          {verified && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400">Email verificado com sucesso. Faca login.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
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
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:-translate-y-0.5"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900/80 px-3 text-zinc-500">ou</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-300 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Não tem conta?{" "}
            <Link
              href="/register"
              className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
