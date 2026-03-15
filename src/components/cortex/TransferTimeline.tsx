"use client";

import { ArrowRight, Banknote, Calendar } from "lucide-react";

interface Transfer {
  id: string;
  date: string;
  fromClub: string | null;
  toClub: string | null;
  fee: number | null;
  type: string | null;
}

interface TransferTimelineProps {
  transfers: Transfer[];
}

function formatFee(fee: number | null, type: string | null): string {
  if (type === "loan") return "Emprestimo";
  if (type === "free") return "Livre";
  if (!fee) return "N/D";
  return `\u20AC${fee}M`;
}

export function TransferTimeline({ transfers }: TransferTimelineProps) {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-600 text-sm">
        Nenhum historico de transferencia disponivel
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-500/30 via-zinc-700/50 to-transparent" />

      <div className="space-y-3">
        {transfers.map((t, i) => (
          <div
            key={t.id}
            className="relative pl-10"
          >
            <div className={`absolute left-3 top-3 w-3 h-3 rounded-full border-2 ${
              i === 0
                ? "bg-amber-500 border-amber-400"
                : "bg-zinc-800 border-zinc-600"
            }`} />

            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3 hover:bg-zinc-800/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t.date}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  t.type === "loan"
                    ? "bg-purple-500/10 text-purple-400"
                    : t.type === "free"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  <Banknote className="w-3 h-3 inline mr-1" />
                  {formatFee(t.fee, t.type)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">{t.fromClub ?? "—"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-white font-medium">{t.toClub ?? "—"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
