import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { organizations, users, reports } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getAnalyses } from "@/db/queries";
import { toAnalysisUI } from "@/lib/db-transforms";
import { generateWeeklyNewsletterPDF } from "@/lib/pdf-generator";
import { sendWeeklyReportEmail } from "@/lib/email";

/**
 * Cron job: Generate and send weekly report emails.
 * Runs every Monday at 09:00 UTC.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all orgs with paid plans (they get weekly reports)
    const orgs = await db.query.organizations.findMany({
      where: inArray(organizations.tier, [
        "club_professional",
        "holding_multiclub",
      ]),
    });

    let sent = 0;
    let errors = 0;

    for (const org of orgs) {
      try {
        // Get recent analyses for this org
        const analyses = await getAnalyses(org.id, { limit: 10 });
        if (analyses.length === 0) continue;

        const uiAnalyses = analyses.map(toAnalysisUI);

        // Generate PDF
        const pdfBuffer = await generateWeeklyNewsletterPDF(uiAnalyses, org.name);

        // Get admin users for this org
        const admins = await db.query.users.findMany({
          where: and(
            eq(users.orgId, org.id),
            eq(users.role, "admin")
          ),
          columns: { email: true, name: true },
        });

        // Save report record
        const [report] = await db
          .insert(reports)
          .values({
            title: `Newsletter Semanal — ${new Date().toLocaleDateString("pt-BR")}`,
            type: "weekly_newsletter",
            orgId: org.id,
            content: { template: "weekly_newsletter", analysisCount: analyses.length },
            isPublished: true,
            publishedAt: new Date(),
          })
          .returning();

        // Send to all admins
        for (const admin of admins) {
          try {
            await sendWeeklyReportEmail(admin.email, admin.name, org.name, pdfBuffer);
            sent++;
          } catch (emailErr) {
            console.error(`Failed to send weekly report to ${admin.email}:`, emailErr);
            errors++;
          }
        }
      } catch (orgErr) {
        console.error(`Failed to generate weekly report for org ${org.id}:`, orgErr);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      orgs: orgs.length,
      sent,
      errors,
    });
  } catch (error) {
    console.error("Weekly report cron failed:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
