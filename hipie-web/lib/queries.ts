import { createClient } from "@/lib/supabase/server";
import type { Party, PartyType } from "@/lib/types";

const SELECT =
  "id, host_id, type, title, photos, receipt_photo, tags, price, expiry_date, total_amount, description, capacity, status, created_at, host:profiles!parties_host_id_fkey(id, nickname, avatar_url, manner_score), party_members(count)";

type Raw = Omit<Party, "host" | "member_count"> & {
  host: Party["host"] | Party["host"][];
  party_members: { count: number }[];
};

function shape(r: Raw): Party {
  const host = Array.isArray(r.host) ? r.host[0] : r.host;
  return {
    ...r,
    host: host ?? null,
    member_count: r.party_members?.[0]?.count ?? 0,
  };
}

export async function getFavoriteIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from("favorites")
    .select("party_id")
    .eq("user_id", user.id);
  return new Set((data ?? []).map((d) => d.party_id as string));
}

export async function listParties(type: PartyType): Promise<Party[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parties")
    .select(SELECT)
    .eq("type", type)
    .eq("status", "recruiting")
    .order("created_at", { ascending: false });
  return ((data as unknown as Raw[]) ?? []).map(shape);
}

export async function getParty(id: string): Promise<Party | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parties")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? shape(data as unknown as Raw) : null;
}

export async function getFavoriteParties(): Promise<Party[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: favs } = await supabase
    .from("favorites")
    .select("party_id")
    .eq("user_id", user.id);
  const ids = (favs ?? []).map((f) => f.party_id as string);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("parties")
    .select(SELECT)
    .in("id", ids)
    .order("created_at", { ascending: false });
  return ((data as unknown as Raw[]) ?? []).map(shape);
}

export async function getMyParties(): Promise<{ hosted: Party[]; joined: Party[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hosted: [], joined: [] };

  const { data: hostedData } = await supabase
    .from("parties")
    .select(SELECT)
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });
  const hosted = ((hostedData as unknown as Raw[]) ?? []).map(shape);

  const { data: memberRows } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", user.id);
  const joinedIds = (memberRows ?? [])
    .map((m) => m.party_id as string)
    .filter((id) => !hosted.some((h) => h.id === id));

  let joined: Party[] = [];
  if (joinedIds.length > 0) {
    const { data } = await supabase
      .from("parties")
      .select(SELECT)
      .in("id", joinedIds)
      .order("created_at", { ascending: false });
    joined = ((data as unknown as Raw[]) ?? []).map(shape);
  }
  return { hosted, joined };
}
