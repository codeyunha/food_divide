"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type PartyMember = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export default function PartyMembers({
  partyId,
  host,
  members,
  isHost,
  currentUserId,
}: {
  partyId: string;
  host: PartyMember | null;
  /** 파티장을 제외한 참여 멤버 목록 */
  members: PartyMember[];
  isHost: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [kickingId, setKickingId] = useState<string | null>(null);

  async function kick(target: PartyMember) {
    if (
      !confirm(
        `'${target.nickname}'님을 추방하시겠어요?\n추방하면 이 파티에 다시 참여할 수 없습니다.`
      )
    )
      return;
    setKickingId(target.id);
    const { error } = await supabase.rpc("kick_member", {
      p_party_id: partyId,
      p_target_id: target.id,
    });
    setKickingId(null);
    if (error) {
      alert("추방에 실패했어요: " + error.message);
      return;
    }
    router.refresh();
  }

  const total = (host ? 1 : 0) + members.length;

  return (
    <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-[var(--ink)]">
        파티원 <span className="text-[var(--forest)]">{total}</span>명
      </h3>

      <ul className="flex flex-col gap-2.5">
        {host && (
          <li className="flex items-center gap-3">
            <Avatar member={host} />
            <span className="truncate text-[15px] font-semibold text-[var(--ink)]">
              {host.nickname}
              {host.id === currentUserId && " (나)"}
            </span>
            <span className="rounded-full bg-[var(--forest-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--forest)]">
              파티장
            </span>
          </li>
        )}

        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <Avatar member={m} />
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--ink)]">
              {m.nickname}
              {m.id === currentUserId && " (나)"}
            </span>
            {isHost && m.id !== currentUserId && (
              <button
                onClick={() => kick(m)}
                disabled={kickingId === m.id}
                className="shrink-0 whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-[13px] font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
              >
                {kickingId === m.id ? "추방 중…" : "추방"}
              </button>
            )}
          </li>
        ))}

        {members.length === 0 && (
          <li className="text-[14px] text-[var(--muted)]">
            아직 참여한 파티원이 없어요.
          </li>
        )}
      </ul>
    </div>
  );
}

function Avatar({ member }: { member: PartyMember }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--forest-light)] text-[15px]">
      {member.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatar_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        "🐤"
      )}
    </div>
  );
}
