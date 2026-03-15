import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Extract authenticated session with orgId and tier from request.
 * Returns the session or null.
 */
export async function getAuthSession() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.orgId) {
    return null;
  }

  // Fetch org tier from DB
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.user.orgId),
    columns: { tier: true },
  });

  return {
    userId: session.user.id,
    orgId: session.user.orgId,
    role: session.user.role as "admin" | "analyst" | "viewer",
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    tier: org?.tier ?? "free",
  };
}

/**
 * Middleware-style helper for API routes.
 * Returns session or sends 401 response.
 */
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}
