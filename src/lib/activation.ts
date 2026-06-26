import { supabase } from "@/integrations/supabase/client";

/**
 * Activation date = the created_at of the customer's FIRST point-earning
 * transaction (points_change > 0). Returns null if the customer has never
 * earned points yet.
 */
export async function fetchActivationDate(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("transactions")
    .select("created_at")
    .eq("customer_id", customerId)
    .gt("points_change", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
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
  const { data } = await supabase
    .from("transactions")
    .select("customer_id, created_at")
    .in("customer_id", customerIds)
    .gt("points_change", 0)
    .order("created_at", { ascending: true });
  (data ?? []).forEach((t: { customer_id: string; created_at: string }) => {
    if (!map[t.customer_id]) map[t.customer_id] = t.created_at;
  });
  return map;
}
