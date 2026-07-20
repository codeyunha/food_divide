export function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export function dateKo(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 서버 타임존(주로 UTC)과 무관하게 KST(UTC+9) 기준 오늘 날짜의 자정(UTC epoch)을 구한다. */
function todayKstMidnight() {
  const kstNow = new Date(Date.now() + KST_OFFSET_MS);
  return Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate());
}

export function daysLeft(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  return Math.round((target - todayKstMidnight()) / 86400000);
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

/** 상대 시간 표시 (커뮤니티 게시글/댓글용) */
export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return dateKo(iso);
}

const EMOJI = ["🥕", "🥬", "🍅", "🥚", "🐟", "🥩", "🍲", "🍗", "🍧", "🌶️", "🧅", "🧄"];
export function tagEmoji(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return EMOJI[h % EMOJI.length];
}
