"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/dish", label: "완제품 파티", icon: "🍲" },
  { href: "/ingredient", label: "재료 파티", icon: "🥬" },
  { href: "/recipes", label: "레시피", icon: "🍳" },
  { href: "/favorites", label: "파티 찜하기", icon: "❤️" },
  { href: "/my", label: "내 파티 목록", icon: "📋" },
  { href: "/profile", label: "프로필", icon: "👤" },
];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="flex w-[264px] flex-shrink-0 flex-col overflow-y-auto px-4 py-6 text-white"
      style={{ background: "var(--forest)" }}
    >
      <Link href="/dish" className="mb-5 flex items-center gap-2.5 px-1">
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

      <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg">
          🐤
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

      <Link
        href="/party/new"
        className="mb-4 flex items-center justify-center gap-1.5 rounded-xl py-3 text-[14px] font-bold text-[var(--forest)] transition hover:opacity-90"
        style={{ background: "#fff" }}
      >
        <span className="text-lg leading-none">＋</span> 파티 개설
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <button
        onClick={logout}
        className="mt-auto rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium text-white/45 transition hover:bg-white/5 hover:text-white/80"
      >
        로그아웃
      </button>
    </aside>
  );
}
