// Worker entry point (Cloudflare Workers + static assets)
// Cloudflare's dashboard "Create application" flow now deploys everything as a
// Worker (not classic Pages), so this file replaces automatic Pages Functions
// file-based routing. It simply routes /api/* to the same handler modules that
// used to live under functions/api/*, and lets everything else fall through to
// the static assets binding (which serves public/index.html).

import * as register from "../functions/api/register.js";
import * as login from "../functions/api/login.js";
import * as logout from "../functions/api/logout.js";
import * as me from "../functions/api/me.js";
import * as reportsIndex from "../functions/api/reports/index.js";
import * as reportsId from "../functions/api/reports/[id].js";
import * as usersIndex from "../functions/api/users/index.js";
import * as usersUsername from "../functions/api/users/[username].js";
import * as authorizedIndex from "../functions/api/authorized/index.js";
import * as authorizedUsername from "../functions/api/authorized/[username].js";

function notFound() {
  return new Response(JSON.stringify({ error: "not_found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path.startsWith("/api/")) {
      try {
        let m;

        if (path === "/api/register" && method === "POST") {
          return await register.onRequestPost({ request, env });
        }
        if (path === "/api/login" && method === "POST") {
          return await login.onRequestPost({ request, env });
        }
        if (path === "/api/logout" && method === "POST") {
          return await logout.onRequestPost({ request, env });
        }
        if (path === "/api/me" && method === "GET") {
          return await me.onRequestGet({ request, env });
        }
        if (path === "/api/reports" && method === "GET") {
          return await reportsIndex.onRequestGet({ request, env });
        }
        if (path === "/api/reports" && method === "POST") {
          return await reportsIndex.onRequestPost({ request, env });
        }
        if ((m = path.match(/^\/api\/reports\/([^/]+)$/)) && method === "DELETE") {
          return await reportsId.onRequestDelete({
            request,
            env,
            params: { id: decodeURIComponent(m[1]) },
          });
        }
        if (path === "/api/users" && method === "GET") {
          return await usersIndex.onRequestGet({ request, env });
        }
        if ((m = path.match(/^\/api\/users\/([^/]+)$/)) && method === "DELETE") {
          return await usersUsername.onRequestDelete({
            request,
            env,
            params: { username: decodeURIComponent(m[1]) },
          });
        }
        if (path === "/api/authorized" && method === "GET") {
          return await authorizedIndex.onRequestGet({ request, env });
        }
        if (path === "/api/authorized" && method === "POST") {
          return await authorizedIndex.onRequestPost({ request, env });
        }
        if ((m = path.match(/^\/api\/authorized\/([^/]+)$/)) && method === "DELETE") {
          return await authorizedUsername.onRequestDelete({
            request,
            env,
            params: { username: decodeURIComponent(m[1]) },
          });
        }

        return notFound();
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "server_error", message: String((err && err.message) || err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Not an API route: serve static assets (public/index.html, etc.)
    return env.ASSETS.fetch(request);
  },
};
