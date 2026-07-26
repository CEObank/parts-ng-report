import { json, errorResponse, readJson } from "../_lib/util.js";
import { hashPassword, generateToken } from "../_lib/crypto.js";

const SESSION_DAYS = 30;

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return errorResponse("invalid_json", 400);

  const username = (body.username || "").trim();
  const password = body.password || "";
  const displayName = (body.displayName || "").trim();

  if (!username || !password || !displayName) return errorResponse("missing_fields", 400);
  if (password.length < 4) return errorResponse("password_too_short", 400);

  const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(username).first();
  if (existing) return errorResponse("username_taken", 409);

  const countRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM users").first();
  const count = countRow.c;

  let team = "";
  let role = "admin";

  if (count > 0) {
    // Every registration after the bootstrap admin must already be on the
    // authorized list, and the Team always comes from that record -
    // never from anything the registering user submits themselves.
    const authRecord = await env.DB.prepare("SELECT * FROM authorized_users WHERE username = ?")
      .bind(username)
      .first();
    if (!authRecord) return errorResponse("not_authorized", 403);
    team = authRecord.team || "";
    role = "user";
  }

  const { hash, salt } = await hashPassword(password);
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO users (username, password_hash, salt, display_name, team, role, created_at) VALUES (?,?,?,?,?,?,?)"
  )
    .bind(username, hash, salt, displayName, team, role, createdAt)
    .run();

  if (count > 0) {
    await env.DB.prepare("UPDATE authorized_users SET registered = 1, registered_at = ? WHERE username = ?")
      .bind(createdAt, username)
      .run();
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (token, username, expires_at) VALUES (?,?,?)")
    .bind(token, username, expiresAt)
    .run();

  return json({ token, user: { username, displayName, team, role } }, 201);
}
