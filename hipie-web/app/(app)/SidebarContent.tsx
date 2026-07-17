"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { NAV } from "./nav";

/**
 * 사이드바 공용 본문. 데스크톱 고정 사이드바(Sidebar)와
 * 모바일 슬라이드 드로어(MobileNav)가 함께 사용한다.
 * onNavigate: 모바일에서 링크 클릭 시 드로어를 닫기 위한 콜백.
 */
export default function SidebarContent({
  profile,
  onNavigate,
}: {
  profile: Profile | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    onNavigate?.();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <Link
        href="/home"
        onClick={onNavigate}
        className="mb-6 flex items-center gap-3 px-1"
      >
        <span className="h-[88px] w-[88px] md:h-[108px] md:w-[108px]">
          <Image
            src="/hipie_nobase_hitpaw.png"
            alt="Hi! Pie!"
            width={108}
            height={108}
            className="h-full w-full object-contain"
          />
        </span>
        <span className="text-2xl font-bold md:text-[27px]">Hi! Pie!</span>
      </Link>

      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 text-xl">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            "🐤"
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">
            {profile?.nickname ?? "게스트"}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] opacity-70">
            🥣 내 그릇
            <span className="rounded-full bg-[rgba(255,201,57,0.22)] px-1.5 py-px text-[11.5px] font-bold text-[#ffd873]">
              {profile?.manner_score ?? 50}
            </span>
          </div>
        </div>
      </div>

      <Link
        href="/party/new"
        onClick={onNavigate}
        className="mb-5 flex items-center justify-center gap-1.5 rounded-xl py-3.5 text-[15px] font-bold text-[var(--forest)] transition hover:opacity-90"
        style={{ background: "#fff" }}
      >
        <span className="text-xl leading-none">＋</span> 파티 개설
      </Link>

      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-semibold transition ${
                active
                  ? "bg-white/16 text-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-auto rounded-xl px-4 py-3 text-left text-sm font-medium text-white/45 transition hover:bg-white/5 hover:text-white/80"
      >
        로그아웃
      </button>
    </>
  );
}
