import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/admin-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  History,
  Gift,
  LogOut,
  Search,
  UserPlus,
  Plus,
  Minus,
  Lock,
  Sparkles,
  Upload,
  Eye,
  EyeOff,
  ImageIcon,
  Cake,
  Copy,
  Phone,
  MessageCircle,
  Pencil,
  X,
  Crown,
  Save,
  Undo2,
  ShieldAlert,
  Trash2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

const MANAGER_PASSWORD = "TrisonAdmin2026";
import { formatVnd, getTier, normalizePhone, cardWindow, DEFAULT_THRESHOLDS, type TierThresholds } from "@/lib/loyalty";
import { useTierThresholds } from "@/lib/use-tier-thresholds";
import { fetchActivationDate, fetchActivationDates } from "@/lib/activation";
import { autoExpireCustomer, fetchExpiringSoon, renewMembershipIfActive, type ExpiringSoon } from "@/lib/expiry";
import { AlertTriangle, Settings2 } from "lucide-react";
import trisonLogo from "@/assets/trison-logo.png.asset.json";
import { LotusScene } from "@/components/lotus-scene";
import { QrScannerModal } from "@/components/qr-scanner";
import { Switch } from "@/components/ui/switch";
import { sendZaloNotification, loadZnsSettings, saveZnsSettings, DEFAULT_ZNS_SETTINGS, type ZnsSettings } from "@/lib/zalo-zns";
import { Camera, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Quản trị - Yến sào Trí Sơn" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminView,
});

type Customer = { id: string; name: string; phone: string; points: number; created_at: string; birth_date: string | null; birth_day: number | null; birth_month: number | null };
type Transaction = {
  id: string;
  customer_id: string;
  points_change: number;
  amount: number | null;
  reason: string | null;
  staff_name: string | null;
  type: string;
  created_at: string;
};

const SHARED_PASSWORD = "Trison2026";
const AUTH_KEY = "trison_admin_authed";

function tierPillClass(key: "silver" | "gold" | "diamond"): string {
  if (key === "diamond") return "bg-neutral-900 text-white";
  if (key === "gold") return "bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950";
  return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900";
}

function AdminView() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-navy text-brand-navy-foreground">
        <div className="text-sm font-bold opacity-80">Đang tải…</div>
      </div>
    );
  }
  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;
  return (
    <AdminShell
      onLogout={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (pwd === SHARED_PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, "1");
        toast.success("Đăng nhập thành công");
        onSuccess();
      } else {
        toast.error("Mật khẩu không đúng");
      }
      setLoading(false);
    }, 200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy px-4">
      <Toaster position="top-center" richColors />
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-[var(--shadow-card)]"
      >
        <div className="mb-6 text-center">
          <img
            src={trisonLogo.url}
            alt="Yến sào Trí Sơn"
            className="mx-auto h-16 w-auto drop-shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
            style={{ mixBlendMode: "multiply" }}
          />
          <h1 className="mt-4 text-2xl font-black text-brand-navy">Đăng nhập Nhân viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">Yến sào Trí Sơn - Hệ thống quản trị</p>
        </div>

        <Label className="block text-sm font-bold">Mật khẩu chung của nhân viên</Label>
        <div className="relative mt-2">
          <Input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="h-12 rounded-xl border-2 pr-12 text-base"
            placeholder="Nhập mật khẩu…"
            autoComplete="current-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="h-4 w-4 accent-brand-red"
          />
          Hiện mật khẩu để xem đúng chưa
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="mt-5 h-12 w-full rounded-xl bg-brand-red text-base font-bold text-brand-red-foreground hover:bg-brand-red/90"
        >
          {loading ? "Đang kiểm tra..." : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}



type Section = "dashboard" | "customers" | "tier-members" | "history" | "rewards" | "tiers" | "system";

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [staff, setStaff] = useState(() =>
    (typeof window !== "undefined" && localStorage.getItem("trison_staff")) || "Thu ngân"
  );

  const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
    { id: "customers", label: "Danh sách khách hàng", icon: Users },
    { id: "tier-members", label: "Quản lý hạng thành viên", icon: Crown },
    { id: "history", label: "Lịch sử giao dịch", icon: History },
    { id: "rewards", label: "Cài đặt quà tặng", icon: Gift },
    { id: "tiers", label: "Cài đặt hạng tích điểm", icon: Sparkles },
    { id: "system", label: "Cấu hình hệ thống", icon: Settings2 },
  ];



  return (
    <div className="relative flex min-h-screen bg-transparent">
      <LotusScene />
      <Toaster position="top-center" richColors />

      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-3">
            <img
              src={trisonLogo.url}
              alt="Yến sào Trí Sơn"
              className="h-12 w-12 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
            />
            <div>
              <div className="text-sm font-black leading-tight">YẾN SÀO</div>
              <div className="text-xs font-bold leading-tight text-sidebar-foreground/70">TRÍ SƠN</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-brand-red text-brand-red-foreground shadow-[var(--shadow-soft)]" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Label className="text-xs text-sidebar-foreground/60">Thu ngân</Label>
          <Input
            value={staff}
            onChange={(e) => { setStaff(e.target.value); localStorage.setItem("trison_staff", e.target.value); }}
            className="mt-1 h-9 rounded-lg border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
          />
          <Button onClick={onLogout} variant="ghost" className="mt-2 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="md:hidden">
        <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground shadow-md">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-sidebar-foreground hover:bg-sidebar-accent">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <div className="border-b border-sidebar-border px-5 py-5">
                <div className="flex items-center gap-3">
                  <img src={trisonLogo.url} alt="Yến sào Trí Sơn" className="h-12 w-12 object-contain" />
                  <div>
                    <div className="text-sm font-black leading-tight">YẾN SÀO</div>
                    <div className="text-xs font-bold leading-tight text-sidebar-foreground/70">TRÍ SƠN</div>
                  </div>
                </div>
              </div>
              <nav className="space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <SheetTrigger asChild key={item.id}>
                      <button
                        onClick={() => setSection(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold transition ${
                          active ? "bg-brand-red text-brand-red-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    </SheetTrigger>
                  );
                })}
              </nav>
              <div className="border-t border-sidebar-border p-3">
                <Label className="text-xs text-sidebar-foreground/60">Thu ngân</Label>
                <Input
                  value={staff}
                  onChange={(e) => { setStaff(e.target.value); localStorage.setItem("trison_staff", e.target.value); }}
                  className="mt-1 h-10 rounded-lg border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src={trisonLogo.url} alt="Yến sào Trí Sơn" className="h-8 w-8 object-contain" />
            <span className="text-sm font-black">
              {navItems.find((n) => n.id === section)?.label ?? "TRÍ SƠN"}
            </span>
          </div>
          <Button onClick={onLogout} variant="ghost" size="sm" className="h-10 w-10 p-0 text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">

        <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-8">
          {section === "dashboard" && <Dashboard staff={staff} />}
          {section === "customers" && <CustomersSection staff={staff} />}
          {section === "tier-members" && <TierMembersSection staff={staff} />}
          {section === "history" && <HistorySection />}
          {section === "rewards" && <RewardsSection />}
          {section === "tiers" && <TierSettingsSection />}
          {section === "system" && <SystemConfigSection />}


        </div>
      </main>
    </div>
  );
}

