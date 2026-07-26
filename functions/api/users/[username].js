import { json, errorResponse } from "../../_lib/util.js";
import { getSessionUser } from "../../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);
  if (user.role !== "admin") return errorResponse("forbidden", 403);

  const target = params.username;
  if (target === user.username) return errorResponse("cannot_delete_self", 400);

  await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(target).run();
  await env.DB.prepare("DELETE FROM sessions WHERE username = ?").bind(target).run();
  return json({ ok: true });
}
