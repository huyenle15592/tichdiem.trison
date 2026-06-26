import { supabase } from "@/integrations/supabase/client";
import { addOneYearIso } from "./loyalty";
import { fetchActivationDate, fetchActivationDates } from "./activation";

export type ExpiryCheckResult = {
  expired: boolean;
  activatedAt: string | null;
  points: number;
};

/**
 * If the customer's "Valid Through" (activation + 1 year) is in the past,
 * automatically reset their points to 0 and record an "expire" transaction
 * so the next add starts a brand-new cycle.
 */
export async function autoExpireCustomer(customer: {
  id: string;
  points: number;
}): Promise<ExpiryCheckResult> {
  const activatedAt = await fetchActivationDate(customer.id);
  if (!activatedAt) {
    return { expired: false, activatedAt: null, points: customer.points };
  }
  const expIso = addOneYearIso(activatedAt);
  if (!expIso || new Date(expIso).getTime() > Date.now()) {
    return { expired: false, activatedAt, points: customer.points };
  }

  // Expired -> mark a reset boundary, then zero out points.
  await supabase.from("transactions").insert({
    customer_id: customer.id,
    points_change: -Math.max(0, customer.points),
    type: "expire",
    reason: "Tự động hết hạn thẻ thành viên (1 năm) - reset chu kỳ mới",
    staff_name: "Hệ thống",
  });
  await supabase.from("customers").update({ points: 0 }).eq("id", customer.id);
  return { expired: true, activatedAt: null, points: 0 };
}

export type ExpiringSoon = {
  id: string;
  name: string;
  phone: string;
  points: number;
  validThrough: string;
  daysLeft: number;
};

/** Lists customers whose card expires within `daysAhead` days. */
export async function fetchExpiringSoon(daysAhead = 30): Promise<ExpiringSoon[]> {
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone, points");
  const list = (customers as Array<{ id: string; name: string; phone: string; points: number }>) ?? [];
  if (list.length === 0) return [];

  const acts = await fetchActivationDates(list.map((c) => c.id));
  const now = Date.now();
  const out: ExpiringSoon[] = [];
  for (const c of list) {
    const act = acts[c.id];
    if (!act) continue;
    const expIso = addOneYearIso(act);
    if (!expIso) continue;
    const daysLeft = Math.ceil((new Date(expIso).getTime() - now) / 86400000);
    if (daysLeft >= 0 && daysLeft <= daysAhead) {
      out.push({ ...c, validThrough: expIso, daysLeft });
    }
  }
  out.sort((a, b) => a.daysLeft - b.daysLeft);
  return out;
}
