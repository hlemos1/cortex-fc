import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Primary (read-write)
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Read replica (falls back to primary if not configured)
const replicaSql = neon(process.env.DATABASE_REPLICA_URL ?? process.env.DATABASE_URL!);
export const dbRead = process.env.DATABASE_REPLICA_URL
  ? drizzle(replicaSql, { schema })
  : db;
