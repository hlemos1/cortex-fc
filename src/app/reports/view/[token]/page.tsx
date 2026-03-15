import { verifyReportToken } from "@/app/api/reports/share/route";
import { db } from "@/db/index";
import { reports, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAnalysisById, getAnalyses } from "@/db/queries";
import { toAnalysisUI } from "@/lib/db-transforms";
import {
  Brain,
  Shield,
  User,
  Globe,
  Calendar,
  Banknote,
  MapPin,
} from "lucide-react";
import { DecisionBadge } from "@/components/cortex/DecisionBadge";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = verifyReportToken(token);

  if (!verified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Link invalido ou expirado</h1>
          <p className="text-zinc-500 text-sm">Este link de relatorio nao e mais valido.</p>
        </div>
      </div>
    );
  }

  const report = await db.query.reports.findFirst({
    where: eq(reports.id, verified.reportId),
  });

  if (!report) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Relatorio nao encontrado</h1>
        </div>
      </div>
    );
  }

  // Get org name
  const org = report.orgId
    ? await db.query.organizations.findFirst({
        where: eq(organizations.id, report.orgId),
        columns: { name: true },
      })
    : null;

  // Fetch the analyses based on report content
  const content = report.content as Record<string, unknown> | null;
  const template = content?.template as string | undefined;
  const analysisId = content?.analysisId as string | undefined;

  let analyses: ReturnType<typeof toAnalysisUI>[] = [];

  if (template === "player_report" && analysisId) {
    const a = await getAnalysisById(analysisId);
    if (a) analyses = [toAnalysisUI(a)];
  } else if (report.orgId) {
    const dbAnalyses = await getAnalyses(report.orgId, { limit: 20 });
    analyses = dbAnalyses.map(toAnalysisUI);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="w-6 h-6 text-emerald-500" />
            <span className="text-emerald-500 font-bold text-lg tracking-tight">
              {org?.name ?? "CORTEX FC"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{report.title}</h1>
          <p className="text-zinc-500 text-sm">
            {report.type === "player_report" ? "Parecer ORACLE" : report.type === "squad_analysis" ? "Analise de Elenco" : "Relatorio"}
            {" | "}
            {report.createdAt.toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Analyses */}
        <div className="space-y-6">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6"
            >
              {/* Player header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
                    <User className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{analysis.player?.name ?? "—"}</h2>
                    <p className="text-xs text-zinc-500">
                      {analysis.player?.position ?? "—"} | {analysis.player?.club ?? "—"} | {analysis.player?.age ?? "—"} anos
                    </p>
                  </div>
                </div>
                <DecisionBadge decision={analysis.decision} size="lg" />
              </div>

              {/* VxRx */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                  <p className="text-2xl font-bold font-mono text-emerald-400">{analysis.vx.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-600">Vx (Valor)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                  <p className="text-2xl font-bold font-mono text-red-400">{analysis.rx.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-600">Rx (Risco)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                  <p className="text-2xl font-bold font-mono text-cyan-400">{analysis.algorithms.SCN_plus}</p>
                  <p className="text-[10px] text-zinc-600">SCN+</p>
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-zinc-300 leading-relaxed border-t border-zinc-800 pt-4">
                {analysis.reasoning}
              </p>

              <p className="text-xs text-zinc-600 mt-3 font-mono">
                Confianca: {analysis.confidence}% | {analysis.date}
              </p>
            </div>
          ))}
        </div>

        {analyses.length === 0 && (
          <div className="text-center py-16 text-zinc-600">Nenhum dado disponivel.</div>
        )}

        <p className="text-center text-[10px] text-zinc-700 mt-10">
          {org?.name ?? "CORTEX FC"} — Analytics Futebolístico Neural
        </p>
      </div>
    </div>
  );
}
