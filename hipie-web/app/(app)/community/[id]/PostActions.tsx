"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("이 게시글을 삭제하시겠어요? 댓글도 모두 삭제되며 되돌릴 수 없어요.")) return;
    setLoading(true);
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    setLoading(false);
    if (!error) {
      router.push("/community");
      router.refresh();
    } else {
      alert("삭제에 실패했어요: " + error.message);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/community/${postId}/edit`}
        className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--cream)]"
      >
        수정
      </Link>
      <button
        onClick={remove}
        disabled={loading}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
      >
        삭제
      </button>
    </div>
  );
}
