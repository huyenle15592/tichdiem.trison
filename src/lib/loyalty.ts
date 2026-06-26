export type TierKey = "silver" | "gold" | "diamond";

export type Tier = {
  key: TierKey;
  name: string;
  enName: string;
  min: number;
  next: number | null;
};

export function getTier(points: number): Tier {
  if (points >= 200) {
    return { key: "diamond", name: "Kim Cương", enName: "DIAMOND", min: 200, next: null };
  }
  if (points >= 50) {
    return { key: "gold", name: "Vàng", enName: "GOLD", min: 50, next: 200 };
  }
  return { key: "silver", name: "Bạc", enName: "SILVER", min: 0, next: 50 };
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
