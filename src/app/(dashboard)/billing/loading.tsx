export default function BillingLoading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
        <div className="h-4 w-24 bg-zinc-800 rounded mb-2" />
        <div className="h-6 w-40 bg-zinc-800 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse min-h-[400px]">
            <div className="h-5 w-32 bg-zinc-800 rounded mb-4" />
            <div className="h-8 w-24 bg-zinc-800 rounded mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-3 bg-zinc-800/50 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
