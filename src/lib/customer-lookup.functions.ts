import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ phone: z.string().min(8).max(20) });

export const lookupCustomerByPhone = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("customers")
      .select("id, name, phone, points")
      .eq("phone", data.phone)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
