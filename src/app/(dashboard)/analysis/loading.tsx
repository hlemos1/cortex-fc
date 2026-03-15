export default function AnalysisLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-7 w-40 bg-zinc-800 rounded animate-pulse" />
        <div className="h-9 w-36 bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-zinc-800 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-zinc-800 rounded" />
                <div className="h-3 w-60 bg-zinc-800 rounded" />
              </div>
              <div className="h-6 w-20 bg-zinc-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
