"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageHead from "@/components/PageHead";

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("제목을 입력해주세요.");
    if (!content.trim()) return setError("내용을 입력해주세요.");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const f = images[i];
        const path = `${user.id}/${Date.now()}-${i}-${f.name}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, f);
        if (upErr) throw upErr;
        imageUrls.push(
          supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl
        );
      }

      const { data, error: insErr } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          images: imageUrls,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      router.push(`/community/${data!.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--forest)] bg-white";
  const label = "mb-1.5 block text-[13px] font-semibold text-[var(--ink)]";

  return (
    <div className="max-w-2xl">
      <PageHead title="글쓰기" subtitle="이웃과 나누고 싶은 이야기를 남겨보세요" />

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={label}>제목 *</label>
          <input
            required
            className={field}
            placeholder="제목을 입력하세요"
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
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div>
          <label className={label}>이미지 (선택, 여러 장 가능)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className={field}
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
          {images.length > 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">{images.length}장 선택됨</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
          style={{ background: "var(--forest)" }}
        >
          {loading ? "등록 중..." : "게시하기"}
        </button>
      </form>
    </div>
  );
}
