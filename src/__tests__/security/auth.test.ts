import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

describe("Authentication Security", () => {
  it("auth config uses secure session strategy", () => {
    const auth = readFileSync(join(process.cwd(), "src/auth.ts"), "utf-8")
    expect(auth).toContain("jwt")
    expect(auth).toContain("bcrypt")
  })

  it("API routes check authentication", () => {
    const fs = require("fs")
    const path = require("path")

    // Check that key API routes have auth checks
    const routesToCheck = [
      "src/app/api/oracle/route.ts",
      "src/app/api/chat/route.ts",
      "src/app/api/scouting/route.ts",
    ]

    for (const route of routesToCheck) {
      const fullPath = path.join(process.cwd(), route)
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8")
        const hasAuth = content.includes("auth()") || content.includes("requireAuth") || content.includes("requireApiAuth")
        expect(hasAuth, `${route} should check auth`).toBe(true)
      }
    }
  })
})
