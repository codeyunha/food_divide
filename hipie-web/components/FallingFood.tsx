import type { CSSProperties } from "react";

// 배경에 천천히 떨어지는 음식들. 위치/속도/지연을 고정값으로 두어
// SSR 하이드레이션 불일치 없이 CSS 애니메이션만으로 동작한다.
type Drop = {
  e: string;
  left: number; // %
  size: number; // px
  dur: number; // s (클수록 느림)
  delay: number; // s
  drift: number; // px (좌우로 흐르는 정도)
  spin: number; // deg (회전)
};

const FOODS: Drop[] = [
  { e: "🍕", left: 4, size: 34, dur: 15, delay: 0, drift: 30, spin: 200 },
  { e: "🍜", left: 12, size: 28, dur: 19, delay: 5, drift: -24, spin: -160 },
  { e: "🍎", left: 20, size: 26, dur: 13, delay: 2, drift: 18, spin: 320 },
  { e: "🥐", left: 28, size: 30, dur: 17, delay: 8, drift: -30, spin: 180 },
  { e: "🍰", left: 36, size: 30, dur: 21, delay: 1, drift: 22, spin: -240 },
  { e: "🥕", left: 44, size: 24, dur: 14, delay: 6, drift: -16, spin: 300 },
  { e: "🍞", left: 52, size: 32, dur: 18, delay: 3, drift: 28, spin: -140 },
  { e: "🧀", left: 60, size: 26, dur: 16, delay: 9, drift: -22, spin: 220 },
  { e: "🍳", left: 68, size: 30, dur: 20, delay: 4, drift: 20, spin: -300 },
  { e: "🥦", left: 76, size: 26, dur: 13, delay: 7, drift: -18, spin: 260 },
  { e: "🍲", left: 84, size: 32, dur: 22, delay: 2, drift: 26, spin: -180 },
  { e: "🍙", left: 92, size: 28, dur: 15, delay: 10, drift: -28, spin: 200 },
  { e: "🍅", left: 16, size: 24, dur: 18, delay: 11, drift: 16, spin: -260 },
  { e: "🥬", left: 48, size: 30, dur: 24, delay: 12, drift: -20, spin: 160 },
  { e: "🍩", left: 72, size: 28, dur: 17, delay: 13, drift: 24, spin: -220 },
  { e: "🥑", left: 32, size: 26, dur: 20, delay: 9, drift: -26, spin: 280 },
];

export default function FallingFood() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {FOODS.map((f, i) => (
        <span
          key={i}
          className="falling-food"
          style={
            {
              left: `${f.left}%`,
              fontSize: `${f.size}px`,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
              "--drift": `${f.drift}px`,
              "--spin": `${f.spin}deg`,
            } as CSSProperties
          }
        >
          {f.e}
        </span>
      ))}
    </div>
  );
}
