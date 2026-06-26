import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ phone: z.string().min(8).max(20) });

export const lookupCustomerByPhone = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("customers")
      .select("id, name, phone, points, created_at")
      .eq("phone", data.phone)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    // Find the FIRST point-earning transaction (activation date).
    const { data: firstAdd } = await supabaseAdmin
      .from("transactions")
      .select("created_at")
      .eq("customer_id", row.id)
      .gt("points_change", 0)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      ...row,
      activated_at: (firstAdd?.created_at as string | undefined) ?? null,
    };
  });
