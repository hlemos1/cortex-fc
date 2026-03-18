/**
 * Trial reminder cron job.
 *
 * Runs daily at 9am UTC.
 * Checks for orgs in trial period and sends reminders at day 7 and day 12.
 */

import { inngest } from "@/lib/inngest-client";
import { db } from "@/db/index";
import { organizations, users } from "@/db/schema";
import { eq, and, isNotNull, gte } from "drizzle-orm";
import { sendTrialReminderEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const checkTrialReminders = inngest.createFunction(
  { id: "check-trial-reminders", name: "Check Trial Reminders" },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const now = new Date();

    const orgsToNotify = await step.run("fetch-trial-orgs", async () => {
      // Get all orgs with a Stripe customer that have trialEndsAt set and in the future
      const allOrgs = await db
        .select()
        .from(organizations)
        .where(
          and(
            isNotNull(organizations.stripeCustomerId),
            isNotNull(organizations.trialEndsAt),
            gte(organizations.trialEndsAt, now)
          )
        );

      return allOrgs
        .filter((org) => {
          if (!org.trialEndsAt) return false;
          const trialEnd = new Date(org.trialEndsAt);
          const daysLeft = Math.ceil(
            (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          // Send reminders at day 7 (7 days left) and day 2 (2 days left = day 12 of 14)
          return daysLeft === 7 || daysLeft === 2;
        })
        .map((org) => {
          const trialEnd = new Date(org.trialEndsAt!);
          const daysLeft = Math.ceil(
            (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return { orgId: org.id, orgName: org.name, daysLeft };
        });
    });

    let sent = 0;

    for (const org of orgsToNotify) {
      await step.run(`send-reminder-${org.orgId}`, async () => {
        // Get admin users for this org
        const admins = await db
          .select()
          .from(users)
          .where(and(eq(users.orgId, org.orgId), eq(users.role, "admin")));

        for (const admin of admins) {
          await sendTrialReminderEmail(admin.email, admin.name, org.daysLeft);
          sent++;
        }

        logger.info("Trial reminder sent", {
          orgId: org.orgId,
          daysLeft: org.daysLeft,
          adminCount: admins.length,
        });
      });
    }

    return { checked: orgsToNotify.length, emailsSent: sent };
  }
);
