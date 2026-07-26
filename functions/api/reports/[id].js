import { json, errorResponse } from "../../_lib/util.js";
import { getSessionUser } from "../../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);

  const id = parseInt(params.id, 10);
  if (!id) return errorResponse("invalid_id", 400);

  await env.DB.prepare("DELETE FROM reports WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
