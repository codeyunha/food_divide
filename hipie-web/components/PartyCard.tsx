"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Party } from "@/lib/types";
import { won, tagEmoji, urgency } from "@/lib/format";

export default function PartyCard({
  party,
  initialFavorite = false,
}: {
  party: Party;
  initialFavorite?: boolean;
}) {
  const supabase = createClient();
  const [fav, setFav] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);
  const emoji = tagEmoji(party.tags?.[0] ?? party.title);
  const u = urgency(party.expiry_date);

  const joined = party.member_count ?? 1;
  const cap = party.capacity ?? 0;

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }
    if (fav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("party_id", party.id);
      setFav(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, party_id: party.id });
      setFav(true);
    }
    setBusy(false);
  }

  const cover = party.photos?.[0] ?? null;

  return (
    <Link
      href={`/party/${party.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* 커버: 유저가 올린 음식 사진 (없으면 이모지 플레이스홀더) */}
      <div className="relative h-44 w-full overflow-hidden bg-[var(--forest-light)]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={party.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {emoji}
          </div>
        )}

        {/* 우측 상단: 유통기한 임박도 */}
        <span
          className="absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
          style={{ color: u.text, background: u.bg }}
        >
          ⏰ {u.label}
        </span>

        {/* 좌측 상단: 찜하기 */}
        <button
          onClick={toggleFav}
          aria-label="찜하기"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-xl shadow-sm backdrop-blur transition hover:scale-110"
        >
          {fav ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="flex flex-col p-6 pt-4">
        <h4 className="truncate text-[18px] font-bold text-[var(--ink)]">
          {party.title}
        </h4>
        <p className="mt-0.5 text-[13px] text-[var(--muted)]">
          {party.host?.nickname ?? "익명"} · 총 {party.total_amount}
        </p>

        {party.description && (
          <p className="mt-3.5 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
            {party.description}
          </p>
        )}

        {party.tags?.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {party.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--peach-2)] px-2.5 py-1 text-xs font-medium text-[var(--peach)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 참여 인원 시각화 */}
        <div className="mt-5 border-t border-[var(--line)] pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <Participation joined={joined} cap={cap} />
          <span className="text-[17px] font-bold text-[var(--ink)]">
            {won(party.price)}
          </span>
        </div>
        {cap > 0 && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--forest-light)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (joined / cap) * 100)}%`,
                background: joined >= cap ? "var(--peach)" : "var(--forest-2)",
              }}
            />
          </div>
        )}
        </div>
      </div>
    </Link>
  );
}

function Participation({ joined, cap }: { joined: number; cap: number }) {
  // capacity가 있으면 사람 아이콘으로 채움/빈칸 표시, 없으면 참여수만
  const total = cap > 0 ? Math.min(cap, 8) : Math.min(joined, 8);
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="text-sm leading-none"
            style={{ opacity: i < joined ? 1 : 0.25 }}
          >
            {i < joined ? "🧑" : "⚪"}
          </span>
        ))}
      </span>
      <span className="text-[12.5px] font-semibold text-[var(--forest)]">
        {joined}
        {cap > 0 ? `/${cap}` : ""}명
        {cap > 0 && joined >= cap ? " 마감" : " 참여중"}
      </span>
    </div>
  );
}
