/**
 * Role-Based Access Control (RBAC) for CORTEX FC
 *
 * Roles:
 * - admin: full access (CRUD all entities, manage team, billing)
 * - analyst: create/edit analyses, players, scouting. Cannot manage team or billing.
 * - viewer: read-only access to all data. Cannot create or edit.
 */

type Role = "admin" | "analyst" | "viewer";

type Action =
  | "read"
  | "create_analysis"
  | "edit_analysis"
  | "delete_analysis"
  | "manage_players"
  | "manage_scouting"
  | "manage_reports"
  | "manage_team"
  | "manage_billing"
  | "use_agents"
  | "export_data";

const PERMISSIONS: Record<Role, Set<Action>> = {
  admin: new Set([
    "read",
    "create_analysis",
    "edit_analysis",
    "delete_analysis",
    "manage_players",
    "manage_scouting",
    "manage_reports",
    "manage_team",
    "manage_billing",
    "use_agents",
    "export_data",
  ]),
  analyst: new Set([
    "read",
    "create_analysis",
    "edit_analysis",
    "manage_players",
    "manage_scouting",
    "manage_reports",
    "use_agents",
    "export_data",
  ]),
  viewer: new Set([
    "read",
  ]),
};

export function hasPermission(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.has(action) ?? false;
}

export function requirePermission(role: string, action: Action): void {
  if (!hasPermission(role as Role, action)) {
    throw new Error(`Forbidden: role '${role}' cannot perform '${action}'`);
  }
}
