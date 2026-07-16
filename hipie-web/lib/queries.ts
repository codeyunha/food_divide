import { createClient } from "@/lib/supabase/server";
import type { Party, PartyType, Post, Comment } from "@/lib/types";

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

// ---- 커뮤니티 (posts / comments) ----

const POST_SELECT =
  "id, author_id, title, content, images, created_at, updated_at, author:profiles!posts_author_id_fkey(id, nickname, avatar_url, manner_score), comments(count)";

type RawPost = Omit<Post, "author" | "comment_count"> & {
  author: Post["author"] | Post["author"][];
  comments: { count: number }[];
};

function shapePost(r: RawPost): Post {
  const author = Array.isArray(r.author) ? r.author[0] : r.author;
  return {
    ...r,
    author: author ?? null,
    comment_count: r.comments?.[0]?.count ?? 0,
  };
}

export async function listPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false });
  return ((data as unknown as RawPost[]) ?? []).map(shapePost);
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? shapePost(data as unknown as RawPost) : null;
}

const COMMENT_SELECT =
  "id, post_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(id, nickname, avatar_url, manner_score)";

type RawComment = Omit<Comment, "author"> & {
  author: Comment["author"] | Comment["author"][];
};

export async function listComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return ((data as unknown as RawComment[]) ?? []).map((c) => ({
    ...c,
    author: Array.isArray(c.author) ? c.author[0] ?? null : c.author ?? null,
  }));
}
