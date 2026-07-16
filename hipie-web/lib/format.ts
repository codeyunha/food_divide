export function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export function dateKo(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function daysLeft(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export type Urgency = { label: string; text: string; bg: string };

/** 유통기한 임박도 → 라벨/색상. 임박할수록 빨강. */
export function urgency(iso: string): Urgency {
  const left = daysLeft(iso);
  if (left < 0) return { label: "기한 지남", text: "#fff", bg: "#9AA5A0" };
  if (left === 0) return { label: "오늘 마감", text: "#fff", bg: "#E24B4A" };
  if (left === 1) return { label: "D-1", text: "#fff", bg: "#F0563F" };
  if (left === 2) return { label: "D-2", text: "#fff", bg: "#FF7A50" };
  if (left === 3) return { label: "D-3", text: "#7A5300", bg: "#FFD873" };
  return { label: `D-${left}`, text: "var(--forest)", bg: "var(--forest-light)" };
}

const EMOJI = ["🥕", "🥬", "🍅", "🥚", "🐟", "🥩", "🍲", "🍗", "🍧", "🌶️", "🧅", "🧄"];
export function tagEmoji(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return EMOJI[h % EMOJI.length];
}
