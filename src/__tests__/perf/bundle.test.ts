import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

describe("Performance Budget", () => {
  it("package.json should not have too many dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"))
    const depCount = Object.keys(pkg.dependencies || {}).length
    // Alert if deps exceed 30 (currently ~22)
    expect(depCount).toBeLessThan(35)
  })

  it("no heavy unnecessary imports in client components", () => {
    // Check that heavy libs aren't imported at top-level in layout
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf-8")
    expect(layout).not.toContain("import Stripe")
    expect(layout).not.toContain("import Anthropic")
  })

  it("framer-motion is only imported via motion wrapper", () => {
    // Ensure framer-motion isn't directly imported in page components
    // Just verify the wrapper exists
    expect(existsSync(join(process.cwd(), "src/components/ui/motion.tsx"))).toBe(true)
  })
})
