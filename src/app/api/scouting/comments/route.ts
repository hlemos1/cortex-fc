import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidUUID } from "@/lib/validation";
import {
  getScoutingComments,
  createScoutingComment,
  deleteScoutingComment,
} from "@/db/queries";
import { notifyMentions } from "@/lib/notifications";
import { analyzeInput } from "@/lib/request-sanitizer";
import { parseBody, scoutingCommentSchema } from "@/lib/api-schemas";

// GET — list comments for a scouting target
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const targetId = request.nextUrl.searchParams.get("targetId");
    if (!targetId || !isValidUUID(targetId)) {
      return NextResponse.json({ error: "targetId invalido" }, { status: 400 });
    }

    const comments = await getScoutingComments(targetId, session!.orgId);
    return NextResponse.json({ data: comments });
  } catch (err) {
    console.error("Failed to fetch scouting comments:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST — create a comment on a scouting target
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { data: body, error: parseError } = await parseBody(request, scoutingCommentSchema);
    if (parseError) return parseError;
    const { targetId, content } = body;

    const contentCheck = analyzeInput(content);
    if (!contentCheck.clean) {
      return NextResponse.json({ error: "Entrada invalida detectada" }, { status: 400 });
    }

    const comment = await createScoutingComment({
      targetId,
      userId: session!.userId,
      orgId: session!.orgId,
      content: content.trim(),
    });

    // Notify @mentioned users (fire-and-forget)
    notifyMentions({
      text: content.trim(),
      orgId: session!.orgId,
      fromUserName: session!.name || session!.email,
      entityType: "scouting_target",
      entityId: targetId,
    }).catch((err) => console.error("Failed to notify mentions:", err));

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (err) {
    console.error("Failed to create scouting comment:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE — delete a comment (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const id = request.nextUrl.searchParams.get("id");
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: "id invalido" }, { status: 400 });
    }

    const result = await deleteScoutingComment(id, session!.userId);
    if (!result) {
      return NextResponse.json({ error: "Comentario nao encontrado ou sem permissao" }, { status: 404 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("Failed to delete scouting comment:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
