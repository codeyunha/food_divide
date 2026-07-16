import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const nickname = (profile as Pick<Profile, "nickname"> | null)?.nickname ?? "이웃";

  const { count: dishCount } = await supabase
    .from("parties")
    .select("id", { count: "exact", head: true })
    .eq("type", "finished")
    .eq("status", "recruiting");
  const { count: ingCount } = await supabase
    .from("parties")
    .select("id", { count: "exact", head: true })
    .eq("type", "ingredient")
    .eq("status", "recruiting");

  return (
    <div className="mx-auto max-w-5xl">
      {/* greeting */}
      <div className="mb-11 flex items-center gap-5">
        <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-[var(--forest-light)] p-2">
          <Image
            src="/hipie.png"
            alt="Hi! Pie!"
            width={72}
            height={72}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <h2 className="text-[30px] font-bold text-[var(--ink)]">
            {nickname}님, 반가워요! 👋
          </h2>
          <p className="mt-1.5 text-base text-[var(--muted)]">
            오늘은 어떤 소분 파티에 참여해볼까요?
          </p>
        </div>
      </div>

      {/* selection cards */}
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
        <SelectCard
          href="/dish"
          emoji="🍲"
          title="완제품 파티"
          desc="직접 만들거나 주문한 음식을 이웃과 나눠요"
          count={dishCount ?? 0}
          accent="var(--peach)"
        />
        <SelectCard
          href="/ingredient"
          emoji="🥬"
          title="재료 파티"
          desc="대용량으로 구매한 식재료를 이웃과 나눠요"
          count={ingCount ?? 0}
          accent="var(--forest-2)"
        />
      </div>

      {/* quick links */}
      <div className="mt-9 flex flex-wrap gap-3.5">
        <QuickLink href="/party/new" emoji="＋" label="파티 개설하기" />
        <QuickLink href="/recipes" emoji="🍳" label="레시피 추천 보기" />
        <QuickLink href="/my" emoji="📋" label="내 파티 목록" />
      </div>
    </div>
  );
}

function SelectCard({
  href,
  emoji,
  title,
  desc,
  count,
  accent,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  count: number;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-9 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className="absolute right-0 top-0 h-36 w-36 translate-x-8 -translate-y-8 rounded-full opacity-10 transition group-hover:opacity-20"
        style={{ background: accent }}
      />
      <div className="relative z-10">
        <div className="text-6xl">{emoji}</div>
        <h3 className="mt-5 text-2xl font-bold text-[var(--ink)]">{title}</h3>
        <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--muted)]">{desc}</p>
        <div className="mt-7 flex items-center justify-between">
          <span
            className="rounded-full px-3.5 py-1.5 text-sm font-bold text-white"
            style={{ background: accent }}
          >
            지금 {count}개 모집중
          </span>
          <span className="text-[15px] font-bold text-[var(--forest)] transition group-hover:translate-x-1">
            입장하기 →
          </span>
        </div>
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  emoji,
  label,
}: {
  href: string;
  emoji: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-[15px] font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
    >
      <span>{emoji}</span>
      {label}
    </Link>
  );
}
