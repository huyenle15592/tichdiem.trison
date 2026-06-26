import lotusCorner from "@/assets/lotus-corner.png.asset.json";

/**
 * Nền tối giản thượng lưu: ivory phẳng + một họa tiết sen rất mờ ở góc dưới.
 * Chỉ hiển thị trên màn ≥ md để mobile giữ tối giản tuyệt đối.
 */
export function LotusScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <img
        src={lotusCorner}
        alt=""
        className="absolute -bottom-24 -right-24 hidden h-[360px] w-[360px] opacity-[0.05] md:block lg:h-[460px] lg:w-[460px]"
        style={{ filter: "grayscale(0.2)" }}
        loading="lazy"
      />
    </div>
  );
}
