import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/**
 * Tool definitions for Anthropic tool_use.
 * These allow agents to fetch real data during execution
 * instead of hallucinating stats.
 */
export const AGENT_TOOLS: Tool[] = [
  {
    name: "get_player_stats",
    description:
      "Get current season statistics for a football player including goals, assists, appearances, xG, xA, pass accuracy. Use this when you need real performance data to make your analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        player_name: {
          type: "string",
          description: "Full name of the player",
        },
        season: {
          type: "string",
          description: "Season in format YYYY, defaults to current",
        },
      },
      required: ["player_name"],
    },
  },
  {
    name: "get_team_squad",
    description:
      "Get the full squad of a football team with player details. Use this to understand team composition and identify gaps.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_name: {
          type: "string",
          description: "Name of the football team",
        },
      },
      required: ["team_name"],
    },
  },
  {
    name: "get_league_standings",
    description:
      "Get current league standings/table. Use this for competitive context.",
    input_schema: {
      type: "object" as const,
      properties: {
        league_name: {
          type: "string",
          description:
            "Name of the league (e.g., Premier League, La Liga, Serie A, Bundesliga, Ligue 1)",
        },
      },
      required: ["league_name"],
    },
  },
  {
    name: "get_transfer_history",
    description:
      "Get transfer history for a player showing past clubs and fees.",
    input_schema: {
      type: "object" as const,
      properties: {
        player_name: {
          type: "string",
          description: "Full name of the player",
        },
      },
      required: ["player_name"],
    },
  },
];
