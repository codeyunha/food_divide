"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditPostForm({
  postId,
  initialTitle,
  initialContent,
}: {
  postId: string;
  initialTitle: string;
  initialContent: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("제목을 입력해주세요.");
    if (!content.trim()) return setError("내용을 입력해주세요.");

    setLoading(true);
    const { error: updErr } = await supabase
      .from("posts")
      .update({ title: title.trim(), content: content.trim() })
      .eq("id", postId);
    setLoading(false);
    if (updErr) return setError(updErr.message);

    router.push(`/community/${postId}`);
    router.refresh();
  }

  const field =
    "w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)] bg-white";
  const label = "mb-1.5 block text-[13px] font-semibold text-[var(--ink)]";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className={label}>제목 *</label>
        <input
          required
          className={field}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className={label}>내용 *</label>
        <textarea
          required
          rows={8}
          className={field}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
        style={{ background: "var(--forest)" }}
      >
        {loading ? "저장 중..." : "수정 완료"}
      </button>
    </form>
  );
}
