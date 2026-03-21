import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { isStrongPassword } from "@/lib/validation";
import { checkRateLimit, authRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const { success: rateLimitOk } = await checkRateLimit(
      authRateLimit,
      `resetpw:${ip}`
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token invalido" },
        { status: 400 }
      );
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.resetToken, token),
        gt(users.resetTokenExpiry, new Date())
      ),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token invalido ou expirado" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
