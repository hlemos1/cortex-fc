import { db } from "@/db";
import {
  eq,
  desc,
  and,
} from "drizzle-orm";
import {
  chatConversations,
  chatMessages,
} from "@/db/schema";

// ============================================
// CHAT IA
// ============================================

export async function createConversation(data: {
  orgId: string;
  userId: string;
  title?: string;
}) {
  const [inserted] = await db
    .insert(chatConversations)
    .values({
      orgId: data.orgId,
      userId: data.userId,
      title: data.title ?? "Nova conversa",
    })
    .returning();
  return inserted;
}

export async function getConversations(orgId: string, userId: string) {
  return db.query.chatConversations.findMany({
    where: and(
      eq(chatConversations.orgId, orgId),
      eq(chatConversations.userId, userId)
    ),
    orderBy: [desc(chatConversations.updatedAt)],
    limit: 50,
  });
}

export async function getConversationMessages(conversationId: string, userId?: string) {
  // Verify ownership if userId provided
  if (userId) {
    const conv = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, conversationId),
      columns: { userId: true },
    });
    if (!conv || conv.userId !== userId) return [];
  }

  return db.query.chatMessages.findMany({
    where: eq(chatMessages.conversationId, conversationId),
    orderBy: [chatMessages.createdAt],
  });
}

export async function addChatMessage(data: {
  conversationId: string;
  role: string;
  content: string;
  tokensUsed?: number;
}) {
  const [inserted] = await db
    .insert(chatMessages)
    .values({
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      tokensUsed: data.tokensUsed ?? null,
    })
    .returning();

  // Update conversation timestamp
  await db
    .update(chatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(chatConversations.id, data.conversationId));

  return inserted;
}

export async function updateConversationTitle(id: string, title: string) {
  await db
    .update(chatConversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatConversations.id, id));
}

export async function deleteConversation(id: string, userId: string) {
  await db.delete(chatConversations).where(
    and(eq(chatConversations.id, id), eq(chatConversations.userId, userId))
  );
}
