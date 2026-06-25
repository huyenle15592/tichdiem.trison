export type Tier = {
  name: string;
  min: number;
  next: number | null;
  gradient: string;
  text: string;
  accent: string;
};

export function getTier(points: number): Tier {
  if (points >= 200) {
    return {
      name: "Kim Cương",
      min: 200,
      next: null,
      gradient: "linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 45%, #4a4a4a 100%)",
      text: "#ffffff",
      accent: "#d4af37",
    };
  }
  if (points >= 50) {
    return {
      name: "Vàng",
      min: 50,
      next: 200,
      gradient: "linear-gradient(135deg, #b8860b 0%, #f6c945 50%, #d4af37 100%)",
      text: "#1a1a1a",
      accent: "#7c5a00",
    };
  }
  return {
    name: "Bạc",
    min: 0,
    next: 50,
    gradient: "linear-gradient(135deg, #8a8e96 0%, #d8dce2 50%, #a7adb5 100%)",
    text: "#1a1a1a",
    accent: "#3a3f47",
  };
}

export const formatVnd = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "đ";

export const normalizePhone = (raw: string) =>
  raw.replace(/[^0-9]/g, "");
