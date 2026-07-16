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
    <div className="mx-auto flex h-full max-w-5xl flex-col">
      {/* hero banner */}
      <div
        className="flex flex-col items-start gap-5 rounded-3xl px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-8"
        style={{ background: "linear-gradient(135deg, var(--forest), var(--forest-2))" }}
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="hidden h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 p-2 sm:flex">
            <Image
              src="/hipie.png"
              alt="Hi! Pie!"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="text-[21px] font-bold sm:text-[26px]">{nickname}님, 반가워요! 👋</h2>
            <p className="mt-1.5 text-sm text-white/90">
              오늘은 어떤 소분 파티에 참여해볼까요?
            </p>
          </div>
        </div>
        <Link
          href="/party/new"
          className="cta-peach w-full flex-shrink-0 whitespace-nowrap rounded-xl px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 sm:w-auto"
        >
          ＋ 파티 개설하기
        </Link>
      </div>

      {/* selection cards — vertically centered in remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 md:flex-row md:gap-8 md:py-10">
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
      <div className="flex flex-wrap justify-center gap-3 pb-4">
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
      className="group relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-[32px] border border-[var(--line)] bg-white p-7 transition hover:-translate-y-1.5 hover:shadow-2xl sm:p-10"
      style={{ boxShadow: "0 2px 12px rgba(15,92,62,0.05)" }}
    >
      <div
        className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full opacity-10 transition group-hover:opacity-20"
        style={{ background: accent }}
      />
      <div className="relative z-10">
        <div className="text-6xl">{emoji}</div>
        <h3 className="mt-5 text-2xl font-bold text-[var(--ink)]">{title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
        <div className="mt-8 flex items-center justify-between">
          <span
            className="rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white"
            style={{ background: accent }}
          >
            지금 {count}개 모집중
          </span>
          <span className="text-sm font-bold text-[var(--forest)] transition group-hover:translate-x-1">
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
      className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
    >
      <span>{emoji}</span>
      {label}
    </Link>
  );
}
