import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db/index";
import { organizations, orgInvites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { orgName, orgType, inviteEmails } = body as {
      orgName: string;
      orgType: string;
      inviteEmails?: string[];
    };

    if (!orgName?.trim()) {
      return NextResponse.json(
        { error: "Nome da organizacao e obrigatorio" },
        { status: 400 }
      );
    }

    // Update organization name, type (stored in name field), and mark onboarding complete
    await db
      .update(organizations)
      .set({
        name: orgName.trim(),
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, session.orgId));

    // Create invites if emails provided
    if (inviteEmails && inviteEmails.length > 0) {
      const validEmails = inviteEmails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

      if (validEmails.length > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const inviteValues = validEmails.map((email) => ({
          email,
          orgId: session.orgId,
          role: "analyst" as const,
          token: randomUUID(),
          invitedBy: session.userId,
          expiresAt,
        }));

        await db.insert(orgInvites).values(inviteValues);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding failed:", error);
    return NextResponse.json(
      { error: "Falha ao completar onboarding" },
      { status: 500 }
    );
  }
}
