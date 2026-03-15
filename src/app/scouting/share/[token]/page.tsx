import { verifyShareToken } from "@/app/api/scouting/share/route";
import { db } from "@/db/index";
import { scoutingTargets, players, clubs, neuralAnalyses } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { User, MapPin, Calendar, Banknote, Shield, Brain } from "lucide-react";
import { DecisionBadge } from "@/components/cortex/DecisionBadge";
import type { CortexDecision } from "@/types/cortex";

export default async function SharedShortlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = verifyShareToken(token);

  if (!verified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Link invalido ou expirado</h1>
          <p className="text-zinc-500 text-sm">Este link de shortlist nao e mais valido.</p>
        </div>
      </div>
    );
  }

  const { orgId, targetIds } = verified;

  // Fetch targets with player data
  const targets = await db
    .select({
      id: scoutingTargets.id,
      priority: scoutingTargets.priority,
      status: scoutingTargets.status,
      notes: scoutingTargets.notes,
      targetPrice: scoutingTargets.targetPrice,
      playerId: players.id,
      playerName: players.name,
      playerAge: players.age,
      playerNationality: players.nationality,
      playerPosition: players.positionDetail,
      playerCluster: players.positionCluster,
      playerMarketValue: players.marketValue,
      clubName: clubs.name,
    })
    .from(scoutingTargets)
    .innerJoin(players, eq(scoutingTargets.playerId, players.id))
    .leftJoin(clubs, eq(players.currentClubId, clubs.id))
    .where(
      and(
        eq(scoutingTargets.orgId, orgId),
        inArray(scoutingTargets.id, targetIds)
      )
    );

  // Fetch analyses
  const analysisMap = new Map<string, { vx: number; rx: number; scnPlus: number | null; decision: string }>();
  for (const t of targets) {
    const a = await db.query.neuralAnalyses.findFirst({
      where: eq(neuralAnalyses.playerId, t.playerId),
      orderBy: [desc(neuralAnalyses.createdAt)],
      columns: { vx: true, rx: true, scnPlus: true, decision: true },
    });
    if (a) analysisMap.set(t.playerId, a);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="w-6 h-6 text-emerald-500" />
            <span className="text-emerald-500 font-bold text-lg tracking-tight">CORTEX FC</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Shortlist Compartilhada</h1>
          <p className="text-zinc-500 text-sm">{targets.length} jogadores selecionados</p>
        </div>

        {/* Player Cards */}
        <div className="space-y-4">
          {targets.map((t) => {
            const analysis = analysisMap.get(t.playerId);
            return (
              <div
                key={t.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700/50">
                    <User className="w-6 h-6 text-zinc-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">{t.playerName}</h2>
                      {analysis && (
                        <DecisionBadge decision={analysis.decision as CortexDecision} size="sm" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <MapPin className="w-3 h-3" />
                        {t.playerPosition ?? t.playerCluster} — {t.clubName ?? "Sem clube"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {t.playerAge} anos
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <Banknote className="w-3 h-3 text-emerald-500" />
                        <span className="font-mono">&euro;{t.playerMarketValue ?? 0}M</span>
                      </span>
                      <span className="text-xs text-zinc-500">{t.playerNationality}</span>
                    </div>

                    {analysis && (
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                          Vx {analysis.vx.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono text-red-400 px-2 py-0.5 rounded bg-red-500/10">
                          Rx {analysis.rx.toFixed(2)}
                        </span>
                        {analysis.scnPlus && (
                          <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                            SCN+ {analysis.scnPlus}
                          </span>
                        )}
                      </div>
                    )}

                    {t.notes && (
                      <p className="text-xs text-zinc-500 mt-3 italic border-l-2 border-zinc-700 pl-3">
                        {t.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        t.priority === "high"
                          ? "bg-red-500/10 text-red-400"
                          : t.priority === "medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        {t.priority === "high" ? "Alta" : t.priority === "medium" ? "Media" : "Baixa"} prioridade
                      </span>
                      {t.targetPrice && (
                        <span className="text-[10px] text-zinc-600 font-mono">
                          Preco alvo: &euro;{t.targetPrice}M
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {targets.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            Nenhum jogador encontrado nesta shortlist.
          </div>
        )}

        <p className="text-center text-[10px] text-zinc-700 mt-10">
          Gerado por CORTEX FC — Analytics Futebolístico Neural
        </p>
      </div>
    </div>
  );
}
