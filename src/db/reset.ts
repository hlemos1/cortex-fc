import { db } from "./index";
import {
  scoutingComments,
  scoutingTargets,
  playerWatchlist,
  playerMatchStats,
  transfers,
  neuralAnalyses,
  sharedViews,
  reportSchedules,
  reports,
  chatMessages,
  chatConversations,
  agentRuns,
  notifications,
  auditLogs,
  transferScenarios,
  webhookEndpoints,
  apiKeys,
  orgInvites,
  userPreferences,
  players,
  matches,
  seasons,
  clubs,
  leagues,
  orgMembers,
  users,
  organizations,
} from "./schema";

async function reset() {
  console.log("Limpando banco de dados...\n");

  // Delete in reverse dependency order to avoid FK violations
  const tables = [
    { name: "scoutingComments", table: scoutingComments },
    { name: "scoutingTargets", table: scoutingTargets },
    { name: "playerWatchlist", table: playerWatchlist },
    { name: "playerMatchStats", table: playerMatchStats },
    { name: "transfers", table: transfers },
    { name: "neuralAnalyses", table: neuralAnalyses },
    { name: "sharedViews", table: sharedViews },
    { name: "reportSchedules", table: reportSchedules },
    { name: "reports", table: reports },
    { name: "chatMessages", table: chatMessages },
    { name: "chatConversations", table: chatConversations },
    { name: "agentRuns", table: agentRuns },
    { name: "notifications", table: notifications },
    { name: "auditLogs", table: auditLogs },
    { name: "transferScenarios", table: transferScenarios },
    { name: "webhookEndpoints", table: webhookEndpoints },
    { name: "apiKeys", table: apiKeys },
    { name: "orgInvites", table: orgInvites },
    { name: "userPreferences", table: userPreferences },
    { name: "players", table: players },
    { name: "matches", table: matches },
    { name: "seasons", table: seasons },
    { name: "clubs", table: clubs },
    { name: "leagues", table: leagues },
    { name: "orgMembers", table: orgMembers },
    { name: "users", table: users },
    { name: "organizations", table: organizations },
  ];

  for (const { name, table } of tables) {
    try {
      await db.delete(table);
      console.log(`  Limpo: ${name}`);
    } catch (err) {
      console.error(`  Erro ao limpar ${name}:`, err);
    }
  }

  console.log("\nBanco de dados limpo. Pronto para uso.");
}

reset()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Reset falhou:", err);
    process.exit(1);
  });
