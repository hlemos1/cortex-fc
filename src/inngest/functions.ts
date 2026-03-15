/**
 * Inngest background functions.
 *
 * These run asynchronously after events are sent,
 * keeping API responses fast.
 */

import { inngest } from "@/lib/inngest-client";
import { invalidateCache, invalidateCachePrefix, CACHE_KEYS } from "@/lib/cache";

// ============================================
// 1. Cache invalidation on analysis creation
// ============================================

export const onAnalysisCreated = inngest.createFunction(
  { id: "on-analysis-created", name: "Invalidate cache + notify on analysis" },
  { event: "cortex/analysis.created" },
  async ({ event, step }) => {
    const { orgId, analysisId, playerName } = event.data;

    // Step 1: Invalidate caches
    await step.run("invalidate-caches", async () => {
      await Promise.all([
        invalidateCache(CACHE_KEYS.dashboardStats(orgId)),
        invalidateCachePrefix("players:list:" + orgId),
      ]);
    });

    // Step 2: Dispatch webhooks
    await step.run("dispatch-webhooks", async () => {
      const { dispatchWebhook } = await import("@/lib/webhook-dispatch");
      await dispatchWebhook(orgId, "analysis_complete", {
        analysisId,
        playerName,
      });
    });

    return { success: true };
  }
);

// ============================================
// 2. Agent run completion — cache + webhook
// ============================================

export const onAgentCompleted = inngest.createFunction(
  { id: "on-agent-completed", name: "Post-agent-run tasks" },
  { event: "cortex/agent.completed" },
  async ({ event, step }) => {
    const { orgId, agentType, runId } = event.data;

    await step.run("invalidate-agent-metrics", async () => {
      await invalidateCache(CACHE_KEYS.agentMetrics(orgId));
    });

    await step.run("dispatch-webhook", async () => {
      const { dispatchWebhook } = await import("@/lib/webhook-dispatch");
      await dispatchWebhook(orgId, "agent_run_complete", {
        agentType,
        runId,
      });
    });

    return { success: true };
  }
);

// ============================================
// 3. Report generated — webhook notification
// ============================================

export const onReportGenerated = inngest.createFunction(
  { id: "on-report-generated", name: "Notify on report generation" },
  { event: "cortex/report.generated" },
  async ({ event, step }) => {
    const { orgId, reportId, analysisId } = event.data;

    await step.run("dispatch-webhook", async () => {
      const { dispatchWebhook } = await import("@/lib/webhook-dispatch");
      await dispatchWebhook(orgId, "report_generated", {
        reportId,
        analysisId,
      });
    });

    return { success: true };
  }
);

// ============================================
// 4. Scouting target added — cache + webhook
// ============================================

export const onScoutingTargetAdded = inngest.createFunction(
  { id: "on-scouting-target-added", name: "Post-scouting tasks" },
  { event: "cortex/scouting.target.added" },
  async ({ event, step }) => {
    const { orgId, targetId, playerName } = event.data;

    await step.run("invalidate-caches", async () => {
      await Promise.all([
        invalidateCache(CACHE_KEYS.scoutingTargets(orgId)),
        invalidateCache(CACHE_KEYS.dashboardStats(orgId)),
      ]);
    });

    await step.run("dispatch-webhook", async () => {
      const { dispatchWebhook } = await import("@/lib/webhook-dispatch");
      await dispatchWebhook(orgId, "scouting_target_added", {
        targetId,
        playerName,
      });
    });

    return { success: true };
  }
);

// ============================================
// 5. Generic cache invalidation
// ============================================

export const onCacheInvalidate = inngest.createFunction(
  { id: "cache-invalidate", name: "Background cache invalidation" },
  { event: "cortex/cache.invalidate" },
  async ({ event, step }) => {
    const { key, prefix } = event.data;

    await step.run("invalidate", async () => {
      if (key) await invalidateCache(key);
      if (prefix) await invalidateCachePrefix(prefix);
    });

    return { success: true };
  }
);

// Export all functions for the Inngest serve handler
export const functions = [
  onAnalysisCreated,
  onAgentCompleted,
  onReportGenerated,
  onScoutingTargetAdded,
  onCacheInvalidate,
];
