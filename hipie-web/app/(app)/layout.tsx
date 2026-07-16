import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";
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

  const { count: hostedCount } = await supabase
    .from("parties")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user.id);
  const { count: joinedCount } = await supabase
    .from("party_members")
    .select("party_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar
        profile={(profile as Profile) ?? null}
        stats={{ hosted: hostedCount ?? 0, joined: joinedCount ?? 0 }}
      />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-12 md:py-10 md:pb-10">
        {children}
      </main>
    </div>
  );
}
