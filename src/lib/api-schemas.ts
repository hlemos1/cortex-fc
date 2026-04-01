/**
 * Zod schemas for API route validation — CORTEX FC
 *
 * Principio: nunca confie no input. Todo body e ataque ate prova contraria.
 *
 * Uso em route handlers:
 *   const { data, error } = await parseBody(req, agentRequestSchema);
 *   if (error) return error;
 *   // data e tipado e validado
 */

import { z } from "zod";
import { NextResponse } from "next/server";

// ============================================
// HELPER: parseBody — valida e retorna tipado
// ============================================

export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const issues = result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      );
      return {
        data: null,
        error: NextResponse.json(
          { error: "Dados invalidos", issues },
          { status: 400 }
        ),
      };
    }

    return { data: result.data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Body invalido ou ausente" },
        { status: 400 }
      ),
    };
  }
}

// ============================================
// HELPER: parseQuery — valida query params
// ============================================

export function parseQuery<T extends z.ZodType>(
  url: string,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const params = Object.fromEntries(new URL(url).searchParams);
  const result = schema.safeParse(params);

  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    return {
      data: null,
      error: NextResponse.json(
        { error: "Parametros invalidos", issues },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}

// ============================================
// PRIMITIVOS REUTILIZAVEIS
// ============================================

export const uuidSchema = z.string().uuid("ID invalido");
export const emailSchema = z.string().email("Email invalido").max(320);
export const nameSchema = z.string().min(1, "Nome obrigatorio").max(200, "Nome muito longo");
export const textSchema = z.string().max(10000, "Texto muito longo");
export const shortTextSchema = z.string().max(500, "Texto muito longo");
export const positiveIntSchema = z.number().int().positive();
export const nonNegativeSchema = z.number().min(0);
export const pageSchema = z.coerce.number().int().min(1).default(1);
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

// ============================================
// SCHEMAS POR DOMINIO
// ============================================

// --- AGENTS (oracle, analista, scout, board, cfo, coaching) ---

export const agentRequestSchema = z.object({
  playerId: uuidSchema.optional(),
  clubContextId: uuidSchema.optional(),
  playerName: nameSchema.optional(),
  position: shortTextSchema.optional(),
  age: z.number().int().min(14).max(50).optional(),
  nationality: shortTextSchema.optional(),
  currentClub: shortTextSchema.optional(),
  marketValue: nonNegativeSchema.optional(),
  contractEnd: shortTextSchema.optional(),
  targetClubName: shortTextSchema.optional(),
  targetClubLeague: shortTextSchema.optional(),
  model: z.string().max(100).optional(),
  prompt: textSchema.optional(),
  context: textSchema.optional(),
}).passthrough();
// passthrough: valida campos conhecidos, permite extras (cada agente tem campos especificos)

// --- SCOUT (campos especificos alem do agent base) ---

export const scoutAgentSchema = agentRequestSchema.extend({
  ageRange: z.tuple([z.number().int().min(14), z.number().int().max(50)]).optional(),
  budgetMax: nonNegativeSchema.optional(),
  style: shortTextSchema.optional(),
  leaguePreference: shortTextSchema.optional(),
  mustHaveTraits: z.array(shortTextSchema).max(10).optional(),
});

// --- COACHING (campos especificos) ---

export const coachingAgentSchema = z.object({
  playerId: uuidSchema.optional(),
  playerName: nameSchema.optional(),
  position: shortTextSchema.optional(),
  situation: z.string().min(1, "Situacao obrigatoria").max(5000),
  responseType: z.enum(["short", "medium", "long"]).optional(),
  language: z.enum(["pt-BR", "en"]).optional(),
  model: z.string().max(100).optional(),
  prompt: textSchema.optional(),
  context: textSchema.optional(),
});

export const chatRequestSchema = z.object({
  action: z.literal("create").optional(),
  title: z.string().max(200).optional(),
  message: z.string().min(1, "Mensagem obrigatoria").max(5000, "Mensagem muito longa").optional(),
  conversationId: uuidSchema.optional(),
  model: z.string().max(100).optional(),
});

// --- SCOUTING ---

export const scoutingCreateSchema = z.object({
  playerId: uuidSchema,
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  notes: textSchema.optional(),
  source: shortTextSchema.optional(),
  targetPrice: nonNegativeSchema.optional(),
});

export const scoutingCommentSchema = z.object({
  targetId: uuidSchema,
  content: z.string().min(1).max(2000),
});

export const scoutingAlertSchema = z.object({
  playerId: uuidSchema,
  type: z.enum(["transfer", "injury", "performance", "contract"]),
  message: textSchema.optional(),
});

// --- PLAYERS ---

export const playerImportSchema = z.object({
  players: z.array(z.object({
    name: nameSchema,
    position: shortTextSchema,
    age: z.number().int().min(14).max(50).optional(),
    nationality: shortTextSchema.optional(),
    currentClubId: uuidSchema.optional(),
    marketValue: nonNegativeSchema.optional(),
    externalId: z.string().max(100).optional(),
  })).min(1).max(100),
});

export const playerSearchSchema = z.object({
  query: z.string().min(2).max(200),
  league: shortTextSchema.optional(),
  position: shortTextSchema.optional(),
  limit: limitSchema,
});

// --- REPORTS ---

export const reportGenerateSchema = z.object({
  playerId: uuidSchema.optional(),
  type: z.enum(["individual", "comparison", "scouting", "squad"]).default("individual"),
  format: z.enum(["pdf", "csv", "xlsx"]).default("pdf"),
  playerIds: z.array(uuidSchema).max(10).optional(),
});

// --- BILLING / STRIPE ---

export const checkoutSchema = z.object({
  tier: z.string().min(1).max(100),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

// --- INVITES ---

export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(["admin", "director", "analyst", "scout", "viewer"]).default("analyst"),
});

// --- ONBOARDING ---

export const onboardingSchema = z.object({
  clubName: z.string().min(1).max(200),
  league: shortTextSchema.optional(),
  country: shortTextSchema.optional(),
  invites: z.array(z.object({
    email: emailSchema,
    role: z.enum(["admin", "director", "analyst", "scout", "viewer"]),
  })).max(20).optional(),
});

// --- SETTINGS ---

export const settingsUpdateSchema = z.object({
  aiModel: z.string().max(100).optional(),
  maxTokens: z.number().int().min(256).max(32768).optional(),
  temperature: z.number().min(0).max(2).optional(),
  notifyContracts: z.boolean().optional(),
  notifyReports: z.boolean().optional(),
  notifyScouting: z.boolean().optional(),
  notifyRisk: z.boolean().optional(),
  density: z.enum(["compact", "normal", "comfortable"]).optional(),
  language: z.enum(["pt-BR", "en"]).optional(),
  soundEnabled: z.boolean().optional(),
  hapticEnabled: z.boolean().optional(),
  soundVolume: z.number().min(0).max(1).optional(),
});

// --- EXPORT ---

export const exportSchema = z.object({
  type: z.enum(["players", "analyses", "scouting", "reports"]),
  format: z.enum(["csv", "pdf", "xlsx"]).default("csv"),
  filters: z.record(z.string(), z.string()).optional(),
});

// --- SIMULATOR ---

export const simulatorSchema = z.object({
  scenarios: z.array(z.object({
    playerId: uuidSchema,
    action: z.enum(["buy", "sell", "loan_in", "loan_out"]),
    value: nonNegativeSchema.optional(),
    salary: nonNegativeSchema.optional(),
  })).min(1).max(20),
});

// --- API V1 (public) ---

export const apiV1QuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  sort: shortTextSchema.optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// --- SHARE ---

export const shareSchema = z.object({
  entityType: z.enum(["analysis", "scouting", "report"]),
  entityId: uuidSchema,
  expiresIn: z.number().int().min(1).max(720).default(24), // hours
});

// --- SYNERGY ---

export const synergySchema = z.object({
  playerIds: z.array(uuidSchema).min(2).max(30),
  formation: shortTextSchema.optional(),
});

// --- ACCOUNT ---

export const accountUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});
