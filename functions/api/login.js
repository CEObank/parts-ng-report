import { json, errorResponse, readJson } from "../_lib/util.js";
import { hashPassword, generateToken } from "../_lib/crypto.js";

const SESSION_DAYS = 30;

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return errorResponse("invalid_json", 400);

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) return errorResponse("missing_fields", 400);

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
  if (!user) return errorResponse("user_not_found", 404);

  const { hash } = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) return errorResponse("wrong_password", 401);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (token, username, expires_at) VALUES (?,?,?)")
    .bind(token, username, expiresAt)
    .run();

  return json({
    token,
    user: { username: user.username, displayName: user.display_name, team: user.team, role: user.role },
  });
}
