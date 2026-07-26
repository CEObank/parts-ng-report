import { json, errorResponse } from "../_lib/util.js";
import { getSessionUser } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);
  return json({ user });
}
