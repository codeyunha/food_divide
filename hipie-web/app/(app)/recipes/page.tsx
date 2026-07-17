import PageHead from "@/components/PageHead";
import RecipeCard from "@/components/RecipeCard";
import RecipeSearch from "./RecipeSearch";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

type Rec = { id: string; name: string; main_image: string | null; match_count: number };

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // collect tags from the user's parties (hosted + joined)
  let recommended: Rec[] = [];
  if (user) {
    const { data: hosted } = await supabase
      .from("parties")
      .select("tags")
      .eq("host_id", user.id);
    const { data: joined } = await supabase
      .from("party_members")
      .select("parties(tags)")
      .eq("user_id", user.id);

    const tagSet = new Set<string>();
    (hosted ?? []).forEach((p) =>
      (p.tags as string[] | null)?.forEach((t) => tagSet.add(t))
    );
    (joined ?? []).forEach((row) => {
      const p = (row as { parties: { tags: string[] } | { tags: string[] }[] }).parties;
      const tags = Array.isArray(p) ? p[0]?.tags : p?.tags;
      tags?.forEach((t) => tagSet.add(t));
    });

    if (tagSet.size > 0) {
      const { data } = await supabase.rpc("recommend_recipes", {
        input_tags: Array.from(tagSet),
        lim: 8,
      });
      recommended = (data as Rec[]) ?? [];
    }
  }

  // browse list
  const { data: browse } = await supabase
    .from("recipes")
    .select("id, name, main_image, category")
    .order("id")
    .limit(24);

  return (
    <>
      <PageHead
        title="🍳 레시피"
        subtitle="내 파티 재료로 만들 수 있는 요리를 추천해드려요"
      />

      <RecipeSearch />

      {recommended.length > 0 && (
        <section className="mb-11">
          <h3 className="mb-4 text-lg font-bold text-[var(--ink)]">
            내 파티 재료 기반 추천
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-4 sm:gap-5">
            {recommended.map((r) => (
              <RecipeCard
                key={r.id}
                id={r.id}
                name={r.name}
                image={r.main_image}
                matchCount={r.match_count}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-4 text-lg font-bold text-[var(--ink)]">레시피 둘러보기</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-4 sm:gap-5">
          {((browse as Pick<Recipe, "id" | "name" | "main_image" | "category">[]) ?? []).map(
            (r) => (
              <RecipeCard
                key={r.id}
                id={r.id}
                name={r.name}
                image={r.main_image}
                category={r.category}
              />
            )
          )}
        </div>
      </section>
    </>
  );
}
