import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { formatVnd, getTier, normalizePhone } from "@/lib/loyalty";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Quản trị - Yến sào Trí Sơn" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminView,
});

type Customer = { id: string; name: string; phone: string; points: number; created_at: string; birth_date: string | null };
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
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red text-brand-red-foreground">
            <Lock className="h-7 w-7" />
          </div>
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



type Section = "dashboard" | "customers" | "history" | "rewards";

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [staff, setStaff] = useState(() =>
    (typeof window !== "undefined" && localStorage.getItem("trison_staff")) || "Thu ngân"
  );

  const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
    { id: "customers", label: "Danh sách khách hàng", icon: Users },
    { id: "history", label: "Lịch sử giao dịch", icon: History },
    { id: "rewards", label: "Cài đặt quà tặng", icon: Gift },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red">
              <Sparkles className="h-5 w-5 text-brand-red-foreground" />
            </div>
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
        <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-black">TRÍ SƠN ADMIN</span>
          </div>
          <Button onClick={onLogout} variant="ghost" size="sm" className="text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                section === item.id ? "bg-brand-navy text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8">
          {section === "dashboard" && <Dashboard staff={staff} />}
          {section === "customers" && <CustomersSection />}
          {section === "history" && <HistorySection />}
          {section === "rewards" && <RewardsSection />}
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

  async function findCustomer(e?: React.FormEvent) {
    e?.preventDefault();
    const p = normalizePhone(phone);
    if (!p) return;
    setSearching(true);
    const { data } = await supabase.from("customers").select("*").eq("phone", p).maybeSingle();
    setCustomer((data as Customer) ?? null);
    if (!data) toast.error("Không tìm thấy khách hàng với SĐT này");
    setSearching(false);
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
        </div>
      </form>

      {customer && <PointsActions customer={customer} staff={staff} onChanged={(c) => { setCustomer(c); loadStats(); }} />}

      <div>
        <h2 className="mb-3 text-lg font-black text-brand-navy">Giao dịch hôm nay (Real-time)</h2>
        <TransactionList items={todayTx} />
      </div>
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
  const tier = getTier(customer.points);
  const points = useMemo(() => Math.floor(Number(amount.replace(/[^0-9]/g, "") || "0") / 100000), [amount]);

  async function commit(type: "add" | "subtract", overridePoints?: number) {
    const pts = overridePoints ?? points;
    if (!pts || pts <= 0) { toast.error("Vui lòng nhập số tiền hoặc số điểm hợp lệ"); return; }
    if (type === "subtract" && customer.points < pts) { toast.error("Khách không đủ điểm"); return; }
    setBusy(true);
    const change = type === "add" ? pts : -pts;
    const newPoints = customer.points + change;
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
        </div>
        <div className="rounded-xl px-4 py-2 text-center" style={{ background: tier.gradient, color: tier.text }}>
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

function TransactionList({ items }: { items: Transaction[] }) {
  const [names, setNames] = useState<Record<string, { name: string; phone: string }>>({});

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

  if (items.length === 0)
    return <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào.</div>;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
      <ul className="divide-y">
        {items.map((t) => {
          const c = names[t.customer_id];
          const time = new Date(t.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          const masked = c ? `${c.phone.slice(0, 4)}xxxxxx` : "...";
          const positive = t.points_change > 0;
          return (
            <li key={t.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full font-mono text-xs font-bold text-muted-foreground" style={{ background: "var(--muted)" }}>
                  {time}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {c?.name ?? "Khách"} <span className="font-mono text-xs text-muted-foreground">({masked})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.reason || "—"} • Bởi {t.staff_name || "?"}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-black ${positive ? "text-success" : "text-brand-red"}`}>
                {positive ? "+" : ""}{t.points_change}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CustomersSection() {
  const [items, setItems] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBirth, setNewBirth] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);

  async function load() {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setItems((data as Customer[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(newPhone);
    if (!newName.trim() || phone.length < 8) { toast.error("Vui lòng nhập đầy đủ Tên và SĐT hợp lệ"); return; }
    const { error } = await supabase.from("customers").insert({
      name: newName.trim(),
      phone,
      points: 0,
      birth_date: newBirth || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Đã thêm khách hàng");
    setNewName(""); setNewPhone(""); setNewBirth(""); load();
  }

  async function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((r) => r.split(",").map((c) => c.trim())).filter((r) => r.length >= 2 && r[0] && r[1]);
    const recs = rows
      .map(([name, phone, points, birth]) => ({
        name,
        phone: normalizePhone(phone),
        points: Number(points) || 0,
        birth_date: birth && /^\d{4}-\d{2}-\d{2}$/.test(birth) ? birth : null,
      }))
      .filter((r) => r.phone.length >= 8);
    if (recs.length === 0) { toast.error("File trống hoặc sai định dạng (cần: tên,SĐT,điểm,ngày sinh)"); return; }
    const { error } = await supabase.from("customers").upsert(recs, { onConflict: "phone" });
    if (error) toast.error(error.message);
    else toast.success(`Đã nhập ${recs.length} khách hàng`);
    load();
    e.target.value = "";
  }

  const filtered = items.filter((c) => c.phone.includes(q) || c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Danh sách khách hàng</h1>

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
          <div>
            <Label className="text-xs font-bold text-muted-foreground">🎂 Ngày sinh nhật</Label>
            <Input type="date" value={newBirth} onChange={(e) => setNewBirth(e.target.value)} className="mt-1 h-12 rounded-xl border-2" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-12 w-full rounded-xl bg-brand-navy font-bold text-brand-navy-foreground">Thêm khách hàng</Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-brand-navy/30 px-4 text-sm font-bold text-brand-navy hover:bg-accent">
            <Upload className="h-4 w-4" /> Tải lên file Excel/CSV khách cũ
            <input type="file" accept=".csv,.txt" className="hidden" onChange={onExcel} />
          </label>
          <p className="text-xs text-muted-foreground">Định dạng CSV: <code>tên,SĐT,điểm,ngày sinh (YYYY-MM-DD)</code></p>
        </div>
      </form>

      <div className="rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc SĐT..." className="h-11 rounded-xl border-2 pl-10" />
          </div>
        </div>
        <ul className="divide-y">
          {filtered.map((c) => {
            const tier = getTier(c.points);
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-sm font-mono text-muted-foreground">{c.phone}</div>
                  {c.birth_date && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      🎂 {formatBirth(c.birth_date)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full px-3 py-1 text-xs font-bold sm:inline" style={{ background: tier.gradient, color: tier.text }}>
                    {tier.name}
                  </span>
                  <span className="text-xl font-black text-brand-navy">{c.points}đ</span>
                  <Button onClick={() => setEditing(c)} size="sm" variant="ghost" className="text-brand-navy">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Không có khách hàng nào.</li>}
        </ul>
      </div>

      {editing && (
        <EditCustomerModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function HistorySection() {
  const [items, setItems] = useState<Transaction[]>([]);
  useEffect(() => {
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => {
      setItems((data as Transaction[]) ?? []);
    });
    const ch = supabase.channel("hist")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, (p) => {
        setItems((prev) => [p.new as Transaction, ...prev]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Lịch sử giao dịch</h1>
      <TransactionList items={items} />
    </div>
  );
}

type Reward = { id: string; name: string; description: string | null; points_required: number; active: boolean; image_url: string | null };

function RewardsSection() {
  const [items, setItems] = useState<Reward[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [pts, setPts] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function load() {
    const { data } = await supabase.from("rewards").select("*").order("points_required");
    setItems((data as Reward[]) ?? []);
  }
  useEffect(() => { load(); }, []);

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

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(pts);
    if (!name.trim() || !p) { toast.error("Vui lòng nhập tên và số điểm"); return; }
    const { error } = await supabase.from("rewards").insert({
      name: name.trim(),
      description: desc || null,
      points_required: p,
      image_url: imageUrl || null,
      active: true,
    });
    if (error) toast.error(error.message);
    else { toast.success("Đã thêm quà tặng"); setName(""); setDesc(""); setPts(""); setImageUrl(""); load(); }
  }

  async function updateImage(id: string) {
    const url = prompt("Dán URL hình ảnh quà tặng (https://...):", "");
    if (url === null) return;
    const { error } = await supabase.from("rewards").update({ image_url: url || null }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Đã cập nhật hình ảnh"); load(); }
  }

  async function remove(id: string) {
    if (!confirm("Xoá quà tặng này?")) return;
    await supabase.from("rewards").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-brand-navy md:text-3xl">Cài đặt quà tặng</h1>

      <form onSubmit={add} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên quà tặng" className="h-12 rounded-xl border-2" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả" className="h-12 rounded-xl border-2" />
          <Input value={pts} onChange={(e) => setPts(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Điểm cần" className="h-12 rounded-xl border-2" />
          <Button type="submit" className="h-12 rounded-xl bg-brand-navy font-bold text-brand-navy-foreground">Thêm</Button>
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
          <div key={r.id} className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
            {r.image_url ? (
              <img src={r.image_url} alt={r.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-40" />
              </div>
            )}
            <div className="flex items-start justify-between gap-2 p-4">
              <div>
                <div className="font-black text-foreground">{r.name}</div>
                {r.description && <div className="text-sm text-muted-foreground">{r.description}</div>}
                <div className="mt-2 text-sm font-bold text-brand-red">{r.points_required} điểm</div>
              </div>
              <div className="flex flex-col gap-1">
                <Button onClick={() => updateImage(r.id)} variant="ghost" size="sm" className="text-brand-navy">
                  <ImageIcon className="mr-1 h-4 w-4" /> Ảnh
                </Button>
                <Button onClick={() => remove(r.id)} variant="ghost" size="sm" className="text-brand-red">Xoá</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
