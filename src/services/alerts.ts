import { db } from "@/db/index";
import { players, clubs, scoutingTargets, organizations } from "@/db/schema";
import { eq, lt, sql, desc } from "drizzle-orm";

export type AlertType = "contract_expiring" | "value_change" | "injury" | "transfer_rumor";
export type AlertSeverity = "high" | "medium" | "low";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  playerId: string;
  playerName: string;
  clubName: string | null;
  createdAt: Date;
}

/**
 * Generate market alerts for an organization's scouting targets.
 * Checks: contract expiration, market value changes.
 */
export async function generateAlerts(orgId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // 1. Contract expiring within 6 months
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const expiringContracts = await db
    .select({
      targetId: scoutingTargets.id,
      playerId: players.id,
      playerName: players.name,
      contractUntil: players.contractUntil,
      clubName: clubs.name,
      marketValue: players.marketValue,
    })
    .from(scoutingTargets)
    .innerJoin(players, eq(scoutingTargets.playerId, players.id))
    .leftJoin(clubs, eq(players.currentClubId, clubs.id))
    .where(
      sql`${scoutingTargets.orgId} = ${orgId}
        AND ${scoutingTargets.status} NOT IN ('closed', 'passed')
        AND ${players.contractUntil} IS NOT NULL
        AND ${players.contractUntil} < ${sixMonthsFromNow}`
    )
    .orderBy(players.contractUntil);

  for (const row of expiringContracts) {
    const monthsLeft = row.contractUntil
      ? Math.max(0, Math.round((row.contractUntil.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
      : 0;

    alerts.push({
      id: `contract-${row.targetId}`,
      type: "contract_expiring",
      severity: monthsLeft <= 3 ? "high" : "medium",
      title: `Contrato expirando: ${row.playerName}`,
      description: `${monthsLeft} meses restantes de contrato${row.clubName ? ` com ${row.clubName}` : ""}. Valor atual: €${row.marketValue ?? 0}M.`,
      playerId: row.playerId,
      playerName: row.playerName,
      clubName: row.clubName,
      createdAt: new Date(),
    });
  }

  // 2. High-value targets without analysis
  const unanalyzedHighPriority = await db
    .select({
      targetId: scoutingTargets.id,
      playerId: players.id,
      playerName: players.name,
      clubName: clubs.name,
      priority: scoutingTargets.priority,
    })
    .from(scoutingTargets)
    .innerJoin(players, eq(scoutingTargets.playerId, players.id))
    .leftJoin(clubs, eq(players.currentClubId, clubs.id))
    .where(
      sql`${scoutingTargets.orgId} = ${orgId}
        AND ${scoutingTargets.priority} = 'high'
        AND ${scoutingTargets.status} = 'watching'
        AND ${scoutingTargets.analysisId} IS NULL`
    );

  for (const row of unanalyzedHighPriority) {
    alerts.push({
      id: `unanalyzed-${row.targetId}`,
      type: "transfer_rumor",
      severity: "medium",
      title: `Alvo prioritario sem analise: ${row.playerName}`,
      description: `${row.playerName}${row.clubName ? ` (${row.clubName})` : ""} esta marcado como prioridade alta mas ainda nao possui analise neural.`,
      playerId: row.playerId,
      playerName: row.playerName,
      clubName: row.clubName,
      createdAt: new Date(),
    });
  }

  // Sort by severity
  const severityOrder: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Get alerts for the API endpoint.
 */
export async function getAlertsForOrg(orgId: string) {
  return generateAlerts(orgId);
}
