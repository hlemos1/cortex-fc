import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "@/db/queries";

/**
 * GET /api/notifications — List notifications
 *   ?unreadOnly=true → only unread
 *   ?count=true → just return unread count
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const countOnly = url.searchParams.get("count") === "true";
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    if (countOnly) {
      const count = await getUnreadNotificationCount(session!.userId);
      return NextResponse.json({ data: { unread: count } });
    }

    const notifs = await getUserNotifications(session!.userId, { unreadOnly });
    return NextResponse.json({
      data: notifs.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Erro ao buscar notificacoes" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications — Mark as read
 *   { id } → mark single
 *   { all: true } → mark all
 */
export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();

    if (body.all) {
      await markAllNotificationsRead(session!.userId);
    } else if (body.id) {
      await markNotificationRead(body.id);
    } else {
      return NextResponse.json({ error: "id or all is required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: "Erro ao atualizar notificacao" }, { status: 500 });
  }
}
