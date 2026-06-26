export type TierKey = "silver" | "gold" | "diamond";

export type Tier = {
  key: TierKey;
  name: string;
  enName: string;
  min: number;
  next: number | null;
};

export type TierThresholds = {
  goldMin: number;
  diamondMin: number;
};

export const DEFAULT_THRESHOLDS: TierThresholds = { goldMin: 50, diamondMin: 200 };

export function getTier(points: number, thresholds: TierThresholds = DEFAULT_THRESHOLDS): Tier {
  const goldMin = Math.max(1, thresholds.goldMin);
  const diamondMin = Math.max(goldMin + 1, thresholds.diamondMin);
  if (points >= diamondMin) {
    return { key: "diamond", name: "Kim Cương", enName: "DIAMOND", min: diamondMin, next: null };
  }
  if (points >= goldMin) {
    return { key: "gold", name: "Vàng", enName: "GOLD", min: goldMin, next: diamondMin };
  }
  return { key: "silver", name: "Bạc", enName: "SILVER", min: 0, next: goldMin };
}


export const formatVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "đ";

export const normalizePhone = (raw: string) =>
  raw.replace(/[^0-9]/g, "");

export function formatVnDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // try YYYY-MM-DD
    const [y, m, day] = String(iso).split("-");
    if (y && m && day) return `${day}/${m}/${y}`;
    return "—";
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function addOneYearIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export type CardWindow = {
  activated: boolean;
  memberSince: string;
  validThrough: string;
};

export function cardWindow(activatedAt: string | null | undefined): CardWindow {
  if (!activatedAt) {
    return {
      activated: false,
      memberSince: "Chưa kích hoạt",
      validThrough: "Kích hoạt sau lần tích điểm đầu tiên",
    };
  }
  return {
    activated: true,
    memberSince: formatVnDate(activatedAt),
    validThrough: formatVnDate(addOneYearIso(activatedAt)),
  };
}
