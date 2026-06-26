// Admin Data API proxy.
// Forwards PostgREST requests to Supabase using the service role key,
// gated by an admin token. This lets the admin client keep its
// supabase-js shape while the database itself is locked down to
// anon/authenticated (no Data API access).
import { createFileRoute } from "@tanstack/react-router";

const FORWARD_HEADERS = new Set([
  "content-type",
  "accept",
  "accept-encoding",
  "accept-profile",
  "content-profile",
  "prefer",
  "range",
  "range-unit",
  "x-client-info",
]);

async function handle({ request, params }: { request: Request; params: { _splat: string } }) {
  const expected = process.env.ADMIN_API_TOKEN || "Trison2026";
  const token = request.headers.get("x-admin-token");
  if (!token || token !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const url = new URL(request.url);
  const target = `${supabaseUrl}/rest/v1/${params._splat ?? ""}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (FORWARD_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const respHeaders = new Headers();
  res.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (key === "content-encoding" || key === "transfer-encoding") return;
    respHeaders.set(k, v);
  });
  return new Response(res.body, { status: res.status, headers: respHeaders });
}

export const Route = createFileRoute("/api/proxy/rest/v1/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PATCH: handle,
      PUT: handle,
      DELETE: handle,
      HEAD: handle,
    },
  },
});
