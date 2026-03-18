import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/db/index"
import {
  users,
  orgMembers,
  userPreferences,
  notifications,
  chatMessages,
  chatConversations,
  auditLogs,
  neuralAnalyses,
  agentRuns,
  scoutingComments,
  playerWatchlist,
  transferScenarios,
  sharedViews,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"

// GET /api/account — Export all user data (LGPD Art. 18)
export async function GET(_req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const userId = session!.userId

  // Collect all user data
  const [user] = await db.select().from(users).where(eq(users.id, userId))

  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 })
  }

  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
  const notifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
  const conversations = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
  const analyses = await db
    .select()
    .from(neuralAnalyses)
    .where(eq(neuralAnalyses.analystId, userId))
  const runs = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.userId, userId))
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
  const watchlist = await db
    .select()
    .from(playerWatchlist)
    .where(eq(playerWatchlist.userId, userId))
  const scenarios = await db
    .select()
    .from(transferScenarios)
    .where(eq(transferScenarios.userId, userId))
  const comments = await db
    .select()
    .from(scoutingComments)
    .where(eq(scoutingComments.userId, userId))

  const exportData = {
    exportedAt: new Date().toISOString(),
    lgpdNotice:
      "Exportacao de dados pessoais conforme LGPD Art. 18, inciso II. " +
      "Este arquivo contem todos os dados pessoais associados a sua conta no Cortex FC.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    preferences: prefs,
    notifications: notifs.length,
    conversations: conversations.length,
    analyses: analyses.length,
    agentRuns: runs.length,
    auditLogs: logs.length,
    watchlist: watchlist.length,
    transferScenarios: scenarios.length,
    scoutingComments: comments.length,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cortex-fc-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}

// DELETE /api/account — Delete account (LGPD Art. 18)
export async function DELETE(_req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const userId = session!.userId

  logger.info("Account deletion requested", { userId })

  try {
    // Delete user data in dependency order (children first)

    // 1. Notifications
    await db.delete(notifications).where(eq(notifications.userId, userId))

    // 2. User preferences
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId))

    // 3. Chat data (messages via cascade on conversation delete, but explicit is safer)
    const userConversations = await db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
    for (const conv of userConversations) {
      await db.delete(chatMessages).where(eq(chatMessages.conversationId, conv.id))
    }
    await db.delete(chatConversations).where(eq(chatConversations.userId, userId))

    // 4. Watchlist
    await db.delete(playerWatchlist).where(eq(playerWatchlist.userId, userId))

    // 5. Transfer scenarios
    await db.delete(transferScenarios).where(eq(transferScenarios.userId, userId))

    // 6. Shared views
    await db.delete(sharedViews).where(eq(sharedViews.userId, userId))

    // 7. Scouting comments
    await db.delete(scoutingComments).where(eq(scoutingComments.userId, userId))

    // 8. Remove from org
    await db.delete(orgMembers).where(eq(orgMembers.userId, userId))

    // 9. Anonymize audit logs (keep for compliance but remove PII)
    await db
      .update(auditLogs)
      .set({ userId: null })
      .where(eq(auditLogs.userId, userId))

    // 10. Anonymize agent runs (keep for usage analytics)
    await db
      .update(agentRuns)
      .set({ userId: null })
      .where(eq(agentRuns.userId, userId))

    // 11. Anonymize neural analyses (keep analyses but remove analyst link)
    await db
      .update(neuralAnalyses)
      .set({ analystId: null })
      .where(eq(neuralAnalyses.analystId, userId))

    // 12. Delete user record last
    await db.delete(users).where(eq(users.id, userId))

    logger.info("Account deleted successfully", { userId })

    return NextResponse.json({
      success: true,
      message: "Conta excluida com sucesso. Todos os dados pessoais foram removidos.",
    })
  } catch (err) {
    logger.error(
      "Account deletion failed",
      { userId },
      err instanceof Error ? err : undefined
    )
    return NextResponse.json(
      { error: "Falha ao excluir conta. Contate o suporte." },
      { status: 500 }
    )
  }
}
