// Resolves the currently authenticated user (or null) from the Bearer token
// on the request, by joining the sessions table to users in D1.
export async function getSessionUser(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT u.username, u.display_name, u.team, u.role
     FROM sessions s
     JOIN users u ON u.username = s.username
     WHERE s.token = ? AND s.expires_at > ?`
  )
    .bind(token, now)
    .first();

  if (!row) return null;
  return { username: row.username, displayName: row.display_name, team: row.team, role: row.role };
}
