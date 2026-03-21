import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=Token+invalido", req.url)
      );
    }

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.verificationToken, token),
        gt(users.verificationTokenExpiry, new Date())
      ),
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=Token+invalido+ou+expirado", req.url)
      );
    }

    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.redirect(
      new URL("/login?verified=true", req.url)
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Erro+interno", req.url)
    );
  }
}
