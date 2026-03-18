import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

describe("Security Configuration", () => {
  it("next.config has security headers", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf-8")
    expect(config).toContain("X-Frame-Options")
    expect(config).toContain("X-Content-Type-Options")
    expect(config).toContain("Strict-Transport-Security")
  })

  it("no hardcoded secrets in source", () => {
    const fs = require("fs")
    const path = require("path")

    function scanDir(dir: string): string[] {
      const issues: string[] = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          issues.push(...scanDir(fullPath))
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, "utf-8")
          if (/sk-ant-[a-zA-Z0-9]{20,}/.test(content)) issues.push(`${fullPath}: Anthropic key found`)
          if (/sk_live_[a-zA-Z0-9]{20,}/.test(content)) issues.push(`${fullPath}: Stripe live key found`)
          if (/AKIA[A-Z0-9]{16}/.test(content)) issues.push(`${fullPath}: AWS key found`)
        }
      }
      return issues
    }

    const issues = scanDir(join(process.cwd(), "src"))
    expect(issues).toHaveLength(0)
  })

  it("env.example exists with all required vars", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf-8")
    expect(envExample).toContain("DATABASE_URL")
    expect(envExample).toContain("NEXTAUTH_SECRET")
    expect(envExample).toContain("ANTHROPIC_API_KEY")
    expect(envExample).toContain("STRIPE_SECRET_KEY")
  })

  it("middleware protects dashboard routes", () => {
    const middleware = readFileSync(join(process.cwd(), "middleware.ts"), "utf-8")
    expect(middleware).toContain("/dashboard")
    expect(middleware).toContain("/players")
    expect(middleware).toContain("/settings")
  })

  it("rate limiting is configured", () => {
    const rateLimit = readFileSync(join(process.cwd(), "src/lib/rate-limit.ts"), "utf-8")
    expect(rateLimit).toContain("Ratelimit")
    expect(rateLimit).toContain("slidingWindow")
  })
})
