export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(code, status = 400) {
  return json({ error: code }, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}
