import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles, Gift, Phone, Award, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getTier, formatVnd, normalizePhone } from "@/lib/loyalty";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { QrScannerModal } from "@/components/qr-scanner";

export const Route = createFileRoute("/khach-hang")({
  head: () => ({
    meta: [
      { title: "Tra cứu điểm - Yến sào Trí Sơn" },
      { name: "description", content: "Tra cứu điểm thành viên Yến sào Trí Sơn." },
    ],
  }),
  component: CustomerView,
});

type Customer = { id: string; name: string; phone: string; points: number };
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
    const [{ data: cust }, { data: rws }] = await Promise.all([
      supabase.from("customers").select("*").eq("phone", p).maybeSingle(),
      supabase.from("rewards").select("*").eq("active", true).order("points_required"),
    ]);
    setCustomer((cust as Customer) ?? null);
    setRewards((rws as Reward[]) ?? []);
    setLoading(false);
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
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Thành viên VIP
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">YẾN SÀO TRÍ SƠN</h1>
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

function MemberCard({ customer, rewards }: { customer: Customer; rewards: Reward[] }) {
  const tier = getTier(customer.points);
  const progress = tier.next
    ? Math.min(100, ((customer.points - tier.min) / (tier.next - tier.min)) * 100)
    : 100;
  const remaining = tier.next ? tier.next - customer.points : 0;

  return (
    <div className="mt-6 space-y-6">
      <p className="text-center text-lg font-bold text-brand-navy">
        Xin chào, <span className="text-brand-red">{customer.name}</span> 👋
      </p>

      <div className="relative overflow-hidden rounded-3xl p-6 shadow-[var(--shadow-card)]" style={{ background: tier.gradient, color: tier.text }}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20" style={{ background: tier.accent }} />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full opacity-10" style={{ background: tier.accent }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-75">Thẻ thành viên</div>
            <div className="mt-1 flex items-center gap-2 text-xl font-black">
              <Award className="h-5 w-5" style={{ color: tier.accent }} />
              Hạng {tier.name}
            </div>
          </div>
          <div className="text-right text-xs font-semibold uppercase tracking-wider opacity-75">Trí Sơn</div>
        </div>
        <div className="relative mt-6 text-center">
          <div className="text-6xl font-black leading-none md:text-7xl">{customer.points}</div>
          <div className="mt-1 text-base font-bold opacity-90">ĐIỂM</div>
          <div className="mt-2 text-xs opacity-75">Tương đương mức chi tiêu {formatVnd(customer.points * 100000)}</div>
        </div>
        <div className="relative mt-6 font-mono text-sm tracking-widest opacity-80">
          •••• •••• {customer.phone.slice(-4)}
        </div>
      </div>

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
              <span>{tier.min}đ</span>
              <span>{tier.next}đ</span>
            </div>
          </>
        ) : (
          <p className="text-center text-sm font-bold text-brand-navy">🎉 Bạn đã đạt hạng cao nhất - Kim Cương!</p>
        )}
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
