export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
            <div className="h-4 w-40 bg-zinc-800 rounded mb-3" />
            <div className="h-3 w-full bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-2/3 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
