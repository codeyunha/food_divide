import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getParty } from "@/lib/queries";
import JoinButton from "@/components/JoinButton";
import Chat from "@/components/Chat";
import type { Message } from "@/lib/types";
import { won, dateKo, daysLeft } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PartyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const party = await getParty(id);
  if (!party) notFound();

  // membership
  const { data: memberRows } = await supabase
    .from("party_members")
    .select("user_id")
    .eq("party_id", id);
  const memberIds = (memberRows ?? []).map((m) => m.user_id as string);
  const isMember = !!user && memberIds.includes(user.id);
  const isHost = !!user && user.id === party.host_id;

  // signed url for private receipt
  let receiptUrl: string | null = null;
  if (party.receipt_photo) {
    const { data } = await supabase.storage
      .from("receipts")
      .createSignedUrl(party.receipt_photo, 3600);
    receiptUrl = data?.signedUrl ?? null;
  }

  // chat (only members)
  let roomId: string | null = null;
  let messages: Message[] = [];
  const names: Record<string, string> = {};
  if (isMember || isHost) {
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("party_id", id)
      .maybeSingle();
    roomId = room?.id ?? null;
    if (roomId) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, room_id, sender_id, content, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      messages = (msgs as Message[]) ?? [];
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", memberIds.length ? memberIds : ["_"]);
    (profs ?? []).forEach((p) => (names[p.id as string] = p.nickname as string));
  }

  const left = daysLeft(party.expiry_date);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={party.type === "finished" ? "/dish" : "/ingredient"}
        className="mb-5 inline-block text-sm text-[var(--muted)] hover:text-[var(--forest)]"
      >
        ← 목록으로
      </Link>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <span className="rounded-full bg-[var(--forest-light)] px-2.5 py-1 text-xs font-bold text-[var(--forest)]">
              {party.type === "finished" ? "완제품" : "재료"}
            </span>
            <h1 className="mt-2 text-xl font-bold text-[var(--ink)] sm:text-2xl">
              {party.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {party.host?.nickname ?? "익명"} · 매너온도{" "}
              {(party.host?.manner_score ?? 36.5).toFixed(1)}°C
            </p>
          </div>
          <span className="text-xl font-bold text-[var(--ink)] sm:text-2xl">
            {won(party.price)}
          </span>
        </div>

        {/* photos */}
        {party.photos?.length > 0 && (
          <div className="mb-5 flex gap-3 overflow-x-auto">
            {party.photos.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt="실물 사진"
                className="h-52 w-52 flex-shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        {/* meta grid */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Meta label="전체 용량/개수" value={party.total_amount} />
          <Meta
            label="유통기한"
            value={`${dateKo(party.expiry_date)} (${
              left < 0 ? "지남" : left === 0 ? "오늘" : `D-${left}`
            })`}
          />
          <Meta
            label="참여 인원"
            value={`${memberIds.length}${party.capacity ? `/${party.capacity}` : ""}명`}
          />
        </div>

        {party.tags?.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {party.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--peach-2)] px-2.5 py-1 text-xs font-medium text-[var(--peach)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {party.description && (
          <div className="mb-5 rounded-xl bg-[var(--cream)] p-4 text-sm leading-relaxed text-[var(--ink)]">
            {party.description}
          </div>
        )}

        {/* receipt */}
        {receiptUrl && (isMember || isHost) && (
          <details className="mb-5">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">
              🧾 영수증 확인
            </summary>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt="영수증"
              className="mt-3 max-h-96 rounded-xl border border-[var(--line)]"
            />
          </details>
        )}

        <JoinButton
          partyId={party.id}
          isMember={isMember}
          isHost={isHost}
          partyType={party.type}
        />
      </div>

      {/* chat */}
      {(isMember || isHost) && roomId && user && (
        <div className="mt-6">
          <Chat
            roomId={roomId}
            userId={user.id}
            initialMessages={messages}
            names={names}
          />
        </div>
      )}

      {!isMember && !isHost && (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          참여하면 파티원들과 채팅방에서 소통할 수 있어요
        </p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] p-3">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-sm font-bold text-[var(--ink)]">{value}</div>
    </div>
  );
}
