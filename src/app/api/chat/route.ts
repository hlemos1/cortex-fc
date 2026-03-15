import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  createConversation,
  getConversations,
  getConversationMessages,
  addChatMessage,
  updateConversationTitle,
  deleteConversation,
} from "@/db/queries";

/**
 * GET /api/chat — List conversations or get messages
 *   ?conversationId=uuid → messages for that conversation
 *   (no params) → list conversations
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    if (conversationId) {
      const messages = await getConversationMessages(conversationId, session!.userId);
      return NextResponse.json({
        data: messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
      });
    }

    const conversations = await getConversations(session!.orgId, session!.userId);
    return NextResponse.json({
      data: conversations.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Erro no chat" }, { status: 500 });
  }
}

/**
 * POST /api/chat — Send a message or create conversation
 *   { action: "create" } → new conversation
 *   { conversationId, message } → send message + get AI response
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { isTierAtLeast } = await import("@/lib/feature-gates");
    if (!isTierAtLeast(session!.tier, "scout_individual")) {
      return NextResponse.json(
        { error: "Chat IA requer tier Scout ou superior" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Create new conversation
    if (body.action === "create") {
      const conv = await createConversation({
        orgId: session!.orgId,
        userId: session!.userId,
        title: body.title,
      });
      return NextResponse.json({
        data: { ...conv, createdAt: conv.createdAt.toISOString(), updatedAt: conv.updatedAt.toISOString() },
      });
    }

    // Send message
    const { conversationId, message } = body;
    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Save user message
    await addChatMessage({
      conversationId,
      role: "user",
      content: message,
    });

    // Get conversation history (with ownership check)
    const history = await getConversationMessages(conversationId, session!.userId);

    // Build RAG context
    const { buildRagContext, buildChatSystemPrompt } = await import(
      "@/lib/rag-context"
    );
    const rag = await buildRagContext(session!.orgId);
    const systemPrompt = buildChatSystemPrompt(rag);

    // Call Claude
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const aiContent = textBlock && "text" in textBlock ? textBlock.text : "";
    const tokensUsed =
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    // Save assistant message
    const aiMessage = await addChatMessage({
      conversationId,
      role: "assistant",
      content: aiContent,
      tokensUsed,
    });

    // Auto-title on first message
    if (history.length <= 1) {
      const title =
        message.length > 50 ? message.slice(0, 47) + "..." : message;
      await updateConversationTitle(conversationId, title);
    }

    return NextResponse.json({
      data: {
        ...aiMessage,
        createdAt: aiMessage.createdAt.toISOString(),
      },
      tokensUsed,
    });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 });
  }
}

/**
 * DELETE /api/chat?conversationId=uuid — Delete a conversation
 */
export async function DELETE(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    await deleteConversation(conversationId, session!.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat DELETE error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar conversa" },
      { status: 500 }
    );
  }
}
