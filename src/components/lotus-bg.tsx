// Decorative lotus motif inspired by Vietnamese airline membership cards.
// Positioned absolutely at the bottom-right of the parent.

export function LotusBg({ tone = "pink" }: { tone?: "pink" | "gold" | "silver" }) {
  const palette = {
    pink:   { a: "#f9c7d3", b: "#e98aa4", c: "#c75d7c" },
    gold:   { a: "#f6dca1", b: "#e9b665", c: "#a87a2c" },
    silver: { a: "#ffffff", b: "#e6e9ef", c: "#aab0bb" },
  }[tone];

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      className="pointer-events-none absolute -bottom-12 -right-10 h-[110%] w-[78%] opacity-90 mix-blend-screen"
      style={{ filter: "blur(0.3px)" }}
    >
      <defs>
        <radialGradient id="petalGrad" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={palette.a} stopOpacity="0.95" />
          <stop offset="60%" stopColor={palette.b} stopOpacity="0.6" />
          <stop offset="100%" stopColor={palette.c} stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <g fill="url(#petalGrad)">
        {/* Stylised lotus petals fanning up from bottom-right */}
        <path d="M210 380 C170 300, 175 220, 210 140 C245 220, 250 300, 210 380 Z" />
        <path d="M260 380 C240 300, 260 215, 320 150 C320 240, 305 320, 260 380 Z" opacity="0.85" />
        <path d="M160 380 C180 300, 160 215, 100 150 C100 240, 115 320, 160 380 Z" opacity="0.85" />
        <path d="M300 380 C300 310, 340 240, 395 200 C390 280, 360 350, 300 380 Z" opacity="0.7" />
        <path d="M120 380 C120 310, 80 240, 25 200 C30 280, 60 350, 120 380 Z" opacity="0.7" />
        <path d="M210 380 C195 340, 205 300, 210 270 C215 300, 225 340, 210 380 Z" opacity="1" />
      </g>
      {/* soft halo */}
      <circle cx="210" cy="280" r="60" fill={palette.a} opacity="0.25" />
    </svg>
  );
}
