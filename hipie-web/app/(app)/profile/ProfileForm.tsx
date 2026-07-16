"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  userId,
  initialNickname,
  initialAvatarUrl,
}: {
  userId: string;
  initialNickname: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setError(null);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file);
      if (upErr) throw upErr;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data
        .publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (updErr) throw updErr;

      setAvatarUrl(publicUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({ nickname })
      .eq("id", userId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-[var(--ink)]">
          프로필 사진
        </span>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--forest-light)] text-2xl">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              "🐤"
            )}
          </div>
          <label className="cursor-pointer rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--cream)]">
            {uploading ? "업로드 중..." : "사진 변경"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
            />
          </label>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink)]">
            닉네임
          </label>
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--forest)]"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "var(--forest)" }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="ml-3 text-sm text-[var(--forest)]">저장됐어요 ✓</span>}
      </form>
    </div>
  );
}
