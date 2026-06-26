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
        className="absolute inset-0 h-full w-full object-cover opacity-[0.28] md:opacity-[0.32]"
        style={{ filter: "blur(1px) saturate(1.05)" }}
        loading="lazy"
      />
      {/* Lớp phủ trắng nhẹ để giữ chữ dễ đọc nhưng vẫn lộ hoa sen */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/40 to-white/65" />

      {/* Lá sen góc trên-phải (ẩn trên mobile) */}
      <img
        src={lotusLeaf.url}
        alt=""
        className="absolute -right-24 -top-24 hidden h-[420px] w-[420px] rotate-12 opacity-70 md:block lg:h-[540px] lg:w-[540px]"
        loading="lazy"
      />
      {/* Cành sen góc dưới-trái (ẩn trên mobile) */}
      <img
        src={lotusCorner.url}
        alt=""
        className="absolute -bottom-16 -left-16 hidden h-[460px] w-[460px] -rotate-6 opacity-80 md:block lg:h-[580px] lg:w-[580px]"
        loading="lazy"
      />
    </div>
  );
}
