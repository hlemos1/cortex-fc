import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { AnalysisUI } from "@/lib/db-transforms";

// ============================================
// Shared styles
// ============================================

const colors = {
  bg: "#09090b",
  card: "#18181b",
  border: "#27272a",
  text: "#d4d4d8",
  textMuted: "#71717a",
  textDim: "#52525b",
  emerald: "#10b981",
  red: "#ef4444",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  white: "#fafafa",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    padding: 40,
    fontFamily: "Helvetica",
    color: colors.text,
    fontSize: 9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.emerald,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cols2: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  bigNumber: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  smallLabel: {
    fontSize: 7,
    color: colors.textDim,
    marginTop: 1,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#27272a",
    marginTop: 2,
    marginBottom: 2,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: colors.textDim,
  },
});

// ============================================
// Decision color helper
// ============================================

function decisionStyle(decision: string) {
  switch (decision) {
    case "CONTRATAR": return { bg: "#064e3b", text: "#6ee7b7" };
    case "BLINDAR": return { bg: "#1e3a5f", text: "#93c5fd" };
    case "MONITORAR": return { bg: "#78350f", text: "#fcd34d" };
    case "EMPRESTIMO": return { bg: "#581c87", text: "#d8b4fe" };
    case "RECUSAR": return { bg: "#7f1d1d", text: "#fca5a5" };
    case "ALERTA_CINZA": return { bg: "#27272a", text: "#a1a1aa" };
    default: return { bg: "#27272a", text: "#a1a1aa" };
  }
}

// ============================================
// Template: Player Report
// ============================================

