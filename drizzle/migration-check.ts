// This is run in CI to ensure no pending schema changes
// Usage: npx tsx drizzle/migration-check.ts
import { execSync } from "child_process"

try {
  const output = execSync("npx drizzle-kit generate --check", { encoding: "utf-8" })
  console.log("Schema is up to date with migrations")
  console.log(output)
} catch (error: any) {
  if (error.stdout?.includes("No schema changes")) {
    console.log("Schema is up to date")
    process.exit(0)
  }
  console.error("Pending schema changes detected!")
  console.error("Run 'pnpm drizzle-kit generate' to create migration")
  process.exit(1)
}
