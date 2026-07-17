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

      <div className="mb-9 flex items-center gap-5 rounded-2xl border border-[var(--line)] bg-white p-7">
        <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--forest-light)] text-4xl">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            "🐤"
          )}
        </div>
        <div>
          <div className="text-xl font-bold text-[var(--ink)]">{p.nickname}</div>
          <div className="mt-1.5 text-[15px] text-[var(--muted)]">
            {user.email} · 🥣 내 그릇{" "}
            <span className="font-semibold text-[var(--forest)]">
              {p.manner_score}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-9 grid grid-cols-3 gap-5">
        <Stat label="개설한 파티" value={hostedCount ?? 0} />
        <Stat label="참여한 파티" value={joinedCount ?? 0} />
        <Stat label="찜한 파티" value={favCount ?? 0} />
      </div>

      <h3 className="mb-4 text-lg font-bold text-[var(--ink)]">내 정보 수정</h3>
      <ProfileForm
        userId={user.id}
        initialNickname={p.nickname}
        initialAvatarUrl={p.avatar_url}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6 text-center">
      <div className="text-4xl font-bold text-[var(--forest)]">{value}</div>
      <div className="mt-1.5 text-[15px] text-[var(--muted)]">{label}</div>
    </div>
  );
}
