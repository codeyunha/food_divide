"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 게시글 작성자의 "내 그릇" 점수를 좋아요(+1)/싫어요(-1)로 평가.
 * cast_post_manner_vote RPC 사용 (같은 방향 재클릭 시 취소, 반대 클릭 시 전환).
 */
export default function PostMannerVoteButtons({
  postId,
  myVote,
}: {
  postId: string;
  myVote: 1 | -1 | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function vote(direction: 1 | -1) {
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.rpc("cast_post_manner_vote", {
      p_post_id: postId,
      p_vote: direction,
    });
    setLoading(false);
    if (error) {
      alert("평가에 실패했어요: " + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold transition disabled:opacity-60 ${
          myVote === 1
            ? "bg-[var(--forest)] text-white"
            : "bg-[var(--forest-light)] text-[var(--forest)] hover:opacity-80"
        }`}
      >
        👍 좋아요
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold transition disabled:opacity-60 ${
          myVote === -1
            ? "bg-red-400 text-white"
            : "bg-red-50 text-red-400 hover:opacity-80"
        }`}
      >
        👎 싫어요
      </button>
    </div>
  );
}
