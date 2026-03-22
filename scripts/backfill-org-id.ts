import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

const envPath = resolve(import.meta.dirname ?? ".", "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* */ }

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`
    UPDATE neural_analyses na
    SET org_id = u.org_id
    FROM users u
    WHERE na.analyst_id = u.id
    AND na.org_id IS NULL
    AND u.org_id IS NOT NULL
  `;
  console.log("Backfilled org_id on analyses");

  const remaining = await sql`SELECT count(*) as c FROM neural_analyses WHERE org_id IS NULL`;
  console.log("Remaining without org_id:", remaining[0].c);
}

main().catch(console.error);
