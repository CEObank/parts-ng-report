import { json, errorResponse, readJson } from "../../_lib/util.js";
import { getSessionUser } from "../../_lib/auth.js";

function toReportJson(row) {
  return {
    id: row.id,
    reporter: row.reporter,
    team: row.team,
    reportDate: row.report_date,
    workOrderNo: row.work_order_no,
    productionNo: row.production_no,
    partNo: row.part_no,
    partName: row.part_name,
    quantity: row.quantity,
    status: row.status,
    detail: row.detail,
    photoDataUrl: row.photo_data_url,
    createdAt: row.created_at,
  };
}

// Any logged-in user can view all reports (the dashboard aggregates every
// line), but only their own Team's reports can be created (enforced below).
export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);

  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  const stmt = date
    ? env.DB.prepare("SELECT * FROM reports WHERE report_date = ? ORDER BY created_at DESC").bind(date)
    : env.DB.prepare("SELECT * FROM reports ORDER BY created_at DESC");

  const { results } = await stmt.all();
  return json({ reports: results.map(toReportJson) });
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return errorResponse("unauthorized", 401);

  const body = await readJson(request);
  if (!body) return errorResponse("invalid_json", 400);

  const team = body.team;
  const reportDate = body.reportDate;
  const quantity = parseInt(body.quantity, 10);
  const status = body.status;

  if (!team || !reportDate || !status || !quantity || quantity < 1) {
    return errorResponse("missing_fields", 400);
  }

  // D1 rejects any single column value larger than ~2,000,000 bytes. Guard
  // here with a safety margin so a giant photo fails with a clear, translated
  // error instead of an opaque 500.
  if (body.photoDataUrl && body.photoDataUrl.length > 1_800_000) {
    return errorResponse("photo_too_large", 413);
  }

  // Server-side enforcement: non-admins may only file reports for their own Team,
  // regardless of what the client sends.
  if (user.role !== "admin" && team !== user.team) {
    return errorResponse("team_mismatch", 403);
  }

  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO reports
     (reporter, team, report_date, work_order_no, production_no, part_no, part_name, quantity, status, detail, photo_data_url, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      user.displayName, // reporter is always the authenticated user, never client-supplied
      team,
      reportDate,
      body.workOrderNo || "",
      body.productionNo || "",
      body.partNo || "",
      body.partName || "",
      quantity,
      status,
      body.detail || "",
      body.photoDataUrl || "",
      createdAt
    )
    .run();

  return json({ id: result.meta.last_row_id, createdAt }, 201);
}
