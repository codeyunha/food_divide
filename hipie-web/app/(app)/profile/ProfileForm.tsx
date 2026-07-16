"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  userId,
  initialNickname,
}: {
  userId: string;
  initialNickname: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [nickname, setNickname] = useState(initialNickname);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
    <form onSubmit={save} className="max-w-sm space-y-3">
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
  );
}
