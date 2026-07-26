import { json, errorResponse } from "../../_lib/util.js";
import { getSessionUser } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);
  if (user.role !== "admin") return errorResponse("forbidden", 403);

  const { results } = await env.DB.prepare(
    "SELECT username, display_name, team, role, created_at FROM users ORDER BY created_at ASC"
  ).all();

  return json({
    users: results.map((r) => ({
      username: r.username,
      displayName: r.display_name,
      team: r.team,
      role: r.role,
      createdAt: r.created_at,
    })),
  });
}
