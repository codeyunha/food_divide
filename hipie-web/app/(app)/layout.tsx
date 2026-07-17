import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import ChatbotLauncher from "@/components/ChatbotLauncher";
import type { Profile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, manner_score")
    .eq("id", user.id)
    .single();

  const typedProfile = (profile as Profile) ?? null;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar profile={typedProfile} />
      <main className="flex-1 overflow-y-auto">
        <MobileNav profile={typedProfile} />
        <div className="px-4 py-6 md:px-16 md:py-12">{children}</div>
      </main>
      <ChatbotLauncher />
    </div>
  );
}