function PlayerReportPDF({
  analysis,
  orgName,
}: {
  analysis: AnalysisUI;
  orgName?: string;
}) {
  const ds = decisionStyle(analysis.decision);

  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: s.page },

      // Header
      React.createElement(View, { style: s.header },
        React.createElement(View, {},
          React.createElement(Text, { style: s.title }, orgName ?? "CORTEX FC"),
          React.createElement(Text, { style: s.subtitle }, "Parecer ORACLE — Relatorio Neural de Jogador"),
        ),
        React.createElement(Text, { style: { fontSize: 8, color: colors.textDim } },
          `Relatorio #${analysis.id.slice(0, 8).toUpperCase()} | ${analysis.date}`
        ),
      ),

      // Player Info Card
      React.createElement(View, { style: s.card },
        React.createElement(View, { style: s.cols2 },
          React.createElement(View, { style: s.col },
            React.createElement(Text, { style: { fontSize: 16, fontFamily: "Helvetica-Bold", color: colors.white, marginBottom: 4 } },
              analysis.player?.name ?? "—"
            ),
            React.createElement(Text, { style: { fontSize: 9, color: colors.textMuted } },
              `${analysis.player?.position ?? "—"} | ${analysis.player?.nationality ?? "—"} | ${analysis.player?.age ?? "—"} anos`
            ),
            React.createElement(Text, { style: { fontSize: 9, color: colors.textMuted, marginTop: 2 } },
              `Clube: ${analysis.player?.club ?? "—"} | Valor: €${analysis.player?.marketValue ?? 0}M | Contrato: ${analysis.player?.contractEnd ?? "—"}`
            ),
          ),
          React.createElement(View, { style: { alignItems: "flex-end" } },
            React.createElement(View, { style: { ...s.badge, backgroundColor: ds.bg } },
              React.createElement(Text, { style: { color: ds.text, fontSize: 10 } }, analysis.decision)
            ),
            React.createElement(Text, { style: { fontSize: 8, color: colors.textDim, marginTop: 4 } },
              `Confianca: ${analysis.confidence}%`
            ),
          ),
        ),
      ),

      // VxRx Score
      React.createElement(View, { style: { ...s.card, ...s.cols2 } },
        React.createElement(View, { style: { flex: 1, alignItems: "center" } },
          React.createElement(Text, { style: { ...s.bigNumber, color: colors.emerald } }, analysis.vx.toFixed(2)),
          React.createElement(Text, { style: s.smallLabel }, "Vx (Valor)"),
        ),
        React.createElement(View, { style: { flex: 1, alignItems: "center" } },
          React.createElement(Text, { style: { ...s.bigNumber, color: colors.red } }, analysis.rx.toFixed(2)),
          React.createElement(Text, { style: s.smallLabel }, "Rx (Risco)"),
        ),
        React.createElement(View, { style: { flex: 1, alignItems: "center" } },
          React.createElement(Text, { style: { ...s.bigNumber, color: colors.cyan } }, String(analysis.algorithms.SCN_plus)),
          React.createElement(Text, { style: s.smallLabel }, "SCN+"),
        ),
      ),

      // Vx + Rx Components side by side
      React.createElement(View, { style: s.cols2 },
        React.createElement(View, { style: { ...s.card, flex: 1 } },
          React.createElement(Text, { style: s.cardTitle }, "Componentes Vx"),
          ...[
            { label: "Tecnico", value: analysis.vxComponents.technical },
            { label: "Impacto Mercado", value: analysis.vxComponents.marketImpact },
            { label: "Adaptacao Cultural", value: analysis.vxComponents.culturalAdaptation },
            { label: "Networking", value: analysis.vxComponents.networkingBenefit },
            { label: "Depreciacao Idade", value: analysis.vxComponents.ageDepreciation },
            { label: "Passivos", value: analysis.vxComponents.liabilities },
            { label: "Risco Regulatorio", value: analysis.vxComponents.regulatoryRisk },
          ].map((c) =>
            React.createElement(View, { key: c.label, style: s.row },
              React.createElement(Text, { style: { fontSize: 8, color: colors.textMuted } }, c.label),
              React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.emerald } }, String(c.value)),
            )
          ),
        ),
        React.createElement(View, { style: { ...s.card, flex: 1 } },
          React.createElement(Text, { style: s.cardTitle }, "Componentes Rx"),
          ...[
            { label: "Gap Tatico", value: analysis.rxComponents.tacticalGap },
            { label: "Fit Contextual", value: analysis.rxComponents.contextualFit },
            { label: "Experiencia", value: analysis.rxComponents.experienceProfile },
            { label: "Indice Narrativo", value: analysis.rxComponents.narrativeIndex },
            { label: "Fortaleza Mental", value: analysis.rxComponents.mentalFortitude },
            { label: "Risco Lesao", value: analysis.rxComponents.injuryMicroRisk },
            { label: "Risco Suspensao", value: analysis.rxComponents.suspensionRisk },
          ].map((c) =>
            React.createElement(View, { key: c.label, style: s.row },
              React.createElement(Text, { style: { fontSize: 8, color: colors.textMuted } }, c.label),
              React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.red } }, String(c.value)),
            )
          ),
        ),
      ),

      // Algorithm Scores
      React.createElement(View, { style: s.card },
        React.createElement(Text, { style: s.cardTitle }, "Algoritmos Proprietarios"),
        ...[
          { label: "AST — Sinergia Tatica", value: analysis.algorithms.AST },
          { label: "CLF — Compat. Linguistica", value: analysis.algorithms.CLF },
          { label: "GNE — Necessidade Estrategica", value: analysis.algorithms.GNE },
          { label: "WSE — Embedding Sistemico", value: analysis.algorithms.WSE },
          { label: "RBL — Risk-Benefit Loop", value: analysis.algorithms.RBL },
          { label: "SACE — Adaptacao Cultural", value: analysis.algorithms.SACE },
          { label: "SCN+ — Score Cortex Neural", value: analysis.algorithms.SCN_plus },
        ].map((a) =>
          React.createElement(View, { key: a.label, style: { ...s.row, marginBottom: 6 } },
            React.createElement(Text, { style: { fontSize: 8, color: colors.textMuted, flex: 1 } }, a.label),
            React.createElement(View, { style: { flex: 1.5, flexDirection: "row", alignItems: "center", gap: 6 } },
              React.createElement(View, { style: { ...s.bar, flex: 1 } },
                React.createElement(View, {
                  style: {
                    ...s.barFill,
                    width: `${a.value}%`,
                    backgroundColor: a.value >= 70 ? colors.emerald : a.value >= 40 ? colors.amber : colors.red,
                  },
                }),
              ),
              React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.white, width: 20, textAlign: "right" } }, String(a.value)),
            ),
          )
        ),
      ),

      // Reasoning
      React.createElement(View, { style: s.card },
        React.createElement(Text, { style: s.cardTitle }, "Parecer ORACLE"),
        React.createElement(Text, { style: { fontSize: 9, color: colors.text, lineHeight: 1.5 } }, analysis.reasoning),
      ),

      // Footer
      React.createElement(View, { style: s.footer },
        React.createElement(Text, {}, `${orgName ?? "CORTEX FC"} — Analytics Futebolístico Neural`),
        React.createElement(Text, {}, `Gerado em ${new Date().toLocaleDateString("pt-BR")}`),
      ),
    ),
  );
}

// ============================================
// Template: Squad Analysis (multi-player summary)
// ============================================

