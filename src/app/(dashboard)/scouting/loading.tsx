export default function ScoutingLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-7 w-36 bg-zinc-800 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse min-h-[300px]">
            <div className="h-4 w-24 bg-zinc-800 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 bg-zinc-800/50 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
