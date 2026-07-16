"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/dish", label: "완제품 파티", icon: "🍲" },
  { href: "/ingredient", label: "재료 파티", icon: "🥬" },
  { href: "/recipes", label: "레시피", icon: "🍳" },
  { href: "/favorites", label: "파티 찜하기", icon: "❤️" },
  { href: "/my", label: "내 파티 목록", icon: "📋" },
  { href: "/community", label: "커뮤니티", icon: "💬" },
  { href: "/profile", label: "프로필", icon: "👤" },
];

const MOBILE_TABS = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/dish", label: "완제품", icon: "🍲" },
  { href: "/ingredient", label: "재료", icon: "🥬" },
  { href: "/community", label: "커뮤니티", icon: "💬" },
  { href: "/profile", label: "마이", icon: "👤" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function ProfileCard({ profile }: { profile: Profile | null }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-3.5">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 text-lg">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          "🐤"
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-bold">
          {profile?.nickname ?? "게스트"}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] opacity-70">
          매너온도
          <span className="rounded-full bg-[rgba(255,201,57,0.22)] px-1.5 py-px text-[10.5px] font-bold text-[#ffd873]">
            {(profile?.manner_score ?? 36.5).toFixed(1)}°C
          </span>
        </div>
      </div>
    </div>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition ${
              active
                ? "bg-white/16 text-white"
                : "text-white/70 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span className="text-[18px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActivityWidget({ stats }: { stats: { hosted: number; joined: number } }) {
  return (
    <div className="mt-auto rounded-2xl bg-white/7 p-4">
      <div className="mb-2 text-[11.5px] font-semibold opacity-60">내 파티 활동</div>
      <div className="flex items-center justify-between text-[14.5px] font-bold">
        <span>
          개설 <b className="text-[#8FE0AE]">{stats.hosted}</b>
        </span>
        <span>
          참여 <b className="text-[#8FE0AE]">{stats.joined}</b>
        </span>
      </div>
    </div>
  );
}

export default function Sidebar({
  profile,
  stats,
}: {
  profile: Profile | null;
  stats: { hosted: number; joined: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop rail ── */}
      <aside
        className="hidden w-[264px] flex-shrink-0 flex-col overflow-y-auto px-4 py-6 text-white md:flex"
        style={{ background: "var(--forest)" }}
      >
        <Link href="/home" className="mb-5 flex items-center gap-2.5 px-1">
          <span className="h-9 w-9 overflow-hidden rounded-xl bg-white/10 p-1">
            <Image
              src="/hipie.png"
              alt="Hi! Pie!"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="text-lg font-bold">Hi! Pie!</span>
        </Link>

        <ProfileCard profile={profile} />

        <Link
          href="/party/new"
          className="mb-4 flex items-center justify-center gap-1.5 rounded-xl py-3 text-[14px] font-bold text-[var(--forest)] transition hover:opacity-90"
          style={{ background: "#fff" }}
        >
          <span className="text-lg leading-none">＋</span> 파티 개설
        </Link>

        <NavList pathname={pathname} />

        <ActivityWidget stats={stats} />

        <button
          onClick={logout}
          className="mt-2 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium text-white/45 transition hover:bg-white/5 hover:text-white/80"
        >
          로그아웃
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="flex flex-shrink-0 items-center justify-between px-4 py-3 text-white md:hidden"
        style={{ background: "var(--forest)" }}
      >
        <Link href="/home" className="flex items-center gap-2">
          <span className="h-8 w-8 overflow-hidden rounded-lg bg-white/10 p-1">
            <Image
              src="/hipie.png"
              alt="Hi! Pie!"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="text-[15px] font-bold">Hi! Pie!</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="전체 메뉴"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-white/10"
        >
          ☰
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute left-0 top-0 flex h-full w-[280px] flex-col overflow-y-auto px-4 py-6 text-white"
            style={{ background: "var(--forest)" }}
          >
            <div className="mb-5 flex items-center justify-between px-1">
              <span className="text-lg font-bold">Hi! Pie!</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <ProfileCard profile={profile} />

            <Link
              href="/party/new"
              onClick={() => setDrawerOpen(false)}
              className="mb-4 flex items-center justify-center gap-1.5 rounded-xl py-3 text-[14px] font-bold text-[var(--forest)] transition hover:opacity-90"
              style={{ background: "#fff" }}
            >
              <span className="text-lg leading-none">＋</span> 파티 개설
            </Link>

            <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />

            <ActivityWidget stats={stats} />

            <button
              onClick={logout}
              className="mt-2 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium text-white/45 transition hover:bg-white/5 hover:text-white/80"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t bg-white md:hidden"
        style={{
          borderColor: "var(--line)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {MOBILE_TABS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold transition"
              style={{ color: active ? "var(--forest)" : "var(--muted)" }}
            >
              <span className="text-[20px] leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
