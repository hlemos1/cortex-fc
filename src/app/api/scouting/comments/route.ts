import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidUUID } from "@/lib/validation";
import {
  getScoutingComments,
  createScoutingComment,
  deleteScoutingComment,
} from "@/db/queries";

// GET — list comments for a scouting target
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const targetId = request.nextUrl.searchParams.get("targetId");
    if (!targetId || !isValidUUID(targetId)) {
      return NextResponse.json({ error: "targetId invalido" }, { status: 400 });
    }

    const comments = await getScoutingComments(targetId);
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

    const body = await request.json();
    const { targetId, content } = body;

    if (!targetId || !isValidUUID(targetId)) {
      return NextResponse.json({ error: "targetId invalido" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "content obrigatorio" }, { status: 400 });
    }

    const comment = await createScoutingComment({
      targetId,
      userId: session!.userId,
      orgId: session!.orgId,
      content: content.trim(),
    });

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
