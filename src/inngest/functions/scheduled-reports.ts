/**
 * Scheduled Reports — Inngest cron function (Sprint 8.2d)
 *
 * Runs every hour to check for due scheduled reports,
 * triggers report generation, and updates the schedule.
 */

import { inngest } from "@/lib/inngest-client";
import {
  getDueSchedules,
  updateReportSchedule,
  calculateNextRun,
} from "@/db/queries/reports";
import { publishEvent } from "@/lib/realtime";

export const processScheduledReports = inngest.createFunction(
  { id: "process-scheduled-reports", name: "Process Scheduled Reports" },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    const dueSchedules = await step.run("fetch-due-schedules", async () => {
      return getDueSchedules();
    });

    if (dueSchedules.length === 0) return { processed: 0 };

    for (const schedule of dueSchedules) {
      await step.run(`generate-${schedule.id}`, async () => {
        // Trigger report generation via Inngest event
        await inngest.send({
          name: "report/generate.requested",
          data: {
            reportType: schedule.template,
            orgId: schedule.orgId,
            userId: schedule.createdBy,
            params: {
              title:
                schedule.title ??
                `Relatorio Agendado — ${new Date().toLocaleDateString("pt-BR")}`,
              scheduled: true,
              scheduleId: schedule.id,
            },
          },
        });

        // Calculate next run and update schedule
        const nextRunAt = calculateNextRun(
          schedule.frequency,
          schedule.dayOfWeek ?? undefined,
          schedule.dayOfMonth ?? undefined,
          schedule.hour
        );

        await updateReportSchedule(schedule.id, schedule.orgId, {
          lastRunAt: new Date(),
          nextRunAt,
        });

        await publishEvent({
          channel: "notifications",
          type: "report.scheduled.generated",
          orgId: schedule.orgId,
          data: { scheduleId: schedule.id, template: schedule.template },
        });
      });
    }

    return { processed: dueSchedules.length };
  }
);
