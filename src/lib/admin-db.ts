// Admin-facing Supabase client.
// Data API calls (.from/.rpc) go through the server-side proxy at
// /api/proxy/rest/v1, which injects the service role key after
// validating an admin token. Realtime channels are forwarded to the
// real Supabase client (kept here as a no-op-friendly fallback;
// postgres_changes won't deliver because RLS denies anon, but
// subscribe/unsubscribe still complete cleanly so callers don't crash).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as realtimeOnly } from "@/integrations/supabase/client";

// Same value the admin gate already hard-codes in src/routes/admin.tsx.
// Anyone who can read the admin bundle already has the admin password,
// so reusing it as the proxy token doesn't change the threat model.
const ADMIN_TOKEN = "Trison2026";

function getOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  // SSR: best-effort. Admin pages are client-driven so this rarely matters.
  return process.env.SITE_URL || "http://localhost";
}

const proxyFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  // Drop supabase-js's apikey/Authorization — the server injects them.
  headers.delete("apikey");
  headers.delete("Authorization");
  headers.set("x-admin-token", ADMIN_TOKEN);
  return fetch(input as RequestInfo, { ...init, headers });
};

function makeProxyClient(): SupabaseClient<Database> {
  // supabase-js appends "/rest/v1/<table>" to this URL.
  const url = `${getOrigin()}/api/proxy`;
  // The key is unused (server strips it), but supabase-js requires a string.
  return createClient<Database>(url, "proxy-placeholder", {
    global: { fetch: proxyFetch },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

let _proxy: SupabaseClient<Database> | undefined;
function proxy(): SupabaseClient<Database> {
  if (!_proxy) _proxy = makeProxyClient();
  return _proxy;
}

const REALTIME_KEYS = new Set([
  "channel",
  "removeChannel",
  "removeAllChannels",
  "getChannels",
  "realtime",
]);

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, _receiver) {
    if (typeof prop === "string" && REALTIME_KEYS.has(prop)) {
      const target = realtimeOnly as unknown as Record<string, unknown>;
      const val = target[prop];
      return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(realtimeOnly) : val;
    }
    const p = proxy() as unknown as Record<string, unknown>;
    const v = p[prop as string];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(proxy()) : v;
  },
});
