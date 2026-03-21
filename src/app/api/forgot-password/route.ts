import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { isValidEmail } from "@/lib/validation";
import { checkRateLimit, authRateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const { success: rateLimitOk } = await checkRateLimit(
      authRateLimit,
      `reset:${ip}`
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(users.id, user.id));

    sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      console.error("Failed to send reset email:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
