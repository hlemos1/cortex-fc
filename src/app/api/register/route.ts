import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { isValidEmail, isStrongPassword } from "@/lib/validation";
import { checkRateLimit, authRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import { analyzeInput } from "@/lib/request-sanitizer";

export async function POST(req: Request) {
  try {
    // Rate limit registration attempts
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const { success: rateLimitOk } = await checkRateLimit(authRateLimit, `reg:${ip}`);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password, clubName } = body;

    // Validate required fields
    if (!name || !email || !password || !clubName) {
      return NextResponse.json(
        { error: "Todos os campos sao obrigatorios" },
        { status: 400 }
      );
    }

    // Validate name length
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Nome deve ter entre 2 e 100 caracteres" },
        { status: 400 }
      );
    }

    // Input sanitization
    const nameCheck = analyzeInput(name);
    if (!nameCheck.clean) {
      return NextResponse.json({ error: "Entrada invalida detectada no campo nome" }, { status: 400 });
    }
    const clubNameCheck = analyzeInput(clubName);
    if (!clubNameCheck.clean) {
      return NextResponse.json({ error: "Entrada invalida detectada no campo nome do clube" }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Formato de email invalido" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    // Validate club name
    if (typeof clubName !== "string" || clubName.trim().length < 2 || clubName.trim().length > 100) {
      return NextResponse.json(
        { error: "Nome do clube deve ter entre 2 e 100 caracteres" },
        { status: 400 }
      );
    }

    // Check existing user
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email ja cadastrado" },
        { status: 409 }
      );
    }

    // Create org
    const slug =
      clubName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString(36);

    const [org] = await db
      .insert(organizations)
      .values({
        name: clubName.trim(),
        slug,
        tier: "free",
      })
      .returning();

    // Create user with stronger hash
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        orgId: org.id,
        role: "admin",
      })
      .returning();

    // Generate verification token
    const crypto = await import("crypto");
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await db
      .update(users)
      .set({ verificationToken, verificationTokenExpiry })
      .where(eq(users.id, user.id));

    // Send verification email (don't fail registration if email fails)
    sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
