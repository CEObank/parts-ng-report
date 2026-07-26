import { json, errorResponse } from "../../_lib/util.js";
import { getSessionUser } from "../../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);
  if (user.role !== "admin") return errorResponse("forbidden", 403);

  await env.DB.prepare("DELETE FROM authorized_users WHERE username = ?").bind(params.username).run();
  return json({ ok: true });
}
