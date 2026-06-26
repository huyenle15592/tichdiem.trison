import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_THRESHOLDS, type TierThresholds } from "@/lib/loyalty";

export function useTierThresholds(): TierThresholds {
  const [t, setT] = useState<TierThresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("tier_settings")
        .select("gold_min,diamond_min")
        .eq("id", "singleton")
        .maybeSingle();
      if (alive && data) {
        setT({
          goldMin: Number((data as any).gold_min) || DEFAULT_THRESHOLDS.goldMin,
          diamondMin: Number((data as any).diamond_min) || DEFAULT_THRESHOLDS.diamondMin,
        });
      }
    };
    load();
    const ch = supabase
      .channel("tier_settings_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tier_settings" },
        () => load(),
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return t;
}
