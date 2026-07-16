import PageHead from "@/components/PageHead";
import ProfileForm from "./ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, manner_score")
    .eq("id", user.id)
    .single();
  const p = profile as Profile;

  const { count: hostedCount } = await supabase
    .from("parties")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user.id);
  const { count: joinedCount } = await supabase
    .from("party_members")
    .select("party_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const { count: favCount } = await supabase
    .from("favorites")
    .select("party_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <>
      <PageHead title="👤 프로필" subtitle="내 정보와 활동을 확인하세요" />

      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-6">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--forest-light)] text-3xl">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            "🐤"
          )}
        </div>
        <div>
          <div className="text-lg font-bold text-[var(--ink)]">{p.nickname}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            {user.email} · 매너온도{" "}
            <span className="font-semibold text-[var(--forest)]">
              {p.manner_score.toFixed(1)}°C
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat emoji="🎉" label="개설한 파티" value={hostedCount ?? 0} />
        <Stat emoji="🙌" label="참여한 파티" value={joinedCount ?? 0} />
        <Stat emoji="❤️" label="찜한 파티" value={favCount ?? 0} />
      </div>

      <h3 className="mb-3 text-base font-bold text-[var(--ink)]">내 정보 수정</h3>
      <ProfileForm
        userId={user.id}
        initialNickname={p.nickname}
        initialAvatarUrl={p.avatar_url}
      />
    </>
  );
}

function Stat({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1.5 text-3xl font-bold text-[var(--forest)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{label}</div>
    </div>
  );
}
