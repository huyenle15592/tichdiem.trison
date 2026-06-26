import { supabase } from "@/integrations/supabase/client";

/**
 * Activation date = the created_at of the customer's FIRST point-earning
 * transaction (points_change > 0) AFTER the most recent "expire" reset
 * transaction (if any). Returns null when the customer is currently in a
 * fresh / un-activated cycle.
 */
export async function fetchActivationDate(customerId: string): Promise<string | null> {
  // Cutoff = most recent "expire" (reset) OR "renew" (auto-extend) marker.
  const { data: lastCut } = await supabase
    .from("transactions")
    .select("created_at")
    .eq("customer_id", customerId)
    .in("type", ["expire", "renew"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cutoff = (lastCut?.created_at as string | undefined) ?? null;

  let q = supabase
    .from("transactions")
    .select("created_at")
    .eq("customer_id", customerId)
    .gt("points_change", 0)
    .order("created_at", { ascending: true })
    .limit(1);
  if (cutoff) q = q.gt("created_at", cutoff);
  const { data } = await q.maybeSingle();
  return (data?.created_at as string | undefined) ?? null;
}

export async function fetchActivationDates(
  customerIds: string[],
): Promise<Record<string, string | null>> {
  const map: Record<string, string | null> = {};
  customerIds.forEach((id) => {
    map[id] = null;
  });
  if (customerIds.length === 0) return map;

  // Pull every relevant transaction once (positive earns + expires) and
  // resolve activation in JS so we honor reset cycles without N queries.
  const { data } = await supabase
    .from("transactions")
    .select("customer_id, created_at, points_change, type")
    .in("customer_id", customerIds)
    .order("created_at", { ascending: true });

  const lastCut: Record<string, string> = {};
  (data ?? []).forEach((t: any) => {
    if (t.type === "expire" || t.type === "renew") lastCut[t.customer_id] = t.created_at;
  });
  (data ?? []).forEach((t: any) => {
    if (map[t.customer_id]) return;
    if (t.points_change <= 0) return;
    const cutoff = lastCut[t.customer_id];
    if (cutoff && t.created_at <= cutoff) return;
    map[t.customer_id] = t.created_at;
  });
  return map;
}
