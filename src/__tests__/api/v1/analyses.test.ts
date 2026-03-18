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
  getAnalyses: vi.fn(),
  getAnalysisById: vi.fn(),
  getApiKeyByHash: vi.fn(),
  touchApiKey: vi.fn(),
}));

import { GET } from "@/app/api/v1/analyses/route";
import { requireApiAuth } from "@/lib/api-auth";
import { getAnalyses, getAnalysisById } from "@/db/queries";

const mockCtx = {
  orgId: "org-1",
  tier: "club_professional",
  keyId: "k-1",
  rateLimitPerMin: 60,
};

describe("GET /api/v1/analyses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      ctx: mockCtx,
      error: null,
    });
  });

  it("returns analyses list with default pagination", async () => {
    const mockAnalyses = [
      { id: "a-1", title: "Player Analysis", orgId: "org-1" },
      { id: "a-2", title: "Match Report", orgId: "org-1" },
    ];
    (getAnalyses as ReturnType<typeof vi.fn>).mockResolvedValue(mockAnalyses);

    const req = new Request("http://localhost/api/v1/analyses");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.meta.limit).toBe(50);
    expect(data.meta.offset).toBe(0);
    expect(getAnalyses).toHaveBeenCalledWith("org-1", { limit: 50, offset: 0 });
  });

  it("returns 401 when auth fails", async () => {
    const mockErrorResponse = new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
    (requireApiAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      ctx: null,
      error: mockErrorResponse,
    });

    const req = new Request("http://localhost/api/v1/analyses");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns single analysis by id", async () => {
    const mockAnalysis = {
      id: "a-1",
      title: "Deep Analysis",
      orgId: "org-1",
    };
    (getAnalysisById as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAnalysis
    );

    const req = new Request("http://localhost/api/v1/analyses?id=a-1");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.id).toBe("a-1");
    expect(getAnalysisById).toHaveBeenCalledWith("a-1");
  });

  it("returns 404 when analysis not found", async () => {
    (getAnalysisById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new Request(
      "http://localhost/api/v1/analyses?id=nonexistent"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Analysis not found");
  });

  it("respects custom limit and offset", async () => {
    (getAnalyses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new Request(
      "http://localhost/api/v1/analyses?limit=10&offset=30"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(getAnalyses).toHaveBeenCalledWith("org-1", { limit: 10, offset: 30 });
    expect(data.meta.limit).toBe(10);
    expect(data.meta.offset).toBe(30);
  });

  it("clamps limit to max 100", async () => {
    (getAnalyses as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new Request("http://localhost/api/v1/analyses?limit=500");
    await GET(req);

    expect(getAnalyses).toHaveBeenCalledWith("org-1", { limit: 100, offset: 0 });
  });
});
