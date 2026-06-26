// Reads tier thresholds via a public server function so the customer
// page works without the admin token (the database itself blocks anon).
// Realtime sync was removed — tier thresholds change rarely and the
// admin page reloads them on save.
import { useEffect, useState } from "react";
import { DEFAULT_THRESHOLDS, type TierThresholds } from "@/lib/loyalty";
import { getTierSettings } from "@/lib/public-data.functions";

export function useTierThresholds(): TierThresholds {
  const [t, setT] = useState<TierThresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    let alive = true;
    getTierSettings()
      .then((data) => {
        if (!alive || !data) return;
        setT({
          goldMin: Number(data.gold_min) || DEFAULT_THRESHOLDS.goldMin,
          diamondMin: Number(data.diamond_min) || DEFAULT_THRESHOLDS.diamondMin,
        });
      })
      .catch(() => {
        /* keep defaults on failure */
      });
    return () => {
      alive = false;
    };
  }, []);

  return t;
}
