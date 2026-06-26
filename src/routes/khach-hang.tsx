import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Gift, Phone, Download, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getTier, formatVnd, normalizePhone, cardWindow } from "@/lib/loyalty";
import { LotusBg } from "@/components/lotus-bg";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";


import trisonLogo from "@/assets/trison-logo.png.asset.json";
import { LotusScene } from "@/components/lotus-scene";
import lotusCardImg from "@/assets/lotus-card.png.asset.json";
import { QRCodeSVG } from "qrcode.react";
import { useTierThresholds } from "@/lib/use-tier-thresholds";
import { autoExpireCustomer } from "@/lib/expiry";
import { fetchActivationDate } from "@/lib/activation";


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
type Reward = { id: string; name: string; code: string | null; description: string | null; points_required: number; image_url: string | null };

function CustomerView() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searched, setSearched] = useState(false);

  // Realtime: làm mới danh sách quà khi admin chỉnh sửa
  useEffect(() => {
    if (!customer) return;
    const channel = supabase
      .channel("rewards-customer")
      .on("postgres_changes", { event: "*", schema: "public", table: "rewards" }, async () => {
        const { data } = await supabase.from("rewards").select("*").eq("active", true).order("points_required");
        setRewards((data as Reward[]) ?? []);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer]);

  // Realtime: lắng nghe thay đổi điểm của chính khách hàng (đổi quà, cộng điểm)
  useEffect(() => {
    if (!customer) return;
    const channel = supabase
      .channel(`customer-${customer.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customers", filter: `id=eq.${customer.id}` },
        (payload) => {
          const next = payload.new as { points: number; name: string; phone: string };
          setCustomer((prev) => (prev ? { ...prev, points: next.points, name: next.name, phone: next.phone } : prev));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id]);



  async function lookupBy(raw: string) {
    const q = raw.trim();
    if (q.length < 2) {
      toast.error("Vui lòng nhập số điện thoại hoặc họ tên");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const digits = q.replace(/\D/g, "");
      const phoneCandidate = digits.length >= 8 ? normalizePhone(q) : null;

      // Build OR filter: match phone OR name (case-insensitive contains)
      const safe = q.replace(/[,()]/g, " ");
      const orParts: string[] = [`name.ilike.%${safe}%`];
      if (phoneCandidate) orParts.unshift(`phone.eq.${phoneCandidate}`);

      const [{ data: custRows, error: custErr }, { data: rws }] = await Promise.all([
        supabase
          .from("customers")
          .select("id, name, phone, points, created_at")
          .or(orParts.join(","))
          .limit(1),
        supabase.from("rewards").select("*").eq("active", true).order("points_required"),
      ]);
      if (custErr) throw custErr;

      const row = (custRows && custRows[0]) || null;
      let cust: Customer | null = null;
      if (row) {
        // Auto-expire nếu thẻ đã quá hạn 1 năm
        const exp = await autoExpireCustomer({ id: row.id, points: row.points });
        const activatedAt = exp.expired ? null : await fetchActivationDate(row.id);
        if (exp.expired) {
          toast.message("Thẻ thành viên đã hết hạn chu kỳ 1 năm và được kích hoạt lại.", {
            description: "Số điểm đã đặt về 0. Hãy tích điểm để bắt đầu chu kỳ mới.",
          });
        }
        cust = { ...(row as any), points: exp.points, activated_at: activatedAt };
      }
      setCustomer(cust);
      setRewards((rws as Reward[]) ?? []);
      if (cust) {
        setTimeout(() => {
          document.getElementById("member-card-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    } catch (err) {
      toast.error("Không thể tra cứu. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    await lookupBy(query);
  }



  return (
    <div className="relative min-h-screen bg-transparent">
      <LotusScene />
      <Toaster position="top-center" richColors />

      <header
        className="relative overflow-hidden text-brand-red-foreground"
        style={{ background: "linear-gradient(135deg, var(--brand-red), oklch(0.45 0.2 25))" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-2xl px-5 py-8 text-center">
          <img
            src={trisonLogo.url}
            alt="Yến sào Trí Sơn"
            className="mx-auto h-16 w-auto md:h-20 drop-shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
          />
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">YẾN SÀO TRÍ SƠN</h1>
          <p className="mt-2 text-base font-medium text-white/95 md:text-lg">
            Hệ thống Tích điểm Thành viên Tri Ân Khách Hàng
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10 lg:max-w-5xl">
        {!customer && (
          <form onSubmit={lookup} className="rounded-3xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <label className="mb-2 block text-sm font-bold text-brand-navy">Tra cứu điểm thành viên</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập Số điện thoại HOẶC Họ và tên của bạn..."
                  className="h-14 rounded-2xl border-2 pl-12 text-base font-semibold"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-14 rounded-2xl bg-brand-navy px-7 text-base font-bold text-brand-navy-foreground hover:bg-brand-navy/90">
                <Search className="mr-2 h-5 w-5" />
                {loading ? "Đang tra..." : "Tra cứu điểm"}
              </Button>
            </div>
          </form>
        )}


        {searched && !loading && !customer && (
          <div className="mt-6 rounded-2xl border border-dashed bg-card p-8 text-center">
            <p className="text-base font-semibold text-foreground">Không tìm thấy thông tin thành viên</p>
            <p className="mt-1 text-sm text-muted-foreground">Vui lòng liên hệ thu ngân để đăng ký thành viên mới.</p>
          </div>
        )}

        {customer && (
          <div id="member-card-anchor">
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setCustomer(null); setSearched(false); setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-sm font-semibold text-brand-navy hover:bg-brand-navy/10"
              >
                ← Tra cứu khách khác
              </Button>
            </div>
            <MemberCard customer={customer} rewards={rewards} />
          </div>
        )}
      </main>
    </div>
  );
}

const GOLD_METALLIC = {
  fontFamily: "'Times New Roman', serif",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  backgroundImage:
    "linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
  letterSpacing: "0.08em",
};

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
    subtext: "rgba(10, 30, 63, 0.78)",
    pointsColor: "#0a1e3f",
    progressTrack: "rgba(10, 30, 63, 0.15)",
    progressFill: "linear-gradient(90deg, #0a1e3f, #1e3a8a)",
    logoBg: "#ffffff",
    lotus: "pink",
  },
  gold: {
    bg:
      "radial-gradient(ellipse at 30% 30%, #fff2c2 0%, transparent 55%), linear-gradient(135deg, #c9962b 0%, #f6cf64 45%, #a87a2c 100%)",
    text: "#0a1e3f",
    subtext: "rgba(10, 30, 63, 0.82)",
    pointsColor: "#0a1e3f",
    progressTrack: "rgba(10, 30, 63, 0.2)",
    progressFill: "linear-gradient(90deg, #0a1e3f, #7a1414)",
    logoBg: "#fff8e3",
    lotus: "pink",
  },
  diamond: {
    bg:
      "radial-gradient(ellipse at 25% 20%, #2a2a2a 0%, transparent 60%), linear-gradient(135deg, #050505 0%, #1a1a1a 50%, #2e2e2e 100%)",
    text: "#ffffff",
    subtext: "rgba(245, 245, 245, 0.78)",
    pointsColor: "#ffffff",
    progressTrack: "rgba(255, 255, 255, 0.18)",
    progressFill: "linear-gradient(90deg, #ffffff, #cfd3dc)",
    logoBg: "#ffffff",
    lotus: "pink",
  },
};


function MemberCard({ customer, rewards }: { customer: Customer; rewards: Reward[] }) {
  const thresholds = useTierThresholds();
  const tier = getTier(customer.points, thresholds);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [redeemReward, setRedeemReward] = useState<Reward | null>(null);

  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) { toast.error("Không tạo được mã QR"); return; }
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const img = new Image();
    img.onload = () => {
      const size = 720;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 40, 40, size - 80, size - 80);
      c.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tri-son-qr-${customer.phone}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast.success("Đã tải mã QR về máy");
      }, "image/png");
    };
    img.onerror = () => toast.error("Không tải được mã QR");
    img.src = `data:image/svg+xml;base64,${svg64}`;
  }


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
        className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl shadow-[var(--shadow-card)]"
        style={{ background: theme.bg, color: theme.text, aspectRatio: "1.586 / 1", minHeight: 230 }}
      >
        {/* Real lotus photo decoration — bottom-right, larger spread */}
        <img
          src={lotusCardImg.url}
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 z-0 h-auto w-[55%] max-w-[280px] select-none object-contain"
          style={{
            mixBlendMode: tier.key === "diamond" ? "screen" : "multiply",
            opacity: tier.key === "diamond" ? 0.4 : tier.key === "gold" ? 0.5 : 0.55,
            transform: "translate(14%, 18%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-5 md:p-6">
          {/* Top row: logo top-left, brand title centered */}
          <div className="relative flex items-center justify-center">
            <div className="absolute left-0 top-0 flex h-[4.5rem] w-[4.5rem] items-center justify-center md:h-[5.5rem] md:w-[5.5rem]">
              <img
                src={trisonLogo.url}
                alt="Trí Sơn"
                className="h-full w-full object-contain"
                style={{ filter: "none", boxShadow: "none", border: "none" }}
              />
            </div>
            <div
              className="text-center text-xl font-extrabold uppercase tracking-[0.18em] md:text-3xl"
              style={{
                color: theme.text,
                fontFamily: "'Times New Roman', serif",
                textShadow: tier.key === "diamond" ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
              }}
            >
              YẾN SÀO TRÍ SƠN
              <div className="mt-0.5 text-base font-bold tracking-[0.3em] md:text-xl" style={{ color: theme.text }}>
                {tier.enName.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Middle: big points */}
          <div className="my-auto text-center">
            <div
              className="font-extrabold leading-none"
              style={{
                color: theme.pointsColor,
                fontFamily: "'Times New Roman', serif",
                fontSize: "clamp(3rem, 13vw, 5.5rem)",
                letterSpacing: "0.02em",
                textShadow: tier.key === "diamond" ? "0 2px 4px rgba(0,0,0,0.5)" : "none",
              }}
            >
              {customer.points}
            </div>
            <div
              className="mt-1 text-xs font-bold tracking-[0.4em] md:text-sm"
              style={{ color: theme.text, fontFamily: "'Times New Roman', serif" }}
            >
              ĐIỂM
            </div>
            <div className="mx-auto mt-3 h-1 w-3/4 overflow-hidden rounded-full" style={{ background: theme.progressTrack }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: theme.progressFill }} />
            </div>
          </div>

          {/* Bottom-left: dates + customer name */}
          <div className="max-w-[70%]">
            {activated ? (
              <div className="flex flex-col gap-0.5 text-[10px] font-semibold tracking-[0.18em] md:text-xs" style={{ color: theme.subtext, fontFamily: "'Times New Roman', serif" }}>
                <span>MEMBER SINCE: <span className="font-bold" style={{ color: theme.text }}>{memberSince}</span></span>
                <span>VALID THROUGH: <span className="font-bold" style={{ color: theme.text }}>{validThrough}</span></span>
              </div>
            ) : (
              <div
                className="text-[11px] font-semibold italic tracking-[0.15em] md:text-xs"
                style={{ color: theme.subtext, fontFamily: "'Times New Roman', serif" }}
              >
                Kích hoạt chu kỳ mới sau lần tích điểm kế tiếp
              </div>
            )}
            <div
              className="mt-1 truncate text-lg font-extrabold uppercase tracking-[0.15em] md:text-2xl"
              style={{
                color: theme.text,
                fontFamily: "'Times New Roman', serif",
                textShadow: tier.key === "diamond" ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
              }}
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
                Tiến trình lên hạng {tier.key === "silver" ? "Vàng" : "Kim Cương"}
              </span>
              <span className="text-sm font-bold text-brand-red">còn {remaining} điểm</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
              <span>{tier.min} điểm</span>
              <span>{tier.next} điểm</span>
            </div>
            <p
              className="mt-3 text-center text-base font-extrabold leading-snug md:text-lg"
              style={{ fontFamily: "'Montserrat', sans-serif", color: "var(--brand-red)" }}
            >
              Cần chi tiêu thêm: {formatVnd(remaining * 100000)} để lên hạng {tier.key === "silver" ? "Vàng" : "Kim Cương"}
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Tương đương mức chi tiêu hiện tại: {formatVnd(customer.points * 100000)}
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
        <div ref={qrRef} className="mx-auto inline-block rounded-2xl bg-white p-4 ring-1 ring-border">
          <QRCodeSVG
            value={`trison:phone:${customer.phone}`}
            size={180}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a1e3f"
          />
        </div>
        <div className="mt-4">
          <Button
            type="button"
            onClick={downloadQR}
            className="h-11 rounded-xl bg-brand-navy px-5 text-sm font-bold text-brand-navy-foreground hover:bg-brand-navy/90"
          >
            <Download className="mr-2 h-4 w-4" /> Tải mã QR về điện thoại
          </Button>
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Đưa mã này cho nhân viên quét tại quầy để tích / đổi điểm.
        </p>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-brand-navy">
          <Gift className="h-5 w-5 text-brand-red" /> Đổi quà ưu đãi
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                    <button
                      type="button"
                      onClick={() => setRedeemReward(r)}
                      className="mt-3 min-h-12 w-full rounded-xl bg-success px-3 py-3 text-center text-sm font-black uppercase tracking-wide text-success-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
                    >
                      ✓ Đủ điểm — Đổi quà
                    </button>
                  ) : (
                    <div className="mt-3 space-y-1">
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-muted px-3 py-2.5 text-center text-sm font-bold text-muted-foreground opacity-70"
                      >
                        Chưa đủ điểm
                      </button>
                      <p className="text-center text-xs font-semibold text-muted-foreground">
                        Còn thiếu {r.points_required - customer.points} điểm
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules & member regulations */}
      <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-brand-navy">
          <ScrollText className="h-5 w-5 text-brand-red" /> 📜 Luật tích điểm & Quy định thành viên
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed text-foreground">
          <li>
            <span className="font-bold text-brand-navy">• Luật tích điểm: </span>
            Cứ mỗi <span className="font-bold">100.000đ</span> trên hóa đơn mua hàng ={" "}
            <span className="font-bold text-brand-red">1 điểm</span> thưởng.
          </li>
          <li>
            <span className="font-bold text-brand-navy">• Thời hạn thẻ: </span>
            Thẻ có giá trị sử dụng trong vòng <span className="font-bold">1 năm (12 tháng)</span> kể từ ngày phát sinh giao dịch tích điểm đầu tiên.
          </li>
          <li>
            <span className="font-bold text-brand-navy">• Quy định mốc hạng:</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/40 p-3 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hạng Bạc</div>
                <div className="mt-1 text-sm font-extrabold text-brand-navy">Dưới {thresholds.goldMin} điểm</div>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hạng Vàng</div>
                <div className="mt-1 text-sm font-extrabold text-brand-navy">
                  Từ {thresholds.goldMin} - {thresholds.diamondMin - 1} điểm
                </div>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hạng Kim Cương</div>
                <div className="mt-1 text-sm font-extrabold text-brand-navy">Từ {thresholds.diamondMin} điểm trở lên</div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      {redeemReward && (
        <RedeemCodeModal reward={redeemReward} onClose={() => setRedeemReward(null)} />
      )}
    </div>
  );
}

function RedeemCodeModal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl"
        style={{ boxShadow: "0 25px 80px -10px rgba(0,0,0,0.5)" }}
      >
        <div
          className="px-6 py-5 text-center text-white"
          style={{ background: "linear-gradient(135deg, var(--brand-navy), oklch(0.25 0.08 250))" }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
            Yến sào Trí Sơn
          </div>
          <h3 className="mt-1 text-xl font-black uppercase tracking-wide">
            Xác nhận đổi quà thành viên
          </h3>
        </div>

        <div className="px-6 py-6 text-center">
          <div className="text-sm font-semibold text-muted-foreground">{reward.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Trị giá: <span className="font-bold text-brand-red">{reward.points_required} điểm</span>
          </div>

          <div className="my-5 rounded-2xl border-2 border-dashed bg-gradient-to-br from-amber-50 to-yellow-50 px-4 py-5"
            style={{ borderColor: "#bf953f" }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/70">
              Mã sản phẩm / Mã đổi thưởng
            </div>
            <div
              className="mt-2 break-all text-2xl leading-tight"
              style={{
                ...GOLD_METALLIC,
                fontSize: "1.75rem",
                letterSpacing: "0.05em",
              }}
            >
              {reward.code || "(Chưa có mã)"}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground">
            Vui lòng đưa màn hình mã này <span className="font-bold">hoặc đọc mã</span> cho{" "}
            <span className="font-bold text-brand-red">Thu ngân tại quầy</span> để nhận quà chưng sẵn.
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground">
            Điểm sẽ được tự động trừ sau khi nhân viên xác nhận trên hệ thống.
          </p>

          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="mt-5 h-11 rounded-xl px-8 font-bold"
          >
            ĐÓNG
          </Button>
        </div>
      </div>
    </div>
  );
}
