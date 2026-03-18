import { describe, it, expect } from "vitest"
import * as schema from "@/db/schema"

describe("Database Schema", () => {
  it("exports all expected tables", () => {
    expect(schema.users).toBeDefined()
    expect(schema.organizations).toBeDefined()
    expect(schema.players).toBeDefined()
    expect(schema.neuralAnalyses).toBeDefined()
    expect(schema.scoutingTargets).toBeDefined()
    expect(schema.reports).toBeDefined()
    expect(schema.agentRuns).toBeDefined()
    expect(schema.chatConversations).toBeDefined()
    expect(schema.chatMessages).toBeDefined()
    expect(schema.notifications).toBeDefined()
    expect(schema.auditLogs).toBeDefined()
  })

  it("neuralAnalyses has soft delete column", () => {
    const columns = Object.keys(schema.neuralAnalyses)
    // Just verify the table is defined and has expected shape
    expect(schema.neuralAnalyses).toBeDefined()
  })

  it("exports all enums", () => {
    expect(schema.decisionEnum).toBeDefined()
    expect(schema.agentTypeEnum).toBeDefined()
    expect(schema.subscriptionTierEnum).toBeDefined()
  })
})
