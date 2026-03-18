import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest-client";
import { functions } from "@/inngest/functions";
import { runAgentBackground } from "@/inngest/functions/agent-background";
import { generateReportBackground } from "@/inngest/functions/generate-report";
import { processScheduledReports } from "@/inngest/functions/scheduled-reports";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...functions, runAgentBackground, generateReportBackground, processScheduledReports],
});
