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

  return (
    <Link
      href={`/party/${party.id}`}
      className="group relative flex flex-col rounded-2xl border border-[var(--line)] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* 우측 상단: 유통기한 임박도 */}
      <span
        className="absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-bold"
        style={{ color: u.text, background: u.bg }}
      >
        ⏰ {u.label}
      </span>

      {/* 좌측 상단: 찜하기 */}
      <button
        onClick={toggleFav}
        aria-label="찜하기"
        className="absolute left-5 top-5 text-2xl transition hover:scale-110"
      >
        {fav ? "❤️" : "🤍"}
      </button>

      <div className="mt-8 flex items-start gap-3.5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--forest-light)] text-3xl">
          {emoji}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-[18px] font-bold text-[var(--ink)]">
            {party.title}
          </h4>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">
            {party.host?.nickname ?? "익명"} · 총 {party.total_amount}
          </p>
        </div>
      </div>

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
