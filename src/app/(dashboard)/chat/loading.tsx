import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl min-h-[500px] flex flex-col">
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className={`space-y-2 max-w-[60%] ${i % 2 === 0 ? "" : "items-end"}`}>
                <Skeleton className={`h-16 w-64 rounded-xl ${i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-800 p-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
