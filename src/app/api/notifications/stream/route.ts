import { NextRequest } from "next/server"
import { getAuthSession } from "@/lib/auth-helpers"
import { db } from "@/db/index"
import { notifications } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const userId = session.userId
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(": heartbeat\n\n"))

      let lastCheck = new Date()

      // Poll database every 5 seconds for new notifications
      const interval = setInterval(async () => {
        try {
          const newNotifs = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, userId),
                sql`${notifications.createdAt} > ${lastCheck}`
              )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(20)

          if (newNotifs.length > 0) {
            lastCheck = new Date()
            const payload = newNotifs.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              entityType: n.entityType,
              entityId: n.entityId,
              readAt: n.readAt?.toISOString() ?? null,
              createdAt: n.createdAt.toISOString(),
            }))
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            )
          }
        } catch {
          // Silently handle errors to keep the stream alive
        }
      }, 5000)

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          clearInterval(interval)
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        clearInterval(heartbeat)
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
