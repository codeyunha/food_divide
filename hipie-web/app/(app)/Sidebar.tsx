import SidebarContent from "./SidebarContent";
import type { Profile } from "@/lib/types";

/** 데스크톱(md 이상)에서만 보이는 고정 사이드바. */
export default function Sidebar({ profile }: { profile: Profile | null }) {
  return (
    <aside
      className="hidden w-[292px] flex-shrink-0 flex-col overflow-y-auto px-5 py-7 text-white md:flex"
      style={{ background: "var(--forest)" }}
    >
      <SidebarContent profile={profile} />
    </aside>
  );
}
