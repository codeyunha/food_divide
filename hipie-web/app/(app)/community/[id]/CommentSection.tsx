"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export default function CommentSection({
  postId,
  userId,
  initialComments,
}: {
  postId: string;
  userId: string | null;
  initialComments: Comment[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const content = text.trim();
    if (!content) return;

    setPosting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: userId, content })
      .select("id, post_id, author_id, content, created_at")
      .single();
    setPosting(false);
    if (!error && data) {
      setText("");
      setComments((prev) => [...prev, data as Comment]);
      router.refresh();
    }
  }

  async function remove(commentId: string) {
    if (!confirm("댓글을 삭제하시겠어요?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      router.refresh();
    }
  }

  return (
    <div className="mt-7 rounded-2xl border border-[var(--line)] bg-white p-7">
      <h3 className="mb-5 text-lg font-bold text-[var(--ink)]">
        댓글 {comments.length}
      </h3>

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="py-4 text-center text-[15px] text-[var(--muted)]">
            첫 댓글을 남겨보세요!
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3.5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--forest-light)] text-lg">
              {c.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.author.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                "🐤"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--ink)]">
                  {c.author?.nickname ?? "익명"}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="mt-1 text-[15px] leading-relaxed text-[var(--ink)]">
                {c.content}
              </p>
            </div>
            {userId === c.author_id && (
              <button
                onClick={() => remove(c.id)}
                className="flex-shrink-0 self-start text-[13px] text-[var(--muted)] hover:text-red-500"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>

      {userId ? (
        <form onSubmit={submit} className="mt-6 flex gap-2.5 border-t border-[var(--line)] pt-5">
          <input
            className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3 text-[15px] outline-none focus:border-[var(--forest)]"
            placeholder="댓글을 입력하세요"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-xl px-6 text-[15px] font-bold text-white disabled:opacity-60"
            style={{ background: "var(--forest)" }}
          >
            등록
          </button>
        </form>
      ) : (
        <p className="mt-6 border-t border-[var(--line)] pt-5 text-center text-[13px] text-[var(--muted)]">
          로그인하면 댓글을 남길 수 있어요
        </p>
      )}
    </div>
  );
}
