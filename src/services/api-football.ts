/**
 * API-Football (RapidAPI) service layer.
 *
 * Docs: https://www.api-football.com/documentation-v3
 * Free tier: 100 requests/day
 *
 * Requires: RAPIDAPI_KEY env var
 */

const BASE_URL = "https://v3.football.api-sports.io";

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "v3.football.api-sports.io",
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
