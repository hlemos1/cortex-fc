import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/auth/check-verification
 *
 * Checks if an email exists and whether it's verified.
 * Used by the login page to show the correct error message
 * after a failed credentials login.
 *
 * Returns generic response for non-existent emails (no enumeration).
 */
export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
    columns: { emailVerified: true, verificationToken: true },
  });

  if (!user) {
    // Don't reveal if email exists — return same as bad credentials
    return NextResponse.json({ status: "credentials" });
  }

  if (user.verificationToken && !user.emailVerified) {
    return NextResponse.json({ status: "unverified" });
  }

  return NextResponse.json({ status: "credentials" });
}
