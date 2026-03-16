/**
 * API-Football service layer.
 *
 * Docs: https://www.api-football.com/documentation-v3
 * Free tier: 100 requests/day
 *
 * Requires: API_FOOTBALL_KEY env var (or legacy RAPIDAPI_KEY)
 */

const BASE_URL = "https://v3.football.api-sports.io";

function getApiKey(): string {
  const key = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not configured");
  return key;
}

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
  const apiKey = getApiKey();

  const url = new URL(`${BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: { revalidate: 3600 }, // cache 1h
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data: ApiFootballResponse<T> = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }

  return data.response;
}

// ============================================
// Helper to get full paginated response (with paging metadata)
// ============================================

async function apiFetchWithPaging<T>(endpoint: string, params: Record<string, string> = {}): Promise<{
  response: T[];
  paging: { current: number; total: number };
  results: number;
}> {
  const apiKey = getApiKey();

  const url = new URL(`${BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data: ApiFootballResponse<T> = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }

  return { response: data.response, paging: data.paging, results: data.results };
}

// ============================================
// TOP 5 LEAGUES — IDs in API-Football
// ============================================

export const LEAGUE_IDS = {
  "Premier League": 39,
  "La Liga": 140,
  "Serie A": 135,
  "Bundesliga": 78,
  "Ligue 1": 61,
} as const;

export const CURRENT_SEASON = 2024;

// ============================================
// TYPES
// ============================================

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiPlayerStats {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    games: {
      minutes: number | null;
      position: string;
      rating: string | null;
    };
    goals: {
      total: number | null;
      assists: number | null;
    };
    shots: {
      total: number | null;
      on: number | null;
    };
    passes: {
      total: number | null;
      accuracy: string | null;
    };
    tackles: {
      total: number | null;
      interceptions: number | null;
    };
    duels: {
      total: number | null;
      won: number | null;
    };
    dribbles: {
      attempts: number | null;
      success: number | null;
    };
    fouls: {
      committed: number | null;
    };
    cards: {
      yellow: number | null;
      red: number | null;
    };
  }>;
}

export interface ApiTeam {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    logo: string;
  };
  venue: {
    name: string;
    city: string;
    capacity: number;
  };
}

export interface ApiPlayer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: { date: string; country: string };
    nationality: string;
    height: string | null;
    weight: string | null;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string };
    league: { id: number; name: string };
    games: {
      position: string;
      appearences: number;
      minutes: number;
    };
    goals: { total: number | null };
    passes: { total: number | null; accuracy: number | null };
  }>;
}

export interface ApiTransfer {
  player: { id: number; name: string };
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: { id: number; name: string };
      out: { id: number; name: string };
    };
  }>;
}

// ============================================
// API CALLS
// ============================================

/**
 * Get fixtures (matches) for a league/season/date range
 */
export async function getFixtures(params: {
  league: number;
  season: number;
  from?: string; // YYYY-MM-DD
  to?: string;
  status?: string; // FT = finished
}): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture>("fixtures", {
    league: String(params.league),
    season: String(params.season),
    ...(params.from && { from: params.from }),
    ...(params.to && { to: params.to }),
    ...(params.status && { status: params.status }),
  });
}

/**
 * Get player statistics for a specific fixture
 */
export async function getFixturePlayerStats(fixtureId: number): Promise<ApiPlayerStats[]> {
  const response = await apiFetch<{ team: { id: number }; players: ApiPlayerStats[] }>(
    "fixtures/players",
    { fixture: String(fixtureId) }
  );
  return response.flatMap((team) => team.players);
}

/**
 * Get all teams in a league/season
 */
export async function getTeams(league: number, season: number): Promise<ApiTeam[]> {
  return apiFetch<ApiTeam>("teams", {
    league: String(league),
    season: String(season),
  });
}

/**
 * Get squad/players for a team
 */
export async function getSquad(teamId: number): Promise<ApiPlayer[]> {
  return apiFetch<ApiPlayer>("players/squads", { team: String(teamId) });
}

/**
 * Get player season stats
 */
export async function getPlayerSeasonStats(params: {
  player?: number;
  team?: number;
  league: number;
  season: number;
  page?: number;
}): Promise<ApiPlayer[]> {
  return apiFetch<ApiPlayer>("players", {
    league: String(params.league),
    season: String(params.season),
    ...(params.player && { id: String(params.player) }),
    ...(params.team && { team: String(params.team) }),
    ...(params.page && { page: String(params.page) }),
  });
}

/**
 * Get transfers for a player
 */
export async function getTransfers(playerId: number): Promise<ApiTransfer[]> {
  return apiFetch<ApiTransfer>("transfers", { player: String(playerId) });
}

// ============================================
// WORLDWIDE SEARCH & DISCOVERY
// ============================================

export interface ApiCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

export interface ApiLeague {
  league: {
    id: number;
    name: string;
    type: string; // "League" | "Cup"
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    current: boolean;
  }>;
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

/**
 * List all available countries
 */
export async function getCountries(): Promise<ApiCountry[]> {
  return apiFetch<ApiCountry>("countries");
}

/**
 * List leagues by country (or all)
 */
export async function getLeagues(params?: {
  country?: string;
  season?: number;
  search?: string;
  id?: number;
}): Promise<ApiLeague[]> {
  const query: Record<string, string> = {};
  if (params?.country) query.country = params.country;
  if (params?.season) query.season = String(params.season);
  if (params?.search) query.search = params.search;
  if (params?.id) query.id = String(params.id);
  return apiFetch<ApiLeague>("leagues", query);
}

/**
 * Search players by name (requires league + season)
 */
export async function searchPlayersByName(params: {
  search: string;
  league: number;
  season: number;
  page?: number;
}): Promise<{ players: ApiPlayer[]; paging: { current: number; total: number }; results: number }> {
  const result = await apiFetchWithPaging<ApiPlayer>("players", {
    search: params.search,
    league: String(params.league),
    season: String(params.season),
    ...(params.page && { page: String(params.page) }),
  });
  return { players: result.response, paging: result.paging, results: result.results };
}

/**
 * Get player profile + stats by API-Football player ID
 */
export async function getPlayerProfile(playerId: number, season: number): Promise<ApiPlayer | null> {
  const data = await apiFetch<ApiPlayer>("players", {
    id: String(playerId),
    season: String(season),
  });
  return data[0] ?? null;
}

/**
 * Get squad (current roster) of a team — lightweight, no stats
 */
export async function getTeamSquad(teamId: number): Promise<{ team: { id: number; name: string; logo: string }; players: ApiSquadPlayer[] } | null> {
  const data = await apiFetch<{ team: { id: number; name: string; logo: string }; players: ApiSquadPlayer[] }>(
    "players/squads",
    { team: String(teamId) }
  );
  return data[0] ?? null;
}

/**
 * Get standings for a league
 */
export async function getStandings(league: number, season: number) {
  return apiFetch<{
    league: {
      standings: Array<
        Array<{
          rank: number;
          team: { id: number; name: string; logo: string };
          points: number;
          goalsDiff: number;
          all: { played: number; win: number; draw: number; lose: number };
        }>
      >;
    };
  }>("standings", {
    league: String(league),
    season: String(season),
  });
}
