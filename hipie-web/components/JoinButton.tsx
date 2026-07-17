"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinButton({
  partyId,
  isMember,
  isHost,
  partyType,
  isBanned = false,
}: {
  partyId: string;
  isMember: boolean;
  isHost: boolean;
  partyType: "finished" | "ingredient";
  isBanned?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const listHref = partyType === "finished" ? "/dish" : "/ingredient";

  async function join() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase
      .from("party_members")
      .insert({ party_id: partyId, user_id: user.id });
    setLoading(false);
    if (error) {
      // DB 트리거가 차단 사용자를 막으면 안내
      alert(
        error.message?.includes("BANNED") || error.message?.includes("추방")
          ? "이 파티에서 추방되어 다시 참여할 수 없습니다."
          : "참여에 실패했어요: " + error.message
      );
      return;
    }
    router.refresh();
  }

  async function leave() {
    if (!confirm("이 파티에서 나가시겠어요? 채팅방에서도 나가게 됩니다.")) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("party_members")
      .delete()
      .eq("party_id", partyId)
      .eq("user_id", user.id);
    setLoading(false);
    if (!error) {
      router.push(listHref);
      router.refresh();
    }
  }

  async function remove() {
    if (!confirm("파티방을 삭제하시겠어요? 채팅과 참여 정보가 모두 삭제되며 되돌릴 수 없어요.")) return;
    setLoading(true);
    const { error } = await supabase.from("parties").delete().eq("id", partyId);
    setLoading(false);
    if (!error) {
      router.push(listHref);
      router.refresh();
    } else {
      alert("삭제에 실패했어요: " + error.message);
    }
  }

  // 파티장: 삭제
  if (isHost) {
    return (
      <div className="space-y-2.5">
        <div className="rounded-xl bg-[var(--forest-light)] px-6 py-4 text-center text-[15px] font-semibold text-[var(--forest)]">
          내가 개설한 파티예요 · 아래 채팅방에서 소통하세요
        </div>
        <button
          onClick={remove}
          disabled={loading}
          className="w-full rounded-xl border border-red-200 py-3.5 text-[15px] font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
        >
          🗑️ 파티방 삭제
        </button>
      </div>
    );
  }

  // 파티원: 나가기
  if (isMember) {
    return (
      <div className="space-y-2.5">
        <div className="rounded-xl bg-[var(--forest-light)] px-6 py-4 text-center text-[15px] font-semibold text-[var(--forest)]">
          참여 완료! 아래 채팅방에서 소통하세요
        </div>
        <button
          onClick={leave}
          disabled={loading}
          className="w-full rounded-xl border border-[var(--line)] py-3.5 text-[15px] font-bold text-[var(--muted)] transition hover:bg-[var(--cream)] disabled:opacity-60"
        >
          🚪 파티 나가기
        </button>
      </div>
    );
  }

  // 추방됨: 참여 불가
  if (isBanned) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 py-4 text-center text-[15px] font-bold text-red-500">
        🚫 이 파티에서 추방되어 참여할 수 없습니다
      </div>
    );
  }

  // 비참여: 참여하기
  return (
    <button
      onClick={join}
      disabled={loading}
      className="w-full rounded-xl py-4 text-[15px] font-bold text-white transition disabled:opacity-60"
      style={{ background: "var(--forest)" }}
    >
      {loading ? "참여 중..." : "함께 참여하기"}
    </button>
  );
}
