"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Sem conexao</h1>
        <p className="text-zinc-500 mb-6">Voce esta offline. Verifique sua conexao com a internet e tente novamente.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
