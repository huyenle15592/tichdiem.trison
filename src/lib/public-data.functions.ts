// Public, read-only server functions for the customer-facing page.
// These run on the server using the service role key and only return
// columns that are safe to show to anyone (no birth_date, no per-customer
// transaction history). The customer page calls these instead of hitting
// the database directly — anon can no longer read public.* tables.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lookupSchema = z.object({ query: z.string().min(2).max(80) });

function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Mirror the (very simple) normalization the client used: keep digits only.
  return digits;
}

export const getCustomerView = createServerFn({ method: "POST" })
  .inputValidator((data) => lookupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.query.trim();
    const phone = normalizePhone(q);
    const safe = q.replace(/[,()]/g, " ");

    // Try phone match first (cheap, indexed-like), then fall back to a
    // case-insensitive name search. Only ever returns one row.
    let row: { id: string; name: string; phone: string; points: number; created_at: string } | null = null;
    if (phone) {
      const { data: byPhone } = await supabaseAdmin
        .from("customers")
        .select("id, name, phone, points, created_at")
        .eq("phone", phone)
        .maybeSingle();
      row = byPhone ?? null;
    }
    if (!row) {
      const { data: byName } = await supabaseAdmin
        .from("customers")
        .select("id, name, phone, points, created_at")
        .ilike("name", `%${safe}%`)
        .limit(1);
      row = byName?.[0] ?? null;
    }

    let activated_at: string | null = null;
    let expired = false;
    let points = row?.points ?? 0;

    if (row) {
      // Resolve activation date (first positive tx after the most recent
      // expire/renew marker) and auto-expire if the card has been quiet
      // for > 1 year. Logic kept identical to the previous client-side
      // implementation, just executed on the server with service role.
      const { data: lastCut } = await supabaseAdmin
        .from("transactions")
        .select("created_at")
        .eq("customer_id", row.id)
        .in("type", ["expire", "renew"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const cutoff = (lastCut?.created_at as string | undefined) ?? null;

      let firstAddQ = supabaseAdmin
        .from("transactions")
        .select("created_at")
        .eq("customer_id", row.id)
        .gt("points_change", 0)
        .order("created_at", { ascending: true })
        .limit(1);
      if (cutoff) firstAddQ = firstAddQ.gt("created_at", cutoff);
      const { data: firstAdd } = await firstAddQ.maybeSingle();
      activated_at = (firstAdd?.created_at as string | undefined) ?? null;

      if (activated_at) {
        const exp = new Date(activated_at);
        exp.setFullYear(exp.getFullYear() + 1);
        if (exp.getTime() <= Date.now()) {
          // Card cycle elapsed — reset to a fresh cycle.
          await supabaseAdmin.from("transactions").insert({
            customer_id: row.id,
            points_change: -Math.max(0, points),
            type: "expire",
            reason: "Tự động hết hạn thẻ thành viên (1 năm) - reset chu kỳ mới",
            staff_name: "Hệ thống",
          });
          await supabaseAdmin.from("customers").update({ points: 0 }).eq("id", row.id);
          points = 0;
          activated_at = null;
          expired = true;
        }
      }
    }

    const { data: rewards } = await supabaseAdmin
      .from("rewards")
      .select("id, name, code, description, points_required, image_url")
      .eq("active", true)
      .order("points_required");

    let recentTransactions: Array<{
      id: string;
      created_at: string;
      points_change: number;
      type: string;
      reason: string | null;
    }> = [];
    if (row) {
      const { data: txs } = await supabaseAdmin
        .from("transactions")
        .select("id, created_at, points_change, type, reason")
        .eq("customer_id", row.id)
        .in("type", ["add", "redeem"])
        .order("created_at", { ascending: false })
        .limit(3);
      recentTransactions = (txs ?? []) as typeof recentTransactions;
    }

    return {
      customer: row ? { id: row.id, name: row.name, phone: row.phone, points, created_at: row.created_at, activated_at } : null,
      rewards: rewards ?? [],
      expired,
      recentTransactions,
    };
  });


export const getTierSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("tier_settings")
    .select("gold_min, diamond_min")
    .eq("id", "singleton")
    .maybeSingle();
  return {
    gold_min: Number(data?.gold_min ?? 50),
    diamond_min: Number(data?.diamond_min ?? 200),
  };
});