function Dashboard({ staff }: { staff: string }) {
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);
  const [todayTx, setTodayTx] = useState<Transaction[]>([]);
  const [counts, setCounts] = useState({ customers: 0, txToday: 0 });
  const [scanOpen, setScanOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<Customer | null>(null);

  async function loadStats() {
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const [{ count: cust }, { data: tx }] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
    ]);
    setCounts({ customers: cust ?? 0, txToday: tx?.length ?? 0 });
    setTodayTx((tx as Transaction[]) ?? []);
  }

  useEffect(() => {
    loadStats();
    const ch = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function lookupByPhone(p: string): Promise<Customer | null> {
    const { data } = await supabase.from("customers").select("*").eq("phone", p).maybeSingle();
    if (!data) return null;
    const exp = await autoExpireCustomer({ id: (data as any).id, points: (data as any).points });
    if (exp.expired) {
      toast.message("Thẻ khách đã hết hạn 1 năm - đã tự reset về 0 điểm.");
      return { ...(data as Customer), points: 0 };
    }
    return data as Customer;
  }

  async function findCustomer(e?: React.FormEvent) {
    e?.preventDefault();
    const p = normalizePhone(phone);
    if (!p) return;
    setSearching(true);
    const c = await lookupByPhone(p);
    setCustomer(c);
    if (!c) toast.error("Không tìm thấy khách hàng với SĐT này");
    setSearching(false);
  }

  async function handleScan(text: string) {
    setScanOpen(false);
    const cleaned = text.trim().replace(/^tel:/i, "").replace(/^trison:phone:/i, "");
    const p = normalizePhone(cleaned);
    if (!p) { toast.error("Mã QR không hợp lệ"); return; }
    setPhone(p);
    setSearching(true);
    const c = await lookupByPhone(p);
    setSearching(false);
    if (!c) { toast.error("Không tìm thấy khách hàng với SĐT " + p); return; }
    setCustomer(c);
    setQuickCustomer(c);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Bảng điều khiển</h1>
        <p className="text-sm text-muted-foreground">Tra cứu nhanh và thực hiện cộng/trừ điểm cho khách hàng.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Tổng khách hàng" value={counts.customers} color="navy" />
        <StatCard label="Giao dịch hôm nay" value={counts.txToday} color="red" />
        <StatCard label="Nhân viên" value={staff} color="gold" small />
      </div>

      <BirthdaysThisMonth />
      <ExpiringCardsSoon />




      <form onSubmit={findCustomer} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        <Label className="text-sm font-bold text-brand-navy">Tìm kiếm nhanh khách hàng</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại khách..." className="h-12 rounded-xl border-2 pl-10 text-base font-semibold" />
          </div>
          <Button type="submit" disabled={searching} className="h-12 rounded-xl bg-brand-navy px-6 font-bold text-brand-navy-foreground hover:bg-brand-navy/90">
            Tra cứu
          </Button>
          <Button
            type="button"
            onClick={() => setScanOpen(true)}
            className="h-12 rounded-xl bg-brand-red px-5 font-bold text-brand-red-foreground hover:bg-brand-red/90"
          >
            <Camera className="mr-2 h-4 w-4" /> Quét mã QR của khách
          </Button>
        </div>
      </form>

      {customer && <PointsActions customer={customer} staff={staff} onChanged={(c) => { setCustomer(c); loadStats(); }} />}

      <div>
        <h2 className="mb-3 text-lg font-black text-brand-navy">Giao dịch hôm nay (Real-time)</h2>
        <TransactionList items={todayTx} allowVoid onVoided={loadStats} />
      </div>

      <QrScannerModal open={scanOpen} onClose={() => setScanOpen(false)} onResult={handleScan} />
      {quickCustomer && (
        <QuickAddPointsModal
          customer={quickCustomer}
          staff={staff}
          onClose={() => setQuickCustomer(null)}
          onSaved={async () => {
            const refreshed = await lookupByPhone(quickCustomer.phone);
            if (refreshed) setCustomer(refreshed);
            setQuickCustomer(null);
            loadStats();
          }}
        />
      )}
    </div>
  );
}


function StatCard({ label, value, color, small }: { label: string; value: number | string; color: "navy" | "red" | "gold"; small?: boolean }) {
  const styles = {
    navy: { bg: "var(--brand-navy)", fg: "var(--brand-navy-foreground)" },
    red: { bg: "var(--brand-red)", fg: "var(--brand-red-foreground)" },
    gold: { bg: "var(--brand-gold)", fg: "oklch(0.2 0.04 260)" },
  }[color];
  return (
    <div className="rounded-2xl p-4 shadow-[var(--shadow-soft)]" style={{ background: styles.bg, color: styles.fg }}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className={`mt-1 font-black ${small ? "text-lg" : "text-3xl"}`}>{value}</div>
    </div>
  );
}

function PointsActions({ customer, staff, onChanged }: { customer: Customer; staff: string; onChanged: (c: Customer) => void }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const thresholds = useTierThresholds();
  const tier = getTier(customer.points, thresholds);

  const points = useMemo(() => Math.floor(Number(amount.replace(/[^0-9]/g, "") || "0") / 100000), [amount]);
  const win = cardWindow(activatedAt);

  useEffect(() => {
    let alive = true;
    fetchActivationDate(customer.id).then((d) => { if (alive) setActivatedAt(d); });
    return () => { alive = false; };
  }, [customer.id, customer.points]);

  async function commit(type: "add" | "subtract", overridePoints?: number) {
    const pts = overridePoints ?? points;
    if (!pts || pts <= 0) { toast.error("Vui lòng nhập số tiền hoặc số điểm hợp lệ"); return; }
    if (type === "subtract" && customer.points < pts) { toast.error("Khách không đủ điểm"); return; }
    setBusy(true);
    const change = type === "add" ? pts : -pts;
    const newPoints = customer.points + change;
    if (type === "add") await renewMembershipIfActive(customer.id);
    const { data: upd, error: e1 } = await supabase.from("customers").update({ points: newPoints }).eq("id", customer.id).select().single();
    if (e1) { toast.error("Lỗi: " + e1.message); setBusy(false); return; }
    const { error: e2 } = await supabase.from("transactions").insert({
      customer_id: customer.id,
      points_change: change,
      amount: type === "add" ? Number(amount.replace(/[^0-9]/g, "")) || null : null,
      reason: reason || (type === "add" ? "Cộng điểm hóa đơn" : "Trừ điểm / đổi quà"),
      staff_name: staff,
      type,
    });
    if (e2) { toast.error("Lỗi giao dịch: " + e2.message); setBusy(false); return; }
    toast.success(type === "add" ? `+${pts} điểm cho ${customer.name}` : `-${pts} điểm cho ${customer.name}`);
    setAmount(""); setReason("");
    onChanged(upd as Customer);
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border-2 border-brand-navy/10 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase text-muted-foreground">Khách hàng đang chọn</div>
          <div className="text-xl font-black text-brand-navy">{customer.name}</div>
          <div className="text-sm font-semibold text-muted-foreground">{customer.phone}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {win.activated ? <>Thẻ: {win.memberSince} → {win.validThrough}</> : <span className="italic">Thẻ: Chưa kích hoạt</span>}
          </div>
        </div>
        <div className={`rounded-xl px-4 py-2 text-center ${tierPillClass(tier.key)}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Hạng {tier.name}</div>
          <div className="text-2xl font-black leading-tight">{customer.points} đ</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <Label className="text-sm font-bold">Số tiền hóa đơn (VNĐ)</Label>
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ví dụ: 500000" className="mt-1 h-12 rounded-xl border-2 text-base font-bold" />
          <p className="mt-1 text-xs text-muted-foreground">
            Tỷ lệ 100.000đ = 1 điểm → <span className="font-bold text-brand-red">+{points} điểm</span>
            {amount && <span className="ml-1">({formatVnd(Number(amount))})</span>}
          </p>
        </div>
        <div>
          <Label className="text-sm font-bold">Lý do / Ghi chú</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder='Vd: "Khách mua 1 hộp yến tinh chế"' rows={3} className="mt-1 rounded-xl border-2" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button disabled={busy} onClick={() => commit("add")} className="h-14 rounded-xl bg-success text-base font-black text-success-foreground hover:bg-success/90">
          <Plus className="mr-2 h-5 w-5" /> Xác nhận cộng {points > 0 ? `+${points}` : ""} điểm
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            const n = Number(prompt("Nhập số điểm cần trừ:", "20") || "0");
            if (n > 0) commit("subtract", n);
          }}
          className="h-14 rounded-xl bg-brand-red text-base font-black text-brand-red-foreground hover:bg-brand-red/90"
        >
          <Minus className="mr-2 h-5 w-5" /> Trừ điểm / Đổi quà
        </Button>
      </div>
    </div>
  );
}

function TransactionList({ items, allowVoid, onVoided }: { items: Transaction[]; allowVoid?: boolean; onVoided?: () => void }) {
  const [names, setNames] = useState<Record<string, { name: string; phone: string }>>({});
  const [voiding, setVoiding] = useState<string | null>(null);
  const [pwTarget, setPwTarget] = useState<Transaction | null>(null);
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.customer_id))).filter((id) => !names[id]);
    if (ids.length === 0) return;
    supabase.from("customers").select("id,name,phone").in("id", ids).then(({ data }) => {
      if (data) {
        const m: Record<string, { name: string; phone: string }> = {};
        data.forEach((c: any) => { m[c.id] = { name: c.name, phone: c.phone }; });
        setNames((p) => ({ ...p, ...m }));
      }
    });
  }, [items]);

  function requestVoid(t: Transaction) {
    setPwTarget(t);
    setPw("");
    setShowPw(false);
    setPwError(null);
  }

  function closePwModal() {
    if (voiding) return;
    setPwTarget(null);
    setPw("");
    setShowPw(false);
    setPwError(null);
  }

  async function confirmVoid() {
    if (!pwTarget) return;
    if (pw !== MANAGER_PASSWORD) {
      setPwError("Sai mật khẩu! Chỉ có Quản lý cấp cao mới có quyền xóa hoạt động giao dịch.");
      return;
    }
    const t = pwTarget;
    setVoiding(t.id);
    const { data: cust } = await supabase.from("customers").select("points").eq("id", t.customer_id).maybeSingle();
    if (!cust) { toast.error("Không tìm thấy khách"); setVoiding(null); setPwTarget(null); return; }
    const reverted = (cust as any).points - t.points_change;
    if (reverted < 0) { toast.error("Không thể hoàn: điểm khách đã không còn đủ"); setVoiding(null); setPwTarget(null); return; }
    const { error: e1 } = await supabase.from("customers").update({ points: reverted }).eq("id", t.customer_id);
    if (e1) { toast.error(e1.message); setVoiding(null); setPwTarget(null); return; }
    const { error: e2 } = await supabase
      .from("transactions")
      .update({ type: "void", reason: "[ĐÃ HỦY DO NHẬP SAI] " + (t.reason || ""), created_at: new Date().toISOString() } as any)
      .eq("id", t.id);
    if (e2) { toast.error(e2.message); setVoiding(null); setPwTarget(null); return; }
    toast.success(`Đã hoàn ${Math.abs(t.points_change)} điểm`);
    setVoiding(null);
    setPwTarget(null);
    setPw("");
    onVoided?.();
  }

  if (items.length === 0)
    return <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào.</div>;

  return (
    <>
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
      <ul className="divide-y">
        {items.map((t) => {
          const c = names[t.customer_id];
          const time = new Date(t.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          const masked = c ? `${c.phone.slice(0, 4)}xxxxxx` : "...";
          const positive = t.points_change > 0;
          const voided = t.type === "void";
          const canVoid = allowVoid && !voided && t.type !== "adjust";
          return (
            <li key={t.id} className={`flex items-center justify-between gap-3 p-4 ${voided ? "bg-muted/40" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold text-muted-foreground" style={{ background: "var(--muted)" }}>
                  {time}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-bold ${voided ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {c?.name ?? "Khách"} <span className="font-mono text-xs text-muted-foreground">({masked})</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.reason || "—"} • Bởi {t.staff_name || "?"}
                  </div>
                  {voided && (
                    <div className="mt-0.5 inline-block rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-black uppercase text-brand-red">
                      Đã hủy do nhập sai
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-lg font-black ${voided ? "text-muted-foreground line-through" : positive ? "text-success" : "text-brand-red"}`}>
                  {positive ? "+" : ""}{t.points_change}
                </div>
                {canVoid && (
                  <Button
                    onClick={() => requestVoid(t)}
                    disabled={voiding === t.id}
                    size="sm"
                    variant="ghost"
                    title="Hủy lệnh / Hoàn điểm"
                    className="h-9 rounded-lg border border-brand-red/30 px-2 text-xs font-black text-brand-red hover:bg-brand-red hover:text-brand-red-foreground"
                  >
                    <Undo2 className="mr-1 h-3.5 w-3.5" />
                    {voiding === t.id ? "..." : "Hủy"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>

    {pwTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closePwModal}>
        <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-brand-red" />
            <h3 className="text-lg font-black text-brand-navy">Xác thực cấp Quản lý</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Vui lòng nhập mật khẩu Admin để hủy/xóa hoạt động giao dịch này.
          </p>
          <Label className="text-sm font-bold text-brand-navy">Mật khẩu Quản lý</Label>
          <div className="relative mt-2">
            <Input
              type={showPw ? "text" : "password"}
              value={pw}
              autoFocus
              onChange={(e) => { setPw(e.target.value); setPwError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") confirmVoid(); }}
              placeholder="Nhập mật khẩu Admin..."
              className="h-12 rounded-xl border-2 pr-12 text-base font-bold"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {pwError && (
            <p className="mt-2 text-sm font-bold text-brand-red">{pwError}</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={closePwModal} disabled={voiding !== null}>Hủy</Button>
            <Button
              onClick={confirmVoid}
              disabled={voiding !== null || !pw}
              className="h-11 rounded-xl bg-brand-red px-5 font-black text-brand-red-foreground hover:bg-brand-red/90"
            >
              {voiding ? "Đang xử lý..." : "Xác nhận hủy giao dịch"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function CustomersSection({ staff }: { staff: string }) {
  const thresholds = useTierThresholds();
  const [items, setItems] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBirthDay, setNewBirthDay] = useState("");
  const [newBirthMonth, setNewBirthMonth] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [quickAdd, setQuickAdd] = useState<Customer | null>(null);
  const [activations, setActivations] = useState<Record<string, string | null>>({});
  const [lastTx, setLastTx] = useState<Record<string, string | null>>({});
  const [inactivity, setInactivity] = useState<"all" | "90" | "180" | "365">("all");


  async function load() {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    const list = (data as Customer[]) ?? [];
    setItems(list);
    const map = await fetchActivationDates(list.map((c) => c.id));
    setActivations(map);
    // Last transaction date per customer (only positive earning or redeem activity)
    const { data: txs } = await supabase
      .from("transactions")
      .select("customer_id, created_at, type")
      .in("type", ["add", "redeem"])
      .order("created_at", { ascending: false });
    const lt: Record<string, string | null> = {};
    for (const t of (txs as { customer_id: string; created_at: string }[]) ?? []) {
      if (!lt[t.customer_id]) lt[t.customer_id] = t.created_at;
    }
    setLastTx(lt);
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(newPhone);
    if (!newName.trim() || phone.length < 8) { toast.error("Vui lòng nhập đầy đủ Tên và SĐT hợp lệ"); return; }
    const d = parseBirthPart(newBirthDay, 31);
    const m = parseBirthPart(newBirthMonth, 12);
    if ((newBirthDay && d === null) || (newBirthMonth && m === null)) {
      toast.error("Ngày sinh phải từ 1–31 và Tháng sinh từ 1–12");
      return;
    }
    if ((d && !m) || (!d && m)) {
      toast.error("Vui lòng nhập đủ cả Ngày và Tháng sinh");
      return;
    }
    const { error } = await supabase.from("customers").insert({
      name: newName.trim(),
      phone,
      points: 0,
      birth_day: d,
      birth_month: m,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Đã thêm khách hàng");
    setNewName(""); setNewPhone(""); setNewBirthDay(""); setNewBirthMonth(""); load();
  }




  const now = Date.now();
  const minDays = inactivity === "all" ? 0 : Number(inactivity);
  const matchesSearch = (c: Customer) =>
    c.phone.includes(q) || c.name.toLowerCase().includes(q.toLowerCase());
  const filtered = items.filter(matchesSearch);
  const inactiveList = items
    .filter(matchesSearch)
    .map((c) => {
      const last = lastTx[c.id] ?? null;
      const days = last ? Math.floor((now - new Date(last).getTime()) / 86400000) : null;
      return { c, last, days };
    })
    .filter(({ days }) => days !== null && days > minDays)
    .sort((a, b) => (b.days ?? 0) - (a.days ?? 0));

  async function copyPhone(p: string) {
    try {
      await navigator.clipboard.writeText(p);
      toast.success(`Đã copy SĐT: ${p}`);
    } catch {
      toast.error("Không thể copy");
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }



  function exportBackup() {
    if (items.length === 0) { toast.error("Chưa có khách hàng để sao lưu"); return; }
    const rows = items.map((c) => {
      const tier = getTier(c.points, thresholds);
      const w = cardWindow(activations[c.id]);
      return {
        "Họ và Tên Khách Hàng": c.name,
        "Số Điện Thoại": c.phone,
        "Ngày / Tháng Sinh": formatBirth(c),
        "Số Điểm Tích Lũy": c.points,
        "Hạng Thành Viên": tier.name,
        "Member Since (Bắt đầu tích điểm)": w.activated ? w.memberSince : "Chưa kích hoạt",
        "Valid Through (Hết hạn thẻ)": w.activated ? w.validThrough : "Chưa kích hoạt",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Khách hàng");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `TriSon-SaoLuu-KhachHang-${stamp}.xlsx`, { bookType: "xlsx" });
    toast.success(`Đã xuất ${rows.length} khách hàng ra Excel`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Danh sách khách hàng</h1>
        <Button
          type="button"
          onClick={exportBackup}
          className="h-12 rounded-xl bg-[#1F7244] px-5 font-bold text-white shadow-[var(--shadow-soft)] hover:bg-[#185a36]"
        >
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          <Download className="mr-2 h-4 w-4" />
          XUẤT EXCEL SAO LƯU DỮ LIỆU
        </Button>
      </div>

      <form onSubmit={add} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex items-center gap-2 font-bold text-brand-navy">
          <UserPlus className="h-5 w-5" /> Thêm khách hàng mới
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs font-bold text-muted-foreground">Họ và tên</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nguyễn Văn A" className="mt-1 h-12 rounded-xl border-2" />
          </div>
          <div>
            <Label className="text-xs font-bold text-muted-foreground">Số điện thoại</Label>
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="09xxxxxxxx" className="mt-1 h-12 rounded-xl border-2" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs font-bold text-muted-foreground">🎂 Sinh nhật (chỉ cần Ngày &amp; Tháng)</Label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <Input
                inputMode="numeric"
                maxLength={2}
                value={newBirthDay}
                onChange={(e) => setNewBirthDay(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="Ngày (1–31)"
                className="h-12 rounded-xl border-2 text-base"
              />
              <Input
                inputMode="numeric"
                maxLength={2}
                value={newBirthMonth}
                onChange={(e) => setNewBirthMonth(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="Tháng (1–12)"
                className="h-12 rounded-xl border-2 text-base"
              />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Không bắt buộc nhập năm sinh.</div>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-12 w-full rounded-xl bg-brand-navy font-bold text-brand-navy-foreground">Thêm khách hàng</Button>
          </div>
        </div>
      </form>


      <div className="rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b p-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc SĐT..." className="h-11 rounded-xl border-2 pl-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs font-bold text-muted-foreground">
              ⏰ Bộ lọc khách hàng lâu chưa quay lại:
            </Label>
            <select
              value={inactivity}
              onChange={(e) => setInactivity(e.target.value as "all" | "90" | "180" | "365")}
              className="h-10 rounded-xl border-2 border-input bg-background px-3 text-sm font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">Tất cả khách hàng</option>
              <option value="90">Hơn 3 tháng chưa mua hàng (&gt; 90 ngày)</option>
              <option value="180">Hơn 6 tháng chưa mua hàng (&gt; 180 ngày)</option>
              <option value="365">Hơn 1 năm chưa mua hàng (&gt; 365 ngày)</option>
            </select>
            {inactivity !== "all" && (
              <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-black text-brand-red">
                {inactiveList.length} khách hàng
              </span>
            )}
          </div>
        </div>

        {inactivity === "all" ? (
          <ul className="divide-y">
            {filtered.map((c) => {
              const tier = getTier(c.points, thresholds);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-sm font-mono text-muted-foreground">{c.phone}</div>
                    {customerBirth(c) && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        🎂 {formatBirth(c)}
                      </div>
                    )}
                    {(() => {
                      const w = cardWindow(activations[c.id]);
                      return (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {w.activated ? (
                            <>Thẻ: {w.memberSince} → <span className="font-semibold text-brand-navy">{w.validThrough}</span></>
                          ) : (
                            <span className="italic">Thẻ: Chưa kích hoạt</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline ${tierPillClass(tier.key)}`}>
                      {tier.name}
                    </span>
                    <span className="text-xl font-black text-brand-navy">{c.points}đ</span>
                    <Button
                      onClick={() => setQuickAdd(c)}
                      size="sm"
                      className="h-10 rounded-xl bg-brand-red px-3 text-xs font-black text-brand-red-foreground hover:bg-brand-red/90 shadow-[var(--shadow-soft)]"
                    >
                      <Plus className="mr-1 h-4 w-4" /> Cộng điểm
                    </Button>
                    <Button onClick={() => setEditing(c)} size="sm" variant="ghost" className="text-brand-navy">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Không có khách hàng nào.</li>}
          </ul>
        ) : (
          <>
            {/* Mobile card list */}
            <ul className="divide-y md:hidden">
              {inactiveList.map(({ c, last, days }) => {
                const tier = getTier(c.points, thresholds);
                return (
                  <li key={c.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-base font-black text-brand-navy">{c.name}</div>
                        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                          {c.phone}
                          <Button onClick={() => copyPhone(c.phone)} size="sm" variant="ghost" className="h-7 rounded-md px-2 text-brand-navy hover:bg-brand-navy/10">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tierPillClass(tier.key)}`}>{tier.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-muted-foreground">Mua cuối: <span className="text-foreground">{formatDate(last)}</span></span>
                      <span className="rounded-full bg-brand-red/10 px-2.5 py-1 font-black text-brand-red">{days} ngày chưa mua</span>
                    </div>
                    <Button onClick={() => setQuickAdd(c)} className="h-11 w-full rounded-xl bg-brand-red text-sm font-black text-brand-red-foreground hover:bg-brand-red/90">
                      <Plus className="mr-1 h-4 w-4" /> Cộng điểm
                    </Button>
                  </li>
                );
              })}
              {inactiveList.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">Không có khách hàng nào quá hạn theo bộ lọc này. 🎉</li>
              )}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left font-[Montserrat]">
                <thead className="bg-brand-navy/5 text-xs font-black uppercase tracking-wider text-brand-navy">
                  <tr>
                    <th className="px-4 py-3">Họ và Tên</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Hạng hiện tại</th>
                    <th className="px-4 py-3">Ngày mua cuối</th>
                    <th className="px-4 py-3">Số ngày bỏ quên</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {inactiveList.map(({ c, last, days }) => {
                    const tier = getTier(c.points, thresholds);
                    return (
                      <tr key={c.id} className="hover:bg-brand-navy/5">
                        <td className="px-4 py-3 font-bold text-foreground">{c.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{c.phone}</span>
                            <Button onClick={() => copyPhone(c.phone)} size="sm" variant="ghost" className="h-7 rounded-md px-2 text-brand-navy hover:bg-brand-navy/10" title="Copy SĐT để gửi Zalo">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tierPillClass(tier.key)}`}>{tier.name}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatDate(last)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-black text-brand-red">{days} ngày chưa mua</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button onClick={() => setQuickAdd(c)} size="sm" className="h-9 rounded-lg bg-brand-red px-3 text-xs font-black text-brand-red-foreground hover:bg-brand-red/90">
                            <Plus className="mr-1 h-3.5 w-3.5" /> Cộng điểm
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {inactiveList.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">Không có khách hàng nào quá hạn theo bộ lọc này. 🎉</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}


      </div>


      {editing && (
        <EditCustomerModal
          customer={editing}
          staff={staff}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {quickAdd && (
        <QuickAddPointsModal
          customer={quickAdd}
          staff={staff}
          onClose={() => setQuickAdd(null)}
          onSaved={() => { setQuickAdd(null); load(); }}
        />
      )}

    </div>
  );
}

function HistorySection() {
  const [items, setItems] = useState<Transaction[]>([]);
  async function reload() {
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200);
    setItems((data as Transaction[]) ?? []);
  }
  useEffect(() => {
    reload();
    const ch = supabase.channel("hist")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Lịch sử giao dịch</h1>
      <TransactionList items={items} allowVoid onVoided={reload} />
    </div>
  );
}




type Reward = { id: string; name: string; code: string | null; description: string | null; points_required: number; active: boolean; image_url: string | null };

function RewardsSection() {
  const [items, setItems] = useState<Reward[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [pts, setPts] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function load() {
    const { data } = await supabase.from("rewards").select("*").order("points_required");
    setItems((data as Reward[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setEditingId(null);
    setName(""); setCode(""); setDesc(""); setPts(""); setImageUrl("");
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 800KB). Hãy dùng URL hoặc nén ảnh trước.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(pts);
    if (!name.trim() || !p) { toast.error("Vui lòng nhập tên và số điểm"); return; }
    if (!code.trim()) { toast.error("Vui lòng nhập Mã sản phẩm / Mã đổi quà"); return; }
    const payload = {
      name: name.trim(),
      code: code.trim(),
      description: desc || null,
      points_required: p,
      image_url: imageUrl || null,
    };
    if (editingId) {
      const { error } = await supabase.from("rewards").update(payload as never).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Đã cập nhật quà tặng");
    } else {
      const { error } = await supabase.from("rewards").insert({ ...payload, active: true } as never);
      if (error) { toast.error(error.message); return; }
      toast.success("Đã thêm quà tặng");
    }
    resetForm();
    load();
  }

  function startEdit(r: Reward) {
    setEditingId(r.id);
    setName(r.name);
    setCode(r.code ?? "");
    setDesc(r.description ?? "");
    setPts(String(r.points_required));
    setImageUrl(r.image_url ?? "");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Xoá quà tặng này?")) return;
    await supabase.from("rewards").delete().eq("id", id);
    if (editingId === id) resetForm();
    load();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Cài đặt quà tặng</h1>

      <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        {editingId && (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-brand-navy/5 px-3 py-2 text-sm font-bold text-brand-navy">
            <span>✏️ Đang chỉnh sửa: {name || "(chưa đặt tên)"}</span>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="text-brand-red">
              <X className="mr-1 h-4 w-4" /> Hủy
            </Button>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên quà tặng" className="h-12 rounded-xl border-2" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Mã sản phẩm / Mã đổi quà (Tự đặt). Ví dụ: TS-YEN-NHUY-HOA"
            className="h-12 rounded-xl border-2 font-mono uppercase"
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả" className="h-12 rounded-xl border-2" />
          <Input value={pts} onChange={(e) => setPts(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Điểm cần đổi" className="h-12 rounded-xl border-2" />
          <Button type="submit" className="h-12 rounded-xl bg-brand-navy px-6 font-bold text-brand-navy-foreground">
            {editingId ? "CẬP NHẬT THAY ĐỔI" : "Thêm"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input
            value={imageUrl.startsWith("data:") ? "" : imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL hình ảnh / poster minh hoạ (https://...)"
            className="h-12 rounded-xl border-2"
          />
          <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-brand-navy/30 px-4 text-sm font-bold text-brand-navy hover:bg-accent">
            <Upload className="h-4 w-4" /> Tải ảnh từ máy
            <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </label>
          {imageUrl && (
            <Button type="button" variant="ghost" onClick={() => setImageUrl("")} className="h-12 rounded-xl text-brand-red">Xoá ảnh</Button>
          )}
        </div>
        {imageUrl && (
          <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
            <img src={imageUrl} alt="Xem trước" className="h-40 w-full object-cover" />
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Hỗ trợ URL hoặc tải ảnh tối đa 800KB (.jpg, .png, .webp).</p>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <div key={r.id} className="relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
            <div className="absolute right-2 top-2 z-10 flex gap-1">
              <button
                type="button"
                onClick={() => startEdit(r)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-white shadow-md transition hover:bg-brand-navy/90"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-white shadow-md transition hover:bg-brand-red/90"
                title="Xoá"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {r.image_url ? (
              <img src={r.image_url} alt={r.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-40" />
              </div>
            )}
            <div className="p-4">
              <div className="font-black text-foreground">{r.name}</div>
              {r.code && (
                <div className="mt-1 inline-block rounded-md bg-brand-navy/10 px-2 py-0.5 font-mono text-xs font-bold text-brand-navy">
                  {r.code}
                </div>
              )}
              {r.description && <div className="mt-1 text-sm text-muted-foreground">{r.description}</div>}
              <div className="mt-2 text-sm font-bold text-brand-red">{r.points_required} điểm</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// Birthday helpers + components
// ============================================================

const VN_MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function parseBirthPart(s: string, max: number): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 1 || n > max) return null;
  return Math.floor(n);
}

function customerBirth(c: { birth_day: number | null; birth_month: number | null; birth_date: string | null }): { day: number; month: number } | null {
  if (c.birth_day && c.birth_month) return { day: c.birth_day, month: c.birth_month };
  if (c.birth_date) {
    const [, m, d] = c.birth_date.split("-");
    const dd = Number(d), mm = Number(m);
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) return { day: dd, month: mm };
  }
  return null;
}

function formatBirth(c: { birth_day: number | null; birth_month: number | null; birth_date: string | null }): string {
  const b = customerBirth(c);
  if (!b) return "";
  return `${String(b.day).padStart(2, "0")}/${String(b.month).padStart(2, "0")}`;
}

function BirthdaysThisMonth() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("customers").select("*");
      if (!mounted) return;
      const list = ((data as Customer[]) ?? [])
        .map((c) => ({ c, b: customerBirth(c) }))
        .filter(({ b }) => b !== null && b.month === currentMonth)
        .sort((a, b) => (a.b!.day - b.b!.day))
        .map(({ c }) => c);
      setItems(list);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [currentMonth]);

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success(`Đã sao chép ${phone}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border-2 p-5 shadow-[var(--shadow-card)]"
      style={{
        borderColor: "var(--brand-red)",
        background:
          "linear-gradient(135deg, oklch(0.98 0.02 27) 0%, oklch(0.96 0.04 60) 100%)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black text-brand-red md:text-xl">
          <Cake className="h-6 w-6" />
          🎉 KHÁCH HÀNG SINH NHẬT TRONG {VN_MONTHS[currentMonth - 1].toUpperCase()}
        </h2>
        <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-black text-brand-red-foreground">
          {items.length} khách
        </span>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-muted-foreground">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl bg-white/60 p-6 text-center text-sm font-semibold text-muted-foreground">
          Tháng này chưa có khách hàng nào sinh nhật.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-3 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-black text-brand-navy">{c.name}</div>
                  <div className="font-mono text-sm text-muted-foreground">{c.phone}</div>
                  <div className="mt-1 text-xs font-bold text-brand-red">
                    🎂 Sinh ngày {formatBirth(c)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => copyPhone(c.phone)} size="sm" variant="outline" className="h-9 rounded-lg text-xs font-bold">
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy SĐT
                </Button>
                <a href={`tel:${c.phone}`} className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-navy px-3 text-xs font-bold text-brand-navy-foreground hover:bg-brand-navy/90">
                  <Phone className="h-3.5 w-3.5" /> Gọi
                </a>
                <a href={`https://zalo.me/${c.phone}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#0068ff] px-3 text-xs font-bold text-white hover:opacity-90">
                  <MessageCircle className="h-3.5 w-3.5" /> Zalo
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpiringCardsSoon() {
  const [items, setItems] = useState<ExpiringSoon[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const list = await fetchExpiringSoon(30);
    setItems(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("expiring-soon")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success(`Đã sao chép ${phone}`);
    } catch {
      toast.error("Không thể sao chép");
    }
  }

  function fmt(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border-2 p-5 shadow-[var(--shadow-card)]"
      style={{
        borderColor: "#d97706",
        background:
          "linear-gradient(135deg, oklch(0.98 0.04 80) 0%, oklch(0.96 0.06 60) 100%)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black md:text-xl" style={{ color: "#b45309" }}>
          <AlertTriangle className="h-6 w-6" />
          ⚠️ CẢNH BÁO: KHÁCH HÀNG SẮP HẾT HẠN THẺ (TRONG 30 NGÀY)
        </h2>
        <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ background: "#b45309" }}>
          {items.length} khách
        </span>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-muted-foreground">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl bg-white/60 p-6 text-center text-sm font-semibold text-muted-foreground">
          Không có khách nào sắp hết hạn thẻ trong 30 ngày tới.
        </div>
      ) : (
        <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-card md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Họ tên</th>
                <th className="px-3 py-2 text-left">SĐT</th>
                <th className="px-3 py-2 text-right">Điểm</th>
                <th className="px-3 py-2 text-center">Hết hạn</th>
                <th className="px-3 py-2 text-center">Còn lại</th>
                <th className="px-3 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const urgent = c.daysLeft <= 7;
                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2 font-bold text-brand-navy">{c.name}</td>
                    <td className="px-3 py-2 font-mono">{c.phone}</td>
                    <td className="px-3 py-2 text-right font-bold">{c.points}</td>
                    <td className="px-3 py-2 text-center text-xs">{fmt(c.validThrough)}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black text-white"
                        style={{ background: urgent ? "#dc2626" : "#d97706" }}
                      >
                        {c.daysLeft === 0 ? "Hết hôm nay" : `${c.daysLeft} ngày`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        <Button onClick={() => copyPhone(c.phone)} size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold">
                          <Copy className="mr-1 h-3.5 w-3.5" /> Copy SĐT
                        </Button>
                        <a href={`tel:${c.phone}`} className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-navy px-2.5 text-xs font-bold text-brand-navy-foreground hover:bg-brand-navy/90">
                          <Phone className="h-3.5 w-3.5" /> Gọi
                        </a>
                        <a href={`https://zalo.me/${c.phone}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#0068ff] px-2.5 text-xs font-bold text-white hover:opacity-90">
                          <MessageCircle className="h-3.5 w-3.5" /> Zalo
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Mobile card list for expiring soon */}
      {!loading && items.length > 0 && (
        <ul className="mt-4 space-y-2 md:hidden">
          {items.map((c) => {
            const urgent = c.daysLeft <= 7;
            return (
              <li key={c.id} className="space-y-2 rounded-xl border bg-card p-3 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-black text-brand-navy">{c.name}</div>
                    <div className="font-mono text-sm text-muted-foreground">{c.phone}</div>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-black text-white" style={{ background: urgent ? "#dc2626" : "#d97706" }}>
                    {c.daysLeft === 0 ? "Hết hôm nay" : `${c.daysLeft} ngày`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold text-foreground">{c.points} điểm</span>
                  <span className="text-muted-foreground">Hết hạn: {fmt(c.validThrough)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => copyPhone(c.phone)} size="sm" variant="outline" className="h-10 flex-1 rounded-lg text-xs font-bold">
                    <Copy className="mr-1 h-4 w-4" /> Copy SĐT
                  </Button>
                  <a href={`tel:${c.phone}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-brand-navy px-2.5 text-xs font-bold text-brand-navy-foreground">
                    <Phone className="h-4 w-4" /> Gọi
                  </a>
                  <a href={`https://zalo.me/${c.phone}`} target="_blank" rel="noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-[#0068ff] px-2.5 text-xs font-bold text-white">
                    <MessageCircle className="h-4 w-4" /> Zalo
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}



function EditCustomerModal({
  customer,
  staff,
  onClose,
  onSaved,
}: {
  customer: Customer;
  staff: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const initBirth = customerBirth(customer);
  const [birthDay, setBirthDay] = useState(initBirth ? String(initBirth.day) : "");
  const [birthMonth, setBirthMonth] = useState(initBirth ? String(initBirth.month) : "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);

  // Manager-only direct points edit
  const [mgrOpen, setMgrOpen] = useState(false);
  const [mgrUnlocked, setMgrUnlocked] = useState(false);
  const [mgrPwd, setMgrPwd] = useState("");
  const [directPoints, setDirectPoints] = useState(String(customer.points));

  const addPoints = useMemo(
    () => Math.floor(Number(amount.replace(/[^0-9]/g, "") || "0") / 100000),
    [amount],
  );

  useEffect(() => {
    let alive = true;
    fetchActivationDate(customer.id).then((d) => { if (alive) setActivatedAt(d); });
    return () => { alive = false; };
  }, [customer.id]);

  const win = cardWindow(activatedAt);

  function tryUnlock() {
    if (mgrPwd === MANAGER_PASSWORD) {
      setMgrUnlocked(true);
      toast.success("Đã mở khóa quyền Quản lý");
    } else {
      toast.error("Sai mật khẩu Quản lý");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!name.trim() || p.length < 8) { toast.error("Vui lòng nhập đầy đủ Tên và SĐT hợp lệ"); return; }
    const bDay = parseBirthPart(birthDay, 31);
    const bMonth = parseBirthPart(birthMonth, 12);
    if ((birthDay && bDay === null) || (birthMonth && bMonth === null)) {
      toast.error("Ngày sinh phải từ 1–31 và Tháng sinh từ 1–12"); return;
    }
    if ((bDay && !bMonth) || (!bDay && bMonth)) {
      toast.error("Vui lòng nhập đủ cả Ngày và Tháng sinh"); return;
    }
    setBusy(true);

    // Compute final points: start from current, apply add, then manager override (if unlocked & changed)
    let finalPoints = customer.points + addPoints;
    const directVal = Number(directPoints);
    const directChanged = mgrUnlocked && Number.isFinite(directVal) && directVal >= 0 && directVal !== customer.points;
    if (directChanged) finalPoints = directVal;

    const { error } = await supabase
      .from("customers")
      .update({
        name: name.trim(),
        phone: p,
        birth_day: bDay,
        birth_month: bMonth,
        birth_date: null,
        points: finalPoints,
      })
      .eq("id", customer.id);
    if (error) { setBusy(false); toast.error(error.message); return; }


    if (addPoints > 0 && !directChanged) {
      const amountNum = Number(amount.replace(/[^0-9]/g, "") || "0");
      await renewMembershipIfActive(customer.id);
      const { error: e2 } = await supabase.from("transactions").insert({
        customer_id: customer.id,
        points_change: addPoints,
        amount: amountNum,
        reason: reason.trim() || null,
        staff_name: staff,
        type: "add",
      });
      if (e2) { setBusy(false); toast.error(e2.message); return; }
    }

    if (directChanged) {
      const delta = directVal - customer.points;
      const { error: e3 } = await supabase.from("transactions").insert({
        customer_id: customer.id,
        points_change: delta,
        amount: null,
        reason: `[ĐIỀU CHỈNH BỞI QUẢN LÝ] ${customer.points} → ${directVal} điểm` + (reason.trim() ? ` • ${reason.trim()}` : ""),
        staff_name: staff,
        type: "adjust",
      });
      if (e3) { setBusy(false); toast.error(e3.message); return; }
    }

    setBusy(false);
    toast.success(
      directChanged
        ? `Đã điều chỉnh trực tiếp về ${directVal} điểm`
        : addPoints > 0
        ? `Đã cập nhật & cộng +${addPoints} điểm`
        : "Đã cập nhật khách hàng",
    );
    if (addPoints > 0 && !directChanged) {
      void sendZaloNotification({
        kind: "add",
        customerId: customer.id,
        name: name.trim(),
        phone: p,
        pointsAdded: addPoints,
        totalPoints: finalPoints,
        txDate: new Date(),
      });
    }
    onSaved();
  }


  async function remove() {
    if (!confirm(`Xoá khách hàng ${customer.name}? Lịch sử giao dịch liên quan sẽ vẫn còn.`)) return;
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã xoá khách hàng");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-brand-navy">Chỉnh sửa & Cộng điểm</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-accent" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3 rounded-xl border bg-muted/40 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-brand-navy">Điểm hiện tại</span>
            <span className="text-lg font-black text-brand-navy">{customer.points} đ</span>
          </div>
          <div className="mt-2 font-bold text-brand-navy">Hạn sử dụng thẻ</div>
          {win.activated ? (
            <div className="mt-1 flex flex-wrap gap-x-4 text-muted-foreground">
              <span>Member Since: <span className="font-semibold text-foreground">{win.memberSince}</span></span>
              <span>Valid Through: <span className="font-semibold text-brand-red">{win.validThrough}</span></span>
            </div>
          ) : (
            <div className="mt-1 italic text-muted-foreground">Chưa kích hoạt — kích hoạt sau lần tích điểm đầu tiên.</div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-bold text-muted-foreground">Họ và tên</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-12 rounded-xl border-2" />
          </div>
          <div>
            <Label className="text-xs font-bold text-muted-foreground">Số điện thoại</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-12 rounded-xl border-2" />
          </div>
          <div>
            <Label className="text-xs font-bold text-muted-foreground">🎂 Sinh nhật (Ngày &amp; Tháng)</Label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <Input
                inputMode="numeric"
                maxLength={2}
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="Ngày (1–31)"
                className="h-12 rounded-xl border-2 text-base"
              />
              <Input
                inputMode="numeric"
                maxLength={2}
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="Tháng (1–12)"
                className="h-12 rounded-xl border-2 text-base"
              />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Không bắt buộc nhập năm sinh.</div>
          </div>

          <div className="rounded-xl border-2 border-brand-red/30 bg-brand-red/5 p-3">
            <Label className="text-sm font-black text-brand-red">Số tiền hóa đơn mua hàng (VNĐ)</Label>
            <Input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Ví dụ: 500000"
              className="mt-1 h-12 rounded-xl border-2 text-lg font-bold"
            />
            <div className="mt-2 text-sm font-bold text-brand-navy">
              Số điểm sẽ được cộng thêm: <span className="text-brand-red">+{addPoints} điểm</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Quy đổi: 100.000đ = 1 điểm</div>
            <div className="mt-3">
              <Label className="text-xs font-bold text-muted-foreground">Lý do / Ghi chú giao dịch</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Khách mua 1 hộp yến tinh chế"
                className="mt-1 h-11 rounded-xl border-2"
              />
            </div>
            {addPoints > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Tổng điểm sau khi lưu: <span className="font-black text-brand-navy">{customer.points + addPoints} điểm</span>
              </div>
            )}
          </div>

          {/* Manager-only direct points edit */}
          <div className="rounded-xl border-2 border-dashed border-brand-navy/30 bg-brand-navy/5 p-3">
            <button
              type="button"
              onClick={() => setMgrOpen((s) => !s)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-black text-brand-navy">
                <ShieldAlert className="h-4 w-4" />
                Chỉnh sửa số điểm trực tiếp (Chỉ dành cho Quản lý)
              </span>
              <span className="text-xs font-bold text-muted-foreground">{mgrOpen ? "Đóng" : "Mở"}</span>
            </button>

            {mgrOpen && (
              <div className="mt-3 space-y-3">
                {!mgrUnlocked ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Mật khẩu Quản lý để mở khóa
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={mgrPwd}
                        onChange={(e) => setMgrPwd(e.target.value)}
                        placeholder="Nhập mật khẩu cấp cao…"
                        className="h-11 rounded-xl border-2"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tryUnlock(); } }}
                      />
                      <Button type="button" onClick={tryUnlock} className="h-11 rounded-xl bg-brand-navy font-bold text-brand-navy-foreground">
                        Mở khóa
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Tính năng này cho phép sửa trực tiếp số điểm khách (ví dụ từ 15 → 12) — chỉ dùng khi cần sửa sai đặc biệt.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs font-black uppercase text-brand-navy">
                      ✔ Đã mở khóa — Số điểm trực tiếp
                    </Label>
                    <Input
                      inputMode="numeric"
                      value={directPoints}
                      onChange={(e) => setDirectPoints(e.target.value.replace(/[^0-9]/g, ""))}
                      className="mt-1 h-14 rounded-xl border-2 border-brand-navy text-2xl font-black text-brand-navy"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hiện tại: <span className="font-bold">{customer.points} điểm</span>. Khi lưu, hệ thống sẽ
                      ghi nhận một bản ghi <span className="font-bold text-brand-navy">"Điều chỉnh bởi Quản lý"</span>
                      {" "}vào lịch sử.
                    </p>
                    {Number(directPoints) !== customer.points && Number.isFinite(Number(directPoints)) && (
                      <p className="mt-1 text-xs font-bold text-brand-red">
                        Sẽ chỉnh: {customer.points} → {Number(directPoints)} điểm
                        {addPoints > 0 && " (ô số tiền hóa đơn sẽ bị bỏ qua)"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        <div className="mt-5 flex gap-2">
          <Button type="button" onClick={remove} variant="ghost" className="text-brand-red">Xoá</Button>
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button type="submit" disabled={busy} className="bg-brand-navy font-bold text-brand-navy-foreground">
            {busy ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}


// ============================================================
// Quick add points modal (red button in customer list)
// ============================================================

function QuickAddPointsModal({
  customer,
  staff,
  onClose,
  onSaved,
}: {
  customer: Customer;
  staff: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const points = useMemo(
    () => Math.floor(Number(amount.replace(/[^0-9]/g, "") || "0") / 100000),
    [amount],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (points <= 0) { toast.error("Hóa đơn phải tối thiểu 100.000đ"); return; }
    setBusy(true);
    const newPoints = customer.points + points;
    await renewMembershipIfActive(customer.id);
    const { error: e1 } = await supabase.from("customers").update({ points: newPoints }).eq("id", customer.id);
    if (e1) { toast.error("Lỗi: " + e1.message); setBusy(false); return; }
    const { error: e2 } = await supabase.from("transactions").insert({
      customer_id: customer.id,
      points_change: points,
      amount: Number(amount.replace(/[^0-9]/g, "")) || null,
      reason: reason || "Cộng điểm hóa đơn",
      staff_name: staff,
      type: "add",
    });
    setBusy(false);
    if (e2) { toast.error("Lỗi giao dịch: " + e2.message); return; }
    toast.success(`+${points} điểm cho ${customer.name}`);
    void sendZaloNotification({
      kind: "add",
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      pointsAdded: points,
      totalPoints: newPoints,
      txDate: new Date(),
    });
    onSaved();
  }

  async function redeem(e: React.MouseEvent | React.KeyboardEvent | React.FormEvent) {
    e.preventDefault();
    const code = redeemCode.trim().toUpperCase();
    if (!code) { toast.error("Vui lòng nhập Mã sản phẩm"); return; }
    setRedeemBusy(true);
    try {
      const { data: reward, error: re } = await supabase
        .from("rewards")
        .select("id, name, code, points_required, active")
        .ilike("code", code)
        .maybeSingle();
      if (re) throw re;
      if (!reward) { toast.error(`Không tìm thấy quà với mã "${code}"`); setRedeemBusy(false); return; }
      if (!(reward as any).active) { toast.error("Phần quà này đã ngừng hoạt động"); setRedeemBusy(false); return; }
      const r = reward as { id: string; name: string; code: string; points_required: number };
      if (customer.points < r.points_required) {
        toast.error(`Khách thiếu ${r.points_required - customer.points} điểm để đổi "${r.name}"`);
        setRedeemBusy(false);
        return;
      }
      if (!confirm(`Xác nhận trừ ${r.points_required} điểm để đổi "${r.name}"?`)) {
        setRedeemBusy(false); return;
      }
      const newPoints = customer.points - r.points_required;
      const { error: u1 } = await supabase.from("customers").update({ points: newPoints }).eq("id", customer.id);
      if (u1) throw u1;
      const { error: u2 } = await supabase.from("transactions").insert({
        customer_id: customer.id,
        points_change: -r.points_required,
        amount: null,
        reason: `Đổi quà: ${r.name} (Mã ${r.code})`,
        staff_name: staff,
        type: "redeem",
      });
      if (u2) throw u2;
      toast.success(`Đã đổi quà "${r.name}" • -${r.points_required} điểm`);
      void sendZaloNotification({
        kind: "redeem",
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        rewardName: r.name,
        rewardCode: r.code,
        pointsCost: r.points_required,
        totalPoints: newPoints,
      });
      setRedeemCode("");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Lỗi đổi quà: " + msg);
    } finally {
      setRedeemBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-brand-red">Cộng điểm hóa đơn</h3>
            <div className="mt-1 truncate text-sm font-semibold text-brand-navy">
              {customer.name} • <span className="font-mono">{customer.phone}</span>
            </div>
            <div className="text-xs text-muted-foreground">Hiện có: {customer.points} điểm</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-accent" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <Label className="text-sm font-bold">Số tiền hóa đơn (VNĐ)</Label>
          <Input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ví dụ: 500000"
            autoFocus
            className="mt-1 h-14 rounded-xl border-2 text-lg font-black"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Tỷ lệ 100.000đ = 1 điểm →{" "}
            <span className="text-base font-black text-brand-red">+{points} điểm</span>
            {amount && <span className="ml-1">({formatVnd(Number(amount))})</span>}
          </p>
        </div>

        <div className="mt-3">
          <Label className="text-sm font-bold">Ghi chú (tuỳ chọn)</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Vd: "1 hộp yến tinh chế"'
            className="mt-1 h-12 rounded-xl border-2"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Huỷ</Button>
          <div className="flex-1" />
          <Button
            type="submit"
            disabled={busy || points <= 0}
            className="h-12 rounded-xl bg-brand-red px-6 text-base font-black text-brand-red-foreground hover:bg-brand-red/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            {busy ? "Đang lưu..." : `Cộng +${points} điểm`}
          </Button>
        </div>

        {/* ===== ĐỔI QUÀ BẰNG MÃ SẢN PHẨM ===== */}
        <div className="mt-6 rounded-2xl border-2 border-dashed border-success/40 bg-success/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Gift className="h-5 w-5 text-success" />
            <Label className="text-sm font-black uppercase tracking-wide text-success">
              Đổi quà bằng mã sản phẩm
            </Label>
          </div>
          <Label className="text-xs font-bold text-brand-navy">
            Nhập Mã Sản Phẩm Để Đổi Quà
          </Label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); redeem(e); } }}
              placeholder="VD: TS-YEN-NHUY-HOA-70ML"
              className="h-12 flex-1 rounded-xl border-2 font-mono text-base font-bold uppercase tracking-wider"
            />
            <Button
              type="button"
              onClick={redeem}
              disabled={redeemBusy || !redeemCode.trim()}
              className="h-12 rounded-xl bg-success px-5 text-sm font-black text-success-foreground hover:brightness-110"
            >
              {redeemBusy ? "Đang xử lý..." : "XÁC NHẬN ĐỔI QUÀ"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Hệ thống tự tra mã trong kho quà, trừ điểm tương ứng và ghi lịch sử giao dịch.
          </p>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Tier thresholds settings
// ============================================================

function TierSettingsSection() {
  const [goldMin, setGoldMin] = useState<string>(String(DEFAULT_THRESHOLDS.goldMin));
  const [diamondMin, setDiamondMin] = useState<string>(String(DEFAULT_THRESHOLDS.diamondMin));
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("tier_settings")
      .select("gold_min,diamond_min")
      .eq("id", "singleton")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setGoldMin(String((data as any).gold_min));
          setDiamondMin(String((data as any).diamond_min));
        }
        setLoaded(true);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    const g = Number(goldMin);
    const d = Number(diamondMin);
    if (!Number.isFinite(g) || g < 1) { toast.error("Mốc Vàng phải là số dương"); return; }
    if (!Number.isFinite(d) || d <= g) { toast.error("Mốc Kim Cương phải lớn hơn mốc Vàng"); return; }
    if (adminPw !== MANAGER_PASSWORD) {
      setPwError("Mật khẩu Quản lý không chính xác. Bạn không có quyền thay đổi luật tích điểm!");
      toast.error("Sai mật khẩu Quản lý");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("tier_settings")
      .upsert({ id: "singleton", gold_min: g, diamond_min: d, updated_at: new Date().toISOString() }, { onConflict: "id" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã cập nhật luật chơi! Khách hàng sẽ thấy ngay theo thời gian thực.");
    setAdminPw("");
    setShowPw(false);
  }

  function resetDefaults() {
    setGoldMin(String(DEFAULT_THRESHOLDS.goldMin));
    setDiamondMin(String(DEFAULT_THRESHOLDS.diamondMin));
  }

  const g = Number(goldMin) || 0;
  const d = Number(diamondMin) || 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-brand-navy md:text-3xl">
          <Crown className="h-7 w-7 text-brand-red" /> Cài đặt hạng tích điểm
        </h1>
        <p className="text-sm text-muted-foreground">
          Tùy chỉnh số điểm cần thiết để khách hàng lên hạng. Thay đổi sẽ tự động áp dụng cho{" "}
          <strong>tất cả khách hàng</strong> trên màn hình tra cứu theo thời gian thực.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        {/* Silver */}
        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-100 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-br from-slate-200 to-slate-400 px-3 py-1 text-xs font-black text-slate-900">
              HẠNG BẠC
            </span>
            <span className="text-xs text-muted-foreground">Mặc định: dưới 50 điểm</span>
          </div>
          <Label className="text-sm font-bold text-brand-navy">
            Khách có điểm dưới mốc Vàng sẽ thuộc Hạng Bạc
          </Label>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Áp dụng: <span className="text-brand-red">0 → {Math.max(0, g - 1)} điểm</span>
          </p>
        </div>

        {/* Gold */}
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-br from-amber-300 to-amber-600 px-3 py-1 text-xs font-black text-amber-950">
              HẠNG VÀNG
            </span>
            <span className="text-xs text-muted-foreground">Mặc định: từ 50 - 199 điểm</span>
          </div>
          <Label className="text-sm font-bold text-brand-navy">
            Mốc điểm tối thiểu để lên Hạng Vàng
          </Label>
          <Input
            inputMode="numeric"
            value={goldMin}
            disabled={!loaded}
            onChange={(e) => setGoldMin(e.target.value.replace(/[^0-9]/g, ""))}
            className="mt-2 h-14 rounded-xl border-2 text-2xl font-black text-brand-navy"
          />
          <p className="mt-1 text-sm font-semibold text-foreground">
            Áp dụng: <span className="text-brand-red">{g} → {Math.max(g, d - 1)} điểm</span>
          </p>
        </div>

        {/* Diamond */}
        <div className="rounded-2xl border-2 border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-700 p-5 text-white">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-neutral-900">
              HẠNG KIM CƯƠNG
            </span>
            <span className="text-xs text-white/70">Mặc định: từ 200 điểm trở lên</span>
          </div>
          <Label className="text-sm font-bold text-white">
            Mốc điểm tối thiểu để lên Hạng Kim Cương
          </Label>
          <Input
            inputMode="numeric"
            value={diamondMin}
            disabled={!loaded}
            onChange={(e) => setDiamondMin(e.target.value.replace(/[^0-9]/g, ""))}
            className="mt-2 h-14 rounded-xl border-2 border-white/30 bg-white/10 text-2xl font-black text-white placeholder:text-white/50"
          />
          <p className="mt-1 text-sm font-semibold text-white/90">
            Áp dụng: <span className="text-amber-300">từ {d} điểm trở lên</span>
          </p>
        </div>

        {/* Admin password gate */}
        <div className="rounded-2xl border-2 border-brand-red/40 bg-brand-red/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-brand-red" />
            <Label className="text-sm font-black uppercase tracking-wide text-brand-red">
              Mật khẩu xác thực Quản lý (Admin Password)
            </Label>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Chỉ Quản lý cấp cao mới được phép thay đổi luật tích điểm. Vui lòng nhập mật khẩu Admin để xác nhận.
          </p>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={adminPw}
              onChange={(e) => { setAdminPw(e.target.value); setPwError(null); }}
              placeholder="Nhập mật khẩu Quản lý..."
              autoComplete="off"
              className="h-12 rounded-xl border-2 pr-12 text-base font-bold"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {pwError && (
            <p className="mt-2 text-sm font-black text-brand-red">{pwError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={resetDefaults} className="text-muted-foreground">
            Khôi phục mặc định (50 / 200)
          </Button>
          <Button
            type="submit"
            disabled={busy || !loaded}
            className="h-14 rounded-xl bg-brand-navy px-8 text-base font-black text-brand-navy-foreground shadow-[var(--shadow-card)] hover:bg-brand-navy/90"
          >
            <Save className="mr-2 h-5 w-5" />
            {busy ? "Đang lưu..." : "CẬP NHẬT LUẬT CHƠI"}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground">
        💡 Lưu ý: Khi bạn thay đổi mốc điểm, toàn bộ hạng thẻ thành viên hiện hữu (trên trang khách
        hàng) sẽ tự động được tính toán lại theo thời gian thực — không cần khách phải tải lại trang.
      </div>
    </div>
  );
}



type CustomerSpend = Customer & { totalSpend: number };

function TierMembersSection({ staff }: { staff: string }) {
  const thresholds = useTierThresholds();
  const [items, setItems] = useState<CustomerSpend[]>([]);
  const [activeTier, setActiveTier] = useState<"silver" | "gold" | "diamond">("gold");
  const [loading, setLoading] = useState(true);
  const [quickAdd, setQuickAdd] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<Customer | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: custs }, { data: txs }] = await Promise.all([
      supabase.from("customers").select("*").order("points", { ascending: false }),
      supabase.from("transactions").select("customer_id,amount,type"),
    ]);
    const spendMap = new Map<string, number>();
    ((txs as { customer_id: string; amount: number | null; type: string }[]) ?? []).forEach((t) => {
      if (t.type === "add" && t.amount) {
        spendMap.set(t.customer_id, (spendMap.get(t.customer_id) ?? 0) + Number(t.amount));
      }
    });
    const list = ((custs as Customer[]) ?? []).map((c) => ({ ...c, totalSpend: spendMap.get(c.id) ?? 0 }));
    setItems(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tier-members")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const grouped = useMemo(() => {
    const g = { silver: [] as CustomerSpend[], gold: [] as CustomerSpend[], diamond: [] as CustomerSpend[] };
    items.forEach((c) => { g[getTier(c.points, thresholds).key].push(c); });
    return g;
  }, [items, thresholds]);

  const filtered = grouped[activeTier];

  const tierCards: { key: "silver" | "gold" | "diamond"; name: string; gradient: string; ring: string; textClass: string }[] = [
    { key: "silver", name: "HẠNG BẠC", gradient: "from-slate-100 to-slate-300", ring: "ring-slate-400", textClass: "text-slate-800" },
    { key: "gold", name: "HẠNG VÀNG", gradient: "from-amber-200 to-amber-500", ring: "ring-amber-500", textClass: "text-amber-950" },
    { key: "diamond", name: "HẠNG KIM CƯƠNG", gradient: "from-neutral-800 to-neutral-950", ring: "ring-neutral-900", textClass: "text-amber-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Quản lý hạng thành viên</h1>
        <p className="text-sm text-muted-foreground">Tổng quan số lượng khách theo từng hạng và tổng doanh thu từng khách hàng.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tierCards.map((t) => {
          const count = grouped[t.key].length;
          const active = activeTier === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTier(t.key)}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradient} p-5 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${active ? `ring-4 ${t.ring}` : "ring-1 ring-black/5"}`}
            >
              <div className={`text-xs font-bold tracking-[0.18em] ${t.textClass} opacity-80`}>HẠNG THÀNH VIÊN</div>
              <div className={`mt-1 font-serif text-2xl font-black ${t.textClass}`} style={{ fontFamily: "'Times New Roman', serif" }}>
                {t.name}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className={`text-5xl font-black leading-none ${t.textClass}`}>{count}</div>
                  <div className={`mt-1 text-xs font-bold ${t.textClass} opacity-80`}>Khách hàng</div>
                </div>
                <Crown className={`h-10 w-10 ${t.textClass} opacity-40 transition group-hover:opacity-70`} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-black text-brand-navy">
            Danh sách {tierCards.find((c) => c.key === activeTier)?.name} ({filtered.length})
          </h2>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Họ và Tên</th>
                <th className="px-4 py-3 text-left font-bold">Số điện thoại</th>
                <th className="px-4 py-3 text-left font-bold">Hạng hiện tại</th>
                <th className="px-4 py-3 text-right font-bold">Tổng tiền đã mua (VNĐ)</th>
                <th className="px-4 py-3 text-right font-bold">Số điểm hiện có</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Đang tải dữ liệu…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chưa có khách hàng nào ở hạng này.</td></tr>
              )}
              {filtered.map((c) => {
                const tier = getTier(c.points, thresholds);
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setQuickAdd(c)}
                        className="font-bold text-brand-navy hover:text-brand-red hover:underline"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${tierPillClass(tier.key)}`}>{tier.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-brand-navy">
                      {formatVnd(c.totalSpend)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base font-black text-brand-red">{c.points}</span>
                      <span className="ml-1 text-xs font-bold text-muted-foreground">điểm</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => setDetail(c)} size="sm" variant="ghost" className="h-9 rounded-xl text-xs font-bold text-brand-navy">
                          <History className="mr-1 h-4 w-4" /> Lịch sử
                        </Button>
                        <Button onClick={() => setQuickAdd(c)} size="sm" className="h-9 rounded-xl bg-brand-red px-3 text-xs font-black text-brand-red-foreground hover:bg-brand-red/90">
                          <Plus className="mr-1 h-4 w-4" /> Cộng điểm
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile card list */}
        <ul className="divide-y md:hidden">
          {loading && <li className="px-4 py-8 text-center text-muted-foreground">Đang tải dữ liệu…</li>}
          {!loading && filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-muted-foreground">Chưa có khách hàng nào ở hạng này.</li>
          )}
          {filtered.map((c) => {
            const tier = getTier(c.points, thresholds);
            return (
              <li key={c.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setQuickAdd(c)} className="min-w-0 text-left">
                    <div className="truncate text-base font-black text-brand-navy">{c.name}</div>
                    <div className="font-mono text-sm text-muted-foreground">{c.phone}</div>
                  </button>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tierPillClass(tier.key)}`}>{tier.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tổng tiền: <span className="font-black text-brand-navy">{formatVnd(c.totalSpend)}</span></span>
                  <span><span className="text-base font-black text-brand-red">{c.points}</span> <span className="text-xs font-bold text-muted-foreground">điểm</span></span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setDetail(c)} size="sm" variant="outline" className="h-11 flex-1 rounded-xl text-sm font-bold text-brand-navy">
                    <History className="mr-1 h-4 w-4" /> Lịch sử
                  </Button>
                  <Button onClick={() => setQuickAdd(c)} size="sm" className="h-11 flex-1 rounded-xl bg-brand-red text-sm font-black text-brand-red-foreground hover:bg-brand-red/90">
                    <Plus className="mr-1 h-4 w-4" /> Cộng điểm
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {quickAdd && (
        <QuickAddPointsModal
          customer={quickAdd}
          staff={staff}
          onClose={() => setQuickAdd(null)}
          onSaved={() => { setQuickAdd(null); load(); }}
        />
      )}

      {detail && (
        <CustomerHistoryModal customer={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function CustomerHistoryModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", customer.id)
        .gte("created_at", oneYearAgo.toISOString())
        .order("created_at", { ascending: false });
      setItems((data as Transaction[]) ?? []);
      setLoading(false);
    })();
  }, [customer.id]);

  function fmtTime(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  function fmtMoney(n: number | null) {
    const v = n ?? 0;
    return v.toLocaleString("vi-VN") + "đ";
  }
  function typeLabel(t: Transaction) {
    const reason = (t.reason ?? "").toUpperCase();
    if (t.type === "void" || reason.includes("[ĐÃ HỦY")) {
      return { text: "Đã hủy do nhập sai", cls: "bg-red-100 text-red-700 border border-red-300" };
    }
    if (t.type === "redeem" || t.points_change < 0) {
      return { text: "Đổi quà tặng", cls: "bg-orange-100 text-orange-700 border border-orange-300" };
    }
    return { text: "Cộng điểm mua hàng", cls: "bg-emerald-100 text-emerald-700 border border-emerald-300" };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose} style={{ fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif" }}>
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b bg-brand-navy px-5 py-4 text-brand-navy-foreground">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">Lịch sử mua hàng · 12 tháng gần nhất</div>
            <div className="text-lg font-black">{customer.name} · {customer.phone}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[75vh] overflow-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Đang tải lịch sử...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Chưa có giao dịch nào trong 1 năm gần đây.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm" style={{ fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif" }}>
                <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-brand-navy">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-3 text-left">Thời gian</th>
                    <th className="whitespace-nowrap px-3 py-3 text-left">Loại hoạt động</th>
                    <th className="px-3 py-3 text-left">Nội dung / Sản phẩm</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Số tiền hóa đơn</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Biến động điểm</th>
                    <th className="whitespace-nowrap px-3 py-3 text-left">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => {
                    const lbl = typeLabel(t);
                    const isVoid = t.type === "void" || (t.reason ?? "").toUpperCase().includes("[ĐÃ HỦY");
                    const pos = t.points_change > 0;
                    return (
                      <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-foreground/80">{fmtTime(t.created_at)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${lbl.cls}`}>{lbl.text}</span>
                        </td>
                        <td className="px-3 py-3 text-foreground/90">{t.reason || <span className="text-muted-foreground italic">—</span>}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-brand-navy">{fmtMoney(t.amount)}</td>
                        <td className={`whitespace-nowrap px-3 py-3 text-right font-black ${isVoid ? "text-red-600 line-through" : pos ? "text-emerald-600" : "text-orange-600"}`}>
                          {pos ? "+" : ""}{t.points_change}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground/80">{t.staff_name || <span className="text-muted-foreground italic">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SystemConfigSection() {
  const [settings, setSettings] = useState<ZnsSettings>(DEFAULT_ZNS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadZnsSettings()
      .then(setSettings)
      .catch((e) => toast.error("Không tải được cấu hình: " + (e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await saveZnsSettings(settings);
      toast.success("Đã lưu cấu hình Zalo ZNS");
    } catch (e) {
      toast.error("Lỗi lưu: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-brand-navy">Cấu hình hệ thống</h2>
        <p className="text-sm text-muted-foreground">Khu vực dành cho Quản lý — cấu hình tích hợp dịch vụ bên ngoài.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-brand-navy">🔌 CẤU HÌNH LIÊN KẾT ZALO OA (ZNS)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Khung kết nối Zalo Notification Service. Khi nào công ty có tài khoản Zalo OA, hãy điền mã vào và <b>BẬT</b> nút bên dưới để hệ thống bắt đầu gửi tin nhắn cộng/trừ điểm tự động.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
            />
            <span className={`text-xs font-bold ${settings.enabled ? "text-emerald-600" : "text-muted-foreground"}`}>
              {settings.enabled ? "ĐANG BẬT" : "ĐANG TẮT"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-bold text-brand-navy">Zalo Access Token</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={settings.access_token}
                onChange={(e) => setSettings((s) => ({ ...s, access_token: e.target.value }))}
                placeholder="Dán Access Token Zalo OA tại đây..."
                className="h-11 rounded-xl font-mono text-sm"
              />
              <Button type="button" variant="outline" onClick={() => setShowToken((v) => !v)} className="h-11 rounded-xl">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-brand-navy">Zalo Template ID (Cộng điểm)</Label>
            <Input
              value={settings.template_id_add}
              onChange={(e) => setSettings((s) => ({ ...s, template_id_add: e.target.value }))}
              placeholder="VD: 123456"
              className="mt-1 h-11 rounded-xl font-mono text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-bold text-brand-navy">Zalo Template ID (Đổi quà)</Label>
            <Input
              value={settings.template_id_redeem}
              onChange={(e) => setSettings((s) => ({ ...s, template_id_redeem: e.target.value }))}
              placeholder="VD: 654321"
              className="mt-1 h-11 rounded-xl font-mono text-sm"
            />
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="h-12 w-full rounded-xl bg-brand-navy text-base font-bold text-white hover:bg-brand-navy/90"
          >
            {saving ? "Đang lưu..." : "💾 Lưu cấu hình"}
          </Button>
        </div>

        <div className="mt-5 rounded-xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-2 font-bold text-brand-navy">📋 Mẫu tin nhắn đã cấu hình sẵn:</p>
          <p className="mb-2">
            <b>Cộng điểm:</b> "Kính chào anh/chị [Họ và Tên], Yến sào Trí Sơn thông báo bạn vừa được cộng +[Số điểm mới] điểm từ hóa đơn mua hàng ngày [Ngày giao dịch]. Tổng điểm hiện tại: [Tổng điểm] điểm (Hạng [Tên Hạng]). Ngày hết hạn thẻ: [Valid Through]. Cảm ơn bạn!"
          </p>
          <p>
            <b>Đổi quà:</b> "Kính chào anh/chị [Họ và Tên], bạn đã đổi thành công phần quà [[Tên quà]] (Mã: [Mã sản phẩm]). Tài khoản thành viên Trí Sơn của bạn đã trừ -[Số điểm quà] điểm. Số điểm còn lại: [Tổng điểm] điểm. Cảm ơn bạn!"
          </p>
        </div>
      </div>
    </div>
  );
}

