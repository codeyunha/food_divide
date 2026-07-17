"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SidebarContent from "./SidebarContent";
import type { Profile } from "@/lib/types";

/** 모바일(md 미만)에서만 보이는 상단 바 + 슬라이드 드로어. */
export default function MobileNav({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 라우트 변경 시 드로어 자동 닫힘
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어 열렸을 때 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* 상단 바 */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 text-white md:hidden"
        style={{ background: "var(--forest)" }}
      >
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/hipie_nobase_hitpaw.png"
            alt="Hi! Pie!"
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-bold">Hi! Pie!</span>
        </Link>
        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition hover:bg-white/10"
        >
          ☰
        </button>
      </header>

      {/* 드로어 + 배경 오버레이 */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[280px] max-w-[82%] flex-col overflow-y-auto px-5 py-6 text-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "var(--forest)" }}
        >
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="mb-2 ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-white/10"
          >
            ✕
          </button>
          <SidebarContent profile={profile} onNavigate={() => setOpen(false)} />
        </aside>
      </div>
    </>
  );
}
