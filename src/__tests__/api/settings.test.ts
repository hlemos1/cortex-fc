import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB layer
vi.mock("@/db/index", () => ({
  db: { query: { organizations: { findFirst: vi.fn() } } },
}));
vi.mock("@/db/schema", () => ({
  organizations: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

// Mock auth helpers
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

// Mock DB queries
vi.mock("@/db/queries", () => ({
  getUserPreferences: vi.fn(),
  upsertUserPreferences: vi.fn(),
  getApiKeyByHash: vi.fn(),
  touchApiKey: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/settings/route";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserPreferences, upsertUserPreferences } from "@/db/queries";

const mockSession = {
  userId: "user-1",
  orgId: "org-1",
  role: "admin" as const,
  email: "test@test.com",
  name: "Test User",
  tier: "club_professional",
};

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: mockSession,
      error: null,
    });
  });

  it("returns defaults when no preferences exist", async () => {
    (getUserPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.aiModel).toBe("claude-sonnet-4-20250514");
    expect(data.data.maxTokens).toBe(4096);
    expect(data.data.temperature).toBe(0.7);
    expect(data.data.language).toBe("pt-BR");
    expect(data.data.density).toBe("normal");
  });

  it("returns stored preferences when they exist", async () => {
    const storedPrefs = {
      aiModel: "gpt-4o",
      maxTokens: 2048,
      temperature: 0.5,
      notifyContracts: false,
      notifyReports: true,
      notifyScouting: true,
      notifyRisk: false,
      density: "compact",
      language: "en-US",
      soundEnabled: true,
      hapticEnabled: false,
      soundVolume: 0.8,
    };
    (getUserPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(
      storedPrefs
    );

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.aiModel).toBe("gpt-4o");
    expect(data.data.density).toBe("compact");
    expect(data.data.language).toBe("en-US");
  });

  it("returns 401 when not authenticated", async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: null,
      error: mockErrorResponse,
    });

    const res = await GET();

    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: mockSession,
      error: null,
    });
  });

  it("updates allowed fields", async () => {
    const updatedPrefs = {
      aiModel: "gpt-4o",
      maxTokens: 2048,
      temperature: 0.5,
    };
    (upsertUserPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(
      updatedPrefs
    );

    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ aiModel: "gpt-4o", maxTokens: 2048, temperature: 0.5 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(upsertUserPreferences).toHaveBeenCalledWith(
      "user-1",
      "org-1",
      { aiModel: "gpt-4o", maxTokens: 2048, temperature: 0.5 }
    );
    expect(data.data).toEqual(updatedPrefs);
  });

  it("rejects request with no valid fields", async () => {
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ invalidField: "value", anotherBad: 123 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Nenhum campo valido para atualizar");
  });

  it("strips disallowed fields from body", async () => {
    (upsertUserPreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
      language: "en-US",
    });

    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        language: "en-US",
        role: "admin",
        orgId: "hacked",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(upsertUserPreferences).toHaveBeenCalledWith(
      "user-1",
      "org-1",
      { language: "en-US" }
    );
  });

  it("returns 401 when not authenticated", async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: null,
      error: mockErrorResponse,
    });

    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ language: "en-US" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);

    expect(res.status).toBe(401);
  });
});
