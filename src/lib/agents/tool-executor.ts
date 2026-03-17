import {
  searchPlayers,
  getPlayerTransfers,
  getPlayerSeasonStats as getPlayerSeasonStatsFromDB,
} from "@/db/queries";
import {
  LEAGUE_IDS,
  CURRENT_SEASON,
  getStandings,
  getTeams,
  getTeamSquad,
  searchPlayersByName,
} from "@/services/api-football";

/**
 * Resolve a league name to its API-Football ID.
 * Handles common variations (case-insensitive, partial match).
 */
function resolveLeagueId(leagueName: string): number | null {
  const normalized = leagueName.toLowerCase().trim();
  const mapping: Record<string, number> = {
    "premier league": LEAGUE_IDS["Premier League"],
    "epl": LEAGUE_IDS["Premier League"],
    "english premier league": LEAGUE_IDS["Premier League"],
    "la liga": LEAGUE_IDS["La Liga"],
    "laliga": LEAGUE_IDS["La Liga"],
    "serie a": LEAGUE_IDS["Serie A"],
    "seria a": LEAGUE_IDS["Serie A"],
    "bundesliga": LEAGUE_IDS["Bundesliga"],
    "ligue 1": LEAGUE_IDS["Ligue 1"],
    "ligue1": LEAGUE_IDS["Ligue 1"],
  };
  return mapping[normalized] ?? null;
}

/**
 * Execute a tool call from an agent's tool_use block.
 *
 * Resolves data from internal DB first, falls back to API-Football
 * for external data when needed.
 */
export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "get_player_stats": {
      const name = toolInput.player_name as string;
      if (!name) return JSON.stringify({ error: "player_name is required" });

      // Try internal DB first
      const dbPlayers = await searchPlayers(name, { limit: 1 });
      if (dbPlayers.length > 0) {
        const player = dbPlayers[0];
        const seasonStats = await getPlayerSeasonStatsFromDB(player.id);

        return JSON.stringify({
          source: "internal_db",
          player: {
            id: player.id,
            name: player.name,
            club: player.currentClub?.name ?? null,
            position: player.positionCluster ?? null,
          },
          stats: seasonStats,
        });
      }

      // Fallback: try API-Football search across top 5 leagues
      const season =
        typeof toolInput.season === "string"
          ? parseInt(toolInput.season, 10)
          : CURRENT_SEASON;

      for (const [leagueName, leagueId] of Object.entries(LEAGUE_IDS)) {
        try {
          const result = await searchPlayersByName({
            search: name,
            league: leagueId,
            season,
          });
          if (result.players.length > 0) {
            const p = result.players[0];
            const stats = p.statistics?.[0];
            return JSON.stringify({
              source: "api_football",
              league: leagueName,
              player: {
                apiId: p.player.id,
                name: p.player.name,
                age: p.player.age,
                nationality: p.player.nationality,
              },
              stats: stats
                ? {
                    team: stats.team?.name,
                    appearances: stats.games?.appearences ?? 0,
                    minutes: stats.games?.minutes ?? 0,
                    goals: stats.goals?.total ?? 0,
                    passAccuracy: stats.passes?.accuracy ?? null,
                  }
                : null,
            });
          }
        } catch {
          // Continue to next league
        }
      }

      return JSON.stringify({ error: "Player not found in DB or API-Football" });
    }

    case "get_team_squad": {
      const teamName = toolInput.team_name as string;
      if (!teamName) return JSON.stringify({ error: "team_name is required" });

      // Search for team across top 5 leagues
      for (const [, leagueId] of Object.entries(LEAGUE_IDS)) {
        try {
          const teams = await getTeams(leagueId, CURRENT_SEASON);
          const match = teams.find(
            (t) =>
              t.team.name.toLowerCase().includes(teamName.toLowerCase()) ||
              teamName.toLowerCase().includes(t.team.name.toLowerCase())
          );
          if (match) {
            const squad = await getTeamSquad(match.team.id);
            return JSON.stringify({
              source: "api_football",
              team: {
                id: match.team.id,
                name: match.team.name,
                country: match.team.country,
                venue: match.venue?.name,
              },
              players: squad?.players ?? [],
            });
          }
        } catch {
          // Continue to next league
        }
      }

      return JSON.stringify({ error: `Team "${teamName}" not found in top 5 leagues` });
    }

    case "get_league_standings": {
      const leagueName = toolInput.league_name as string;
      if (!leagueName)
        return JSON.stringify({ error: "league_name is required" });

      const leagueId = resolveLeagueId(leagueName);
      if (!leagueId) {
        return JSON.stringify({
          error: `League "${leagueName}" not recognized. Supported: Premier League, La Liga, Serie A, Bundesliga, Ligue 1`,
        });
      }

      try {
        const data = await getStandings(leagueId, CURRENT_SEASON);
        const standings = data?.[0]?.league?.standings?.[0];
        if (!standings) {
          return JSON.stringify({ error: "No standings data available" });
        }

        return JSON.stringify({
          source: "api_football",
          league: leagueName,
          season: CURRENT_SEASON,
          standings: standings.map((s) => ({
            rank: s.rank,
            team: s.team.name,
            points: s.points,
            played: s.all.played,
            won: s.all.win,
            drawn: s.all.draw,
            lost: s.all.lose,
            goalDiff: s.goalsDiff,
          })),
        });
      } catch (err) {
        return JSON.stringify({
          error: `Failed to fetch standings: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    case "get_transfer_history": {
      const name = toolInput.player_name as string;
      if (!name) return JSON.stringify({ error: "player_name is required" });

      // Search internal DB for transfer records
      const dbPlayers = await searchPlayers(name, { limit: 1 });
      if (dbPlayers.length > 0) {
        const transfers = await getPlayerTransfers(dbPlayers[0].id);
        if (transfers.length > 0) {
          return JSON.stringify({
            source: "internal_db",
            player: dbPlayers[0].name,
            transfers,
          });
        }
      }

      return JSON.stringify({
        error: "No transfer history found in internal database",
        hint: "Player may not be tracked in the system yet",
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
