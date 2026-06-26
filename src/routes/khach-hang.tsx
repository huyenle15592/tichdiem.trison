import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles, Gift, Phone, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getTier, formatVnd, normalizePhone, cardWindow } from "@/lib/loyalty";
import { LotusBg } from "@/components/lotus-bg";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { QrScannerModal } from "@/components/qr-scanner";
import { lookupCustomerByPhone } from "@/lib/customer-lookup.functions";
import trisonLogo from "@/assets/trison-logo.jpg.asset.json";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/khach-hang")({
  head: () => ({
    meta: [
      { title: "Tra cứu điểm - Yến sào Trí Sơn" },
      { name: "description", content: "Tra cứu điểm thành viên Yến sào Trí Sơn." },
    ],
  }),
  component: CustomerView,
});

type Customer = { id: string; name: string; phone: string; points: number; created_at: string; activated_at: string | null };
type Reward = { id: string; name: string; description: string | null; points_required: number; image_url: string | null };

function CustomerView() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searched, setSearched] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  async function lookupBy(p: string) {
    if (p.length < 8) {
      toast.error("Số điện thoại / mã QR không hợp lệ");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const [cust, { data: rws }] = await Promise.all([
        lookupCustomerByPhone({ data: { phone: p } }),
        supabase.from("rewards").select("*").eq("active", true).order("points_required"),
      ]);
      setCustomer((cust as Customer) ?? null);
      setRewards((rws as Reward[]) ?? []);
    } catch (err) {
      toast.error("Không thể tra cứu. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    await lookupBy(normalizePhone(phone));
  }

  function handleQrResult(text: string) {
    setQrOpen(false);
    // Accept raw phone, or formats like "tel:0907..." or "trison:phone:0907..."
    const cleaned = text.trim().replace(/^tel:/i, "").replace(/^trison:phone:/i, "");
    const p = normalizePhone(cleaned);
    setPhone(p);
    lookupBy(p);
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header
        className="relative overflow-hidden text-brand-red-foreground"
        style={{ background: "linear-gradient(135deg, var(--brand-red), oklch(0.45 0.2 25))" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-2xl px-5 py-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 shadow-[var(--shadow-card)]">
            <img src={trisonLogo.url} alt="Yến sào Trí Sơn" className="h-16 w-auto md:h-20" />
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Thành viên VIP
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">YẾN SÀO TRÍ SƠN</h1>
          <p className="mt-2 text-base font-medium text-white/95 md:text-lg">
            Hệ thống Tích điểm Thành viên Tri Ân Khách Hàng
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <form onSubmit={lookup} className="rounded-3xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <label className="mb-2 block text-sm font-bold text-brand-navy">Tra cứu điểm thành viên</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại của bạn..."
                className="h-14 rounded-2xl border-2 pl-12 text-base font-semibold"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-14 rounded-2xl bg-brand-navy px-7 text-base font-bold text-brand-navy-foreground hover:bg-brand-navy/90">
              <Search className="mr-2 h-5 w-5" />
              {loading ? "Đang tra..." : "Tra cứu điểm"}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">hoặc</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            onClick={() => setQrOpen(true)}
            variant="outline"
            className="mt-3 h-14 w-full rounded-2xl border-2 border-brand-red/30 text-base font-bold text-brand-red hover:bg-brand-red/5"
          >
            <QrCode className="mr-2 h-5 w-5" /> Quét mã QR thẻ thành viên
          </Button>
        </form>

        <QrScannerModal open={qrOpen} onClose={() => setQrOpen(false)} onResult={handleQrResult} />

        {searched && !loading && !customer && (
          <div className="mt-6 rounded-2xl border border-dashed bg-card p-8 text-center">
            <p className="text-base font-semibold text-foreground">Không tìm thấy thông tin thành viên</p>
            <p className="mt-1 text-sm text-muted-foreground">Vui lòng liên hệ thu ngân để đăng ký thành viên mới.</p>
          </div>
        )}

        {customer && <MemberCard customer={customer} rewards={rewards} />}
      </main>
    </div>
  );
}

type TierTheme = {
  bg: string;
  text: string;
  subtext: string;
  pointsColor: string;
  progressTrack: string;
  progressFill: string;
  logoBg: string;
  lotus: "pink" | "gold" | "silver";
};

const TIER_THEMES: Record<"silver" | "gold" | "diamond", TierTheme> = {
  silver: {
    bg:
      "linear-gradient(135deg, #ffffff 0%, #f1f3f7 45%, #d9dde4 100%)",
    text: "#0a1e3f",
    subtext: "rgba(10, 30, 63, 0.7)",
    pointsColor: "#b8860b",
    progressTrack: "rgba(10, 30, 63, 0.12)",
    progressFill: "linear-gradient(90deg, #b8860b, #f6c945)",
    logoBg: "#ffffff",
    lotus: "pink",
  },
  gold: {
    bg:
      "radial-gradient(ellipse at 30% 30%, #fff2c2 0%, transparent 55%), linear-gradient(135deg, #c9962b 0%, #f6cf64 45%, #a87a2c 100%)",
    text: "#3a1f0a",
    subtext: "rgba(58, 31, 10, 0.78)",
    pointsColor: "#7a1414",
    progressTrack: "rgba(58, 31, 10, 0.18)",
    progressFill: "linear-gradient(90deg, #7a1414, #c9962b)",
    logoBg: "#fff8e3",
    lotus: "pink",
  },
  diamond: {
    bg:
      "radial-gradient(ellipse at 25% 20%, #2a2a2a 0%, transparent 60%), linear-gradient(135deg, #050505 0%, #1a1a1a 50%, #2e2e2e 100%)",
    text: "#f5f5f5",
    subtext: "rgba(245, 245, 245, 0.7)",
    pointsColor: "#e9ecf2",
    progressTrack: "rgba(255, 255, 255, 0.15)",
    progressFill: "linear-gradient(90deg, #ffffff, #cfd3dc)",
    logoBg: "#ffffff",
    lotus: "pink",
  },
};

function MemberCard({ customer, rewards }: { customer: Customer; rewards: Reward[] }) {
  const tier = getTier(customer.points);
  const theme = TIER_THEMES[tier.key];
  const progress = tier.next
    ? Math.min(100, ((customer.points - tier.min) / (tier.next - tier.min)) * 100)
    : 100;
  const remaining = tier.next ? tier.next - customer.points : 0;

  const win = cardWindow(customer.activated_at);
  const memberSince = win.memberSince;
  const validThrough = win.validThrough;
  const activated = win.activated;

  // gold-style sparkle texture for Gold tier
  const goldTexture =
    tier.key === "gold"
      ? {
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.55) 0.6px, transparent 0.7px), radial-gradient(rgba(122,20,20,0.18) 0.5px, transparent 0.6px)",
          backgroundSize: "5px 5px, 9px 9px",
          backgroundPosition: "0 0, 2px 3px",
        }
      : undefined;

  return (
    <div className="mt-6 space-y-6">
      <p className="text-center text-lg font-bold text-brand-navy">
        Xin chào, <span className="text-brand-red">{customer.name}</span> 👋
      </p>

      {/* Lotusmiles-style member card */}
      <div
        className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-card)]"
        style={{ background: theme.bg, color: theme.text, aspectRatio: "1.586 / 1", minHeight: 230 }}
      >
        {/* Gold sparkle overlay */}
        {goldTexture && <div className="absolute inset-0 opacity-60" style={goldTexture} />}
        {/* Lotus motif */}
        <LotusBg tone={theme.lotus} />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-5 md:p-6">
          {/* Top: logo + tier name */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl p-1 shadow-sm md:h-14 md:w-14"
              style={{ background: theme.logoBg }}
            >
              <img src={trisonLogo.url} alt="Trí Sơn" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: theme.subtext, fontFamily: "'Times New Roman', serif" }}>
                Yến Sào
              </div>
              <div className="text-base font-light tracking-[0.2em] md:text-lg" style={{ fontFamily: "'Times New Roman', serif" }}>
                TRÍ SƠN {tier.enName}
              </div>
            </div>
          </div>

          {/* Middle: big points */}
          <div className="-mt-2 text-center md:-mt-4">
            <div
              className="font-bold leading-none"
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: "clamp(3rem, 13vw, 5.5rem)",
                color: theme.pointsColor,
                textShadow:
                  tier.key === "diamond"
                    ? "0 1px 0 rgba(255,255,255,0.25)"
                    : "0 1px 0 rgba(255,255,255,0.35)",
                letterSpacing: "0.02em",
              }}
            >
              {customer.points}
            </div>
            <div
              className="mt-1 text-xs font-semibold tracking-[0.4em] md:text-sm"
              style={{ color: theme.subtext, fontFamily: "'Times New Roman', serif" }}
            >
              ĐIỂM
            </div>
            {/* faint progress bar */}
            <div className="mx-auto mt-3 h-1 w-3/4 overflow-hidden rounded-full" style={{ background: theme.progressTrack }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: theme.progressFill }} />
            </div>
          </div>

          {/* Bottom: dates + name */}
          <div>
            <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-[10px] tracking-[0.18em] md:text-xs" style={{ color: theme.subtext, fontFamily: "'Times New Roman', serif" }}>
              <span>MEMBER SINCE: <span className="font-semibold" style={{ color: theme.text }}>{memberSince}</span></span>
              <span>VALID THROUGH: <span className="font-semibold" style={{ color: theme.text }}>{validThrough}</span></span>
            </div>
            <div
              className="mt-1 truncate text-lg font-semibold uppercase tracking-[0.15em] md:text-2xl"
              style={{ fontFamily: "'Times New Roman', serif", color: theme.text }}
            >
              {customer.name}
            </div>
          </div>
        </div>
      </div>

      {/* Progress / tier-up panel */}
      <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        {tier.next ? (
          <>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                Tiến trình lên hạng {tier.next === 50 ? "Vàng" : "Kim Cương"}
              </span>
              <span className="text-sm font-bold text-brand-red">còn {remaining} điểm</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
              <span>{tier.min} điểm</span>
              <span>{tier.next} điểm</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tương đương mức chi tiêu {formatVnd(customer.points * 100000)}
            </p>
          </>
        ) : (
          <p className="text-center text-sm font-bold text-brand-navy">🎉 Bạn đã đạt hạng cao nhất - Kim Cương!</p>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-5 text-center shadow-[var(--shadow-soft)]">
        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-navy">
          Mã QR thẻ thành viên
        </div>
        <div className="mx-auto inline-block rounded-2xl bg-white p-4 ring-1 ring-border">
          <QRCodeSVG
            value={`trison:phone:${customer.phone}`}
            size={180}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a1e3f"
          />
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Đưa mã này cho nhân viên quét tại quầy để tích / đổi điểm.
        </p>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-brand-navy">
          <Gift className="h-5 w-5 text-brand-red" /> Đổi quà ưu đãi
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rewards.map((r) => {
            const enough = customer.points >= r.points_required;
            return (
              <div key={r.id} className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
                {r.image_url ? (
                  <div className="h-36 overflow-hidden bg-muted">
                    <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-5xl" style={{ background: "linear-gradient(135deg, oklch(0.95 0.03 27), oklch(0.96 0.04 60))" }}>
                    🎁
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold leading-tight text-foreground">{r.name}</h3>
                  {r.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                  <div className="mt-2 text-sm font-bold text-brand-navy">Cần {r.points_required} điểm</div>
                  {enough ? (
                    <div className="mt-3 rounded-xl bg-success px-3 py-2 text-center text-sm font-bold text-success-foreground">
                      ✓ Đủ điểm đổi quà
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-muted px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
                      Còn thiếu {r.points_required - customer.points} điểm
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
