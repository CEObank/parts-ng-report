import { json, errorResponse, readJson } from "../../_lib/util.js";
import { getSessionUser } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);
  if (user.role !== "admin") return errorResponse("forbidden", 403);

  const { results } = await env.DB.prepare("SELECT * FROM authorized_users ORDER BY added_at DESC").all();

  return json({
    authorized: results.map((r) => ({
      username: r.username,
      note: r.note,
      team: r.team,
      registered: !!r.registered,
      addedAt: r.added_at,
      registeredAt: r.registered_at,
    })),
  });
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);
  if (user.role !== "admin") return errorResponse("forbidden", 403);

  const body = await readJson(request);
  if (!body) return errorResponse("invalid_json", 400);

  const username = (body.username || "").trim();
  const team = body.team;
  const note = (body.note || "").trim();

  if (!username) return errorResponse("username_required", 400);
  if (!team) return errorResponse("team_required", 400);

  const existing = await env.DB.prepare("SELECT username FROM authorized_users WHERE username = ?")
    .bind(username)
    .first();
  if (existing) return errorResponse("already_authorized", 409);

  const addedAt = new Date().toISOString();
  await env.DB.prepare("INSERT INTO authorized_users (username, note, team, registered, added_at) VALUES (?,?,?,0,?)")
    .bind(username, note, team, addedAt)
    .run();

  return json({ ok: true }, 201);
}
