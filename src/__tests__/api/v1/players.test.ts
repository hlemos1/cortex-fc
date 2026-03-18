import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB layer to avoid neon() connection
vi.mock("@/db/index", () => ({
  db: { query: { organizations: { findFirst: vi.fn() } } },
}));
vi.mock("@/db/schema", () => ({
  organizations: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

// Mock auth
vi.mock("@/lib/api-auth", () => ({
  requireApiAuth: vi.fn(),
}));

// Mock DB queries
vi.mock("@/db/queries", () => ({
  getPlayers: vi.fn(),
  searchPlayers: vi.fn(),
  searchPlayersAdvanced: vi.fn(),
  getApiKeyByHash: vi.fn(),
  touchApiKey: vi.fn(),
}));

import { GET } from "@/app/api/v1/players/route";
import { requireApiAuth } from "@/lib/api-auth";
import { getPlayers, searchPlayersAdvanced } from "@/db/queries";

describe("GET /api/v1/players", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      ctx: { orgId: "org-1", tier: "club_professional", keyId: "k-1", rateLimitPerMin: 60 },
      error: null,
    });
  });

  it("returns players with default pagination", async () => {
    const mockPlayers = [
      { id: "1", name: "Test Player", position: "ST" },
      { id: "2", name: "Another Player", position: "CB" },
    ];
    (getPlayers as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlayers);

    const req = new Request("http://localhost/api/v1/players");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.meta.limit).toBe(50);
    expect(data.meta.offset).toBe(0);
    expect(getPlayers).toHaveBeenCalledWith({ limit: 50, offset: 0 });
  });

  it("returns 401 without valid API key", async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    (requireApiAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      ctx: null,
      error: mockErrorResponse,
    });

    const req = new Request("http://localhost/api/v1/players");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("applies search filters via searchPlayersAdvanced", async () => {
    (searchPlayersAdvanced as ReturnType<typeof vi.fn>).mockResolvedValue({
      players: [{ id: "10", name: "Lionel Messi" }],
      total: 1,
    });

    const req = new Request(
      "http://localhost/api/v1/players?search=Messi&position=ST"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(searchPlayersAdvanced).toHaveBeenCalledWith("Messi", 50, 0, {
      position: "ST",
      nationality: undefined,
      club: undefined,
      minMarketValue: undefined,
      maxMarketValue: undefined,
      maxAge: undefined,
    });
    expect(data.data).toHaveLength(1);
    expect(data.meta.total).toBe(1);
  });

  it("respects custom limit and offset", async () => {
    (getPlayers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new Request(
      "http://localhost/api/v1/players?limit=10&offset=20"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(getPlayers).toHaveBeenCalledWith({ limit: 10, offset: 20 });
    expect(data.meta.limit).toBe(10);
    expect(data.meta.offset).toBe(20);
  });

  it("clamps limit to max 200", async () => {
    (getPlayers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new Request("http://localhost/api/v1/players?limit=999");
    await GET(req);

    expect(getPlayers).toHaveBeenCalledWith({ limit: 200, offset: 0 });
  });

  it("applies nationality filter", async () => {
    (searchPlayersAdvanced as ReturnType<typeof vi.fn>).mockResolvedValue({
      players: [],
      total: 0,
    });

    const req = new Request(
      "http://localhost/api/v1/players?nationality=Brazil"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(searchPlayersAdvanced).toHaveBeenCalledWith("", 50, 0, {
      position: undefined,
      nationality: "Brazil",
      club: undefined,
      minMarketValue: undefined,
      maxMarketValue: undefined,
      maxAge: undefined,
    });
  });

  it("applies value range filters", async () => {
    (searchPlayersAdvanced as ReturnType<typeof vi.fn>).mockResolvedValue({
      players: [],
      total: 0,
    });

    const req = new Request(
      "http://localhost/api/v1/players?minValue=5&maxValue=50&maxAge=25"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(searchPlayersAdvanced).toHaveBeenCalledWith("", 50, 0, {
      position: undefined,
      nationality: undefined,
      club: undefined,
      minMarketValue: 5,
      maxMarketValue: 50,
      maxAge: 25,
    });
  });
});
