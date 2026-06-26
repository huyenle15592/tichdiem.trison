import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, ShieldCheck, ArrowRight } from "lucide-react";
import trisonLogo from "@/assets/trison-logo.png.asset.json";
import { LotusScene } from "@/components/lotus-scene";

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
    <div className="relative min-h-screen bg-transparent">
      <LotusScene />
      <header className="relative mx-auto max-w-6xl px-4 pt-6 pb-1 text-center sm:px-5 sm:pt-10 md:pt-14">
        <img
          src={trisonLogo.url}
          alt="Yến sào Trí Sơn"
          className="mx-auto h-28 w-auto sm:h-40 md:h-56"
          style={{ mixBlendMode: "multiply" }}
        />
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-brand-navy sm:mt-3 sm:text-4xl md:mt-4 md:text-6xl">
          YẾN SÀO <span className="text-brand-red">TRÍ SƠN</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-muted-foreground sm:text-base md:text-lg">
          Hệ thống Tích điểm Thành viên — Tri ân khách hàng{"\u00a0"}
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-2 md:gap-8 md:py-16">
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

      <footer className="px-5 pb-10 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
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
      className="group relative block overflow-hidden rounded-[28px] border border-border/70 bg-white p-8 text-left transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:p-10"
      style={{
        boxShadow: "var(--shadow-float)",
        // @ts-expect-error custom prop
        "--tw-ring-color": borderColor,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: isNavy
            ? "radial-gradient(700px 240px at 50% 0%, oklch(0.27 0.09 260 / 0.06), transparent 70%)"
            : "radial-gradient(700px 240px at 50% 0%, oklch(0.55 0.22 27 / 0.06), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <div
          className="grid h-24 w-24 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 md:h-28 md:w-28"
          style={{ background: iconBg, color: iconColor, boxShadow: "var(--shadow-soft)" }}
        >
          {icon}
        </div>
        <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className={`mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-[28px] ${titleClass}`}>
          {title}
        </h2>
        <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
        <div
          className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold text-white transition-all duration-300 group-hover:gap-3 md:text-[17px]"
          style={{ background: borderColor, boxShadow: "var(--shadow-soft)" }}
        >
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
