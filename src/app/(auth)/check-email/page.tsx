"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Brain, Mail } from "lucide-react"

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Verifique seu email</h1>
          </div>

          <p className="text-sm text-zinc-400 mb-2">
            Enviamos um link de confirmacao para:
          </p>
          <p className="text-sm text-emerald-400 font-medium mb-6">
            {email || "seu email"}
          </p>

          <div className="bg-zinc-900/80 rounded-lg p-4 mb-6">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Clique no link do email para ativar sua conta.
              O link expira em 24 horas.
              Verifique tambem a pasta de spam.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Ir para login
          </Link>
        </div>
      </div>
    </div>
  )
}
