"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageHead from "@/components/PageHead";
import type { PartyType } from "@/lib/types";

function NewPartyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [type, setType] = useState<PartyType>(
    params.get("type") === "ingredient" ? "ingredient" : "finished"
  );
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [expiry, setExpiry] = useState("");
  const [amount, setAmount] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const tagList = tags
      .split(/[,#\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (photos.length === 0) return setError("실물 사진을 최소 1장 올려주세요.");
    if (!receipt) return setError("영수증 사진을 올려주세요.");
    if (tagList.length === 0) return setError("태그를 최소 1개 입력해주세요.");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // upload real photos (public bucket)
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const f = photos[i];
        const path = `${user.id}/${Date.now()}-${i}-${f.name}`;
        const { error: upErr } = await supabase.storage
          .from("party-photos")
          .upload(path, f);
        if (upErr) throw upErr;
        photoUrls.push(
          supabase.storage.from("party-photos").getPublicUrl(path).data.publicUrl
        );
      }

      // upload receipt (private bucket → store path)
      const receiptPath = `${user.id}/${Date.now()}-${receipt.name}`;
      const { error: rErr } = await supabase.storage
        .from("receipts")
        .upload(receiptPath, receipt);
      if (rErr) throw rErr;

      const { data, error: insErr } = await supabase
        .from("parties")
        .insert({
          host_id: user.id,
          type,
          title,
          photos: photoUrls,
          receipt_photo: receiptPath,
          tags: tagList,
          price: parseInt(price, 10),
          expiry_date: expiry,
          total_amount: amount,
          description: description || null,
          capacity: capacity ? parseInt(capacity, 10) : null,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      router.push(`/party/${data!.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-[var(--line)] px-4 py-3.5 text-[15px] outline-none focus:border-[var(--forest)] bg-white";
  const label = "mb-2 block text-sm font-semibold text-[var(--ink)]";

  return (
    <div className="max-w-2xl">
      <PageHead title="파티 개설" subtitle="나눌 음식의 정보를 정확히 등록해주세요" />

      <form onSubmit={submit} className="space-y-6">
        <div>
          <span className={label}>유형 *</span>
          <div className="flex gap-2.5">
            {(["finished", "ingredient"] as PartyType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-xl border py-3.5 text-[15px] font-bold transition ${
                  type === t
                    ? "border-[var(--forest)] bg-[var(--forest-light)] text-[var(--forest)]"
                    : "border-[var(--line)] bg-white text-[var(--muted)]"
                }`}
              >
                {t === "finished" ? "🍲 완제품" : "🥬 재료"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>제목 *</label>
          <input
            required
            className={field}
            placeholder="예: 한우 등심 1kg 나눠요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className={label}>실물 사진 * (여러 장 가능)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className={field}
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
          />
          {photos.length > 0 && (
            <p className="mt-1.5 text-sm text-[var(--muted)]">{photos.length}장 선택됨</p>
          )}
        </div>

        <div>
          <label className={label}>영수증 사진 *</label>
          <input
            type="file"
            accept="image/*"
            className={field}
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
        </div>

        <div>
          <label className={label}>태그 * (쉼표 또는 공백으로 구분 — 레시피 추천에 사용)</label>
          <input
            className={field}
            placeholder="예: 소고기, 등심, 한우"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>가격(원) *</label>
            <input
              required
              type="number"
              min={0}
              className={field}
              placeholder="120000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>유통기한 *</label>
            <input
              required
              type="date"
              className={field}
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>전체 용량 / 개수 *</label>
            <input
              required
              className={field}
              placeholder="예: 1kg / 30구"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>모집 인원 (선택)</label>
            <input
              type="number"
              min={1}
              className={field}
              placeholder="4"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={label}>추가 설명 (선택)</label>
          <textarea
            rows={3}
            className={field}
            placeholder="음식에 대해 간단히 소개해주세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-4 text-[15px] font-bold text-white transition disabled:opacity-60"
          style={{ background: "var(--forest)" }}
        >
          {loading ? "등록 중..." : "파티 개설하기"}
        </button>
      </form>
    </div>
  );
}

export default function NewPartyPage() {
  return (
    <Suspense fallback={null}>
      <NewPartyForm />
    </Suspense>
  );
}
