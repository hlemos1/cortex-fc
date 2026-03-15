export default function PlayersLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-9 w-24 bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="h-10 w-full max-w-md bg-zinc-800 rounded-lg animate-pulse" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-zinc-800 rounded-full" />
              <div>
                <div className="h-4 w-28 bg-zinc-800 rounded mb-1" />
                <div className="h-3 w-20 bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-zinc-800 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
