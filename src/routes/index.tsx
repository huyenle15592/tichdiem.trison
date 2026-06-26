import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import trisonLogo from "@/assets/trison-logo.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yến sào Trí Sơn - Cổng thành viên" },
      {
        name: "description",
        content:
          "Cổng điều hướng hệ thống tích điểm thành viên Yến sào Trí Sơn dành cho khách hàng và nhân viên.",
      },
    ],
  }),
  component: PortalView,
});

function PortalView() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, oklch(0.95 0.04 27 / 0.6), transparent 60%), radial-gradient(1000px 500px at 110% 10%, oklch(0.9 0.05 260 / 0.5), transparent 60%), oklch(0.97 0.005 260)",
      }}
    >
      <header className="mx-auto max-w-6xl px-5 pt-8 pb-2 text-center md:pt-14">
        <img
          src={trisonLogo.url}
          alt="Yến sào Trí Sơn"
          className="mx-auto h-28 w-auto md:h-36 drop-shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        />
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-navy/15 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-navy shadow-[var(--shadow-soft)] backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-brand-red" /> Thương hiệu cao cấp
        </div>
        <h1 className="mt-5 text-3xl font-black leading-tight text-brand-navy md:text-5xl">
          YẾN SÀO <span className="text-brand-red">TRÍ SƠN</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-medium text-muted-foreground md:text-lg">
          Hệ thống Tích điểm Thành viên — Tri ân khách hàng & quản trị nội bộ.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:grid-cols-2 md:gap-7 md:py-12">
        <PortalCard
          to="/khach-hang"
          accent="navy"
          icon={<Crown className="h-12 w-12 md:h-14 md:w-14" strokeWidth={2.2} />}
          eyebrow="Member Portal"
          title="DÀNH CHO KHÁCH HÀNG"
          titleClass="text-brand-red"
          description="Quét mã tra cứu điểm thưởng, hạng thành viên và danh sách quà tặng tri ân."
          cta="Tra cứu điểm thành viên"
        />
        <PortalCard
          to="/admin"
          accent="red"
          icon={<ShieldCheck className="h-12 w-12 md:h-14 md:w-14" strokeWidth={2.2} />}
          eyebrow="Staff Portal"
          title="DÀNH CHO NHÂN VIÊN"
          titleClass="text-brand-navy"
          description="Hệ thống quản trị nội bộ dành cho thu ngân cộng/trừ điểm và xử lý đổi quà tại quầy."
          cta="Đăng nhập quản trị"
        />
      </main>

      <footer className="px-5 pb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        © {new Date().getFullYear()} Yến sào Trí Sơn
      </footer>
    </div>
  );
}

function PortalCard({
  to,
  accent,
  icon,
  eyebrow,
  title,
  titleClass,
  description,
  cta,
}: {
  to: string;
  accent: "red" | "navy";
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  titleClass: string;
  description: string;
  cta: string;
}) {
  const isNavy = accent === "navy";
  const borderColor = isNavy ? "var(--brand-navy)" : "var(--brand-red)";
  const iconColor = isNavy ? "var(--brand-navy)" : "var(--brand-red)";
  const iconBg = isNavy
    ? "linear-gradient(135deg, oklch(0.95 0.03 260), oklch(0.9 0.06 260))"
    : "linear-gradient(135deg, oklch(0.96 0.03 27), oklch(0.92 0.08 27))";

  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-3xl border-2 bg-card p-7 text-left shadow-[var(--shadow-soft)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 md:p-9"
      style={{
        borderColor,
        // @ts-expect-error custom prop
        "--tw-ring-color": borderColor,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isNavy
            ? "radial-gradient(600px 200px at 50% 0%, oklch(0.27 0.09 260 / 0.08), transparent 70%)"
            : "radial-gradient(600px 200px at 50% 0%, oklch(0.55 0.22 27 / 0.08), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <div
          className="grid h-24 w-24 place-items-center rounded-2xl shadow-[var(--shadow-soft)] transition-transform duration-300 group-hover:scale-110 md:h-28 md:w-28"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className={`mt-2 text-2xl font-black leading-tight md:text-3xl ${titleClass}`}>
          {title}
        </h2>
        <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
        <div
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-soft)] transition-all duration-300 group-hover:gap-3 group-hover:shadow-[var(--shadow-card)] md:text-base"
          style={{ background: borderColor }}
        >
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
