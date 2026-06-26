import lotusBg from "@/assets/lotus-bg.jpg.asset.json";
import lotusCorner from "@/assets/lotus-corner.png.asset.json";
import lotusLeaf from "@/assets/lotus-leaf.png.asset.json";

/**
 * Trang trí nền hoa sen + họa tiết góc.
 * - Hình nền lotus pond opacity rất thấp (~12%) làm nền chìm cho toàn trang.
 * - Họa tiết góc (cành sen + lá sen) chỉ hiện trên màn ≥ md (ẩn trên mobile).
 */
export function LotusScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Hình nền đầm sen mờ */}
      <img
        src={lotusBg.url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.12] md:opacity-[0.14]"
        style={{ filter: "blur(2px) saturate(0.9)" }}
        loading="lazy"
      />
      {/* Lớp phủ trắng dịu để giữ chữ luôn dễ đọc */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />

      {/* Lá sen góc trên-phải (ẩn trên mobile) */}
      <img
        src={lotusLeaf.url}
        alt=""
        className="absolute -right-32 -top-32 hidden h-[420px] w-[420px] rotate-12 opacity-30 md:block lg:h-[520px] lg:w-[520px]"
        loading="lazy"
      />
      {/* Cành sen góc dưới-trái (ẩn trên mobile) */}
      <img
        src={lotusCorner.url}
        alt=""
        className="absolute -bottom-20 -left-24 hidden h-[440px] w-[440px] -rotate-12 opacity-40 md:block lg:h-[560px] lg:w-[560px]"
        loading="lazy"
      />
    </div>
  );
}
