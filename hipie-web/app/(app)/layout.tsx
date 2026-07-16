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

  return (
    <div className="flex h-screen">
      <Sidebar profile={(profile as Profile) ?? null} />
      <main className="flex-1 overflow-y-auto px-12 py-10">{children}</main>
    </div>
  );
}
