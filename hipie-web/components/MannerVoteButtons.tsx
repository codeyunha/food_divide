"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MannerVoteButtons({
  partyId,
  myVote,
}: {
  partyId: string;
  myVote: 1 | -1 | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function vote(direction: 1 | -1) {
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.rpc("cast_manner_vote", {
      p_party_id: partyId,
      p_vote: direction,
    });
    setLoading(false);
    if (error) {
      alert("투표에 실패했어요: " + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={loading}
        title="추천"
        className={`rounded-full px-2 py-0.5 text-[13px] font-bold transition disabled:opacity-60 ${
          myVote === 1
            ? "bg-[var(--forest)] text-white"
            : "bg-[var(--forest-light)] text-[var(--forest)] hover:opacity-80"
        }`}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={loading}
        title="비추천"
        className={`rounded-full px-2 py-0.5 text-[13px] font-bold transition disabled:opacity-60 ${
          myVote === -1
            ? "bg-red-400 text-white"
            : "bg-red-50 text-red-400 hover:opacity-80"
        }`}
      >
        👎
      </button>
    </span>
  );
}
