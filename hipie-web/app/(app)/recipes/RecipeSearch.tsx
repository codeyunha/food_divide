"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RecipeCard from "@/components/RecipeCard";

type Rec = {
  id: string;
  name: string;
  main_image: string | null;
  match_count?: number;
  category?: string | null;
};

type Mode = "ingredient" | "name";

export default function RecipeSearch() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("ingredient");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setLoading(true);

    if (mode === "ingredient") {
      const tags = q
        .split(/[,#\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const { data } = await supabase.rpc("recommend_recipes", {
        input_tags: tags,
        lim: 18,
      });
      setResults((data as Rec[]) ?? []);
    } else {
      // 전체 레시피 이름/재료/태그 검색
      const like = `%${q}%`;
      const { data } = await supabase
        .from("recipes")
        .select("id, name, main_image, category")
        .or(`name.ilike.${like},ingredients.ilike.${like},hash_tag.ilike.${like}`)
        .limit(24);
      setResults((data as Rec[]) ?? []);
    }
    setLoading(false);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setResults(null);
    setInput("");
  }

  return (
    <div className="mb-11">
      {/* 모드 토글 */}
      <div className="mb-4 inline-flex rounded-xl border border-[var(--line)] bg-white p-1">
        {(
          [
            { m: "ingredient" as Mode, label: "🥕 재료로 추천" },
            { m: "name" as Mode, label: "🔍 레시피 검색" },
          ]
        ).map(({ m, label }) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-lg px-5 py-2.5 text-[15px] font-semibold transition ${
              mode === m
                ? "bg-[var(--forest)] text-white"
                : "text-[var(--muted)] hover:text-[var(--forest)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={search} className="flex gap-2.5">
        <input
          className="flex-1 rounded-xl border border-[var(--line)] bg-white px-4 py-3.5 text-[15px] outline-none focus:border-[var(--forest)]"
          placeholder={
            mode === "ingredient"
              ? "가진 재료를 입력하세요 (예: 달걀, 두부, 시금치)"
              : "레시피 이름이나 재료로 검색 (예: 김치찌개, 두부)"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl px-7 text-[15px] font-bold text-white"
          style={{ background: "var(--forest)" }}
        >
          {mode === "ingredient" ? "추천받기" : "검색"}
        </button>
      </form>

      {loading && (
        <p className="mt-4 text-[15px] text-[var(--muted)]">레시피를 찾는 중...</p>
      )}

      {results && !loading && (
        <div className="mt-6">
          <h3 className="mb-4 text-[15px] font-bold text-[var(--ink)]">
            {mode === "ingredient" ? "추천 결과" : "검색 결과"} {results.length}개
          </h3>
          {results.length === 0 ? (
            <p className="text-[15px] text-[var(--muted)]">
              일치하는 레시피가 없어요. 다른 키워드로 시도해보세요.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
              {results.map((r) => (
                <RecipeCard
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  image={r.main_image}
                  category={r.category}
                  matchCount={r.match_count}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