function SquadAnalysisPDF({
  analyses,
  orgName,
  title,
}: {
  analyses: AnalysisUI[];
  orgName?: string;
  title?: string;
}) {
  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: s.page },

      React.createElement(View, { style: s.header },
        React.createElement(View, {},
          React.createElement(Text, { style: s.title }, orgName ?? "CORTEX FC"),
          React.createElement(Text, { style: s.subtitle }, title ?? "Analise de Elenco"),
        ),
        React.createElement(Text, { style: { fontSize: 8, color: colors.textDim } },
          `${analyses.length} jogadores | ${new Date().toLocaleDateString("pt-BR")}`
        ),
      ),

      // Summary table
      React.createElement(View, { style: s.card },
        React.createElement(Text, { style: s.cardTitle }, "Resumo do Elenco"),

        // Table header
        React.createElement(View, { style: { ...s.row, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4, marginBottom: 6 } },
          React.createElement(Text, { style: { flex: 2, fontSize: 7, color: colors.textDim, fontFamily: "Helvetica-Bold" } }, "JOGADOR"),
          React.createElement(Text, { style: { flex: 1, fontSize: 7, color: colors.textDim, fontFamily: "Helvetica-Bold", textAlign: "center" } }, "POS"),
          React.createElement(Text, { style: { flex: 1, fontSize: 7, color: colors.textDim, fontFamily: "Helvetica-Bold", textAlign: "center" } }, "Vx"),
          React.createElement(Text, { style: { flex: 1, fontSize: 7, color: colors.textDim, fontFamily: "Helvetica-Bold", textAlign: "center" } }, "Rx"),
          React.createElement(Text, { style: { flex: 1, fontSize: 7, color: colors.textDim, fontFamily: "Helvetica-Bold", textAlign: "center" } }, "SCN+"),
          React.createElement(Text, { style: { flex: 1.2, fontSize: 7, color: colors.textDim, fontFamily: "Helvetica-Bold", textAlign: "center" } }, "DECISAO"),
        ),

        // Rows
        ...analyses.map((a) => {
          const ds = decisionStyle(a.decision);
          return React.createElement(View, { key: a.id, style: { ...s.row, paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: colors.border } },
            React.createElement(Text, { style: { flex: 2, fontSize: 8, color: colors.white } }, a.player?.name ?? "—"),
            React.createElement(Text, { style: { flex: 1, fontSize: 8, color: colors.textMuted, textAlign: "center" } }, a.player?.positionCluster ?? "—"),
            React.createElement(Text, { style: { flex: 1, fontSize: 8, color: colors.emerald, textAlign: "center", fontFamily: "Helvetica-Bold" } }, a.vx.toFixed(2)),
            React.createElement(Text, { style: { flex: 1, fontSize: 8, color: colors.red, textAlign: "center", fontFamily: "Helvetica-Bold" } }, a.rx.toFixed(2)),
            React.createElement(Text, { style: { flex: 1, fontSize: 8, color: colors.cyan, textAlign: "center", fontFamily: "Helvetica-Bold" } }, String(a.algorithms.SCN_plus)),
            React.createElement(View, { style: { flex: 1.2, alignItems: "center" } },
              React.createElement(View, { style: { ...s.badge, backgroundColor: ds.bg, paddingHorizontal: 4, paddingVertical: 2 } },
                React.createElement(Text, { style: { color: ds.text, fontSize: 6 } }, a.decision),
              ),
            ),
          );
        }),
      ),

      React.createElement(View, { style: s.footer },
        React.createElement(Text, {}, `${orgName ?? "CORTEX FC"} — Analytics Futebolístico Neural`),
        React.createElement(Text, {}, `Gerado em ${new Date().toLocaleDateString("pt-BR")}`),
      ),
    ),
  );
}

// ============================================
// Public API: Generate PDF buffers
// ============================================

export type ReportTemplate = "player_report" | "squad_analysis" | "scouting_report" | "weekly_newsletter";

export async function generatePlayerReportPDF(
  analysis: AnalysisUI,
  orgName?: string
): Promise<Buffer> {
  const doc = PlayerReportPDF({ analysis, orgName });
  return renderToBuffer(// eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc as any);
}

export async function generateSquadAnalysisPDF(
  analyses: AnalysisUI[],
  orgName?: string,
  title?: string
): Promise<Buffer> {
  const doc = SquadAnalysisPDF({ analyses, orgName, title });
  return renderToBuffer(// eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc as any);
}

export async function generateScoutingReportPDF(
  analyses: AnalysisUI[],
  orgName?: string
): Promise<Buffer> {
  const doc = SquadAnalysisPDF({
    analyses,
    orgName,
    title: "Relatorio de Scouting — Alvos de Mercado",
  });
  return renderToBuffer(// eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc as any);
}

export async function generateWeeklyNewsletterPDF(
  analyses: AnalysisUI[],
  orgName?: string
): Promise<Buffer> {
  const doc = SquadAnalysisPDF({
    analyses,
    orgName,
    title: "Newsletter Semanal — Resumo de Analises",
  });
  return renderToBuffer(// eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc as any);
}
