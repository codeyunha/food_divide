import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const r = data as Recipe;
  const steps = (r.manuals ?? []).filter((m) => m.text);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/recipes"
        className="mb-5 inline-block text-sm text-[var(--muted)] hover:text-[var(--forest)]"
      >
        ← 레시피 목록
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        {r.main_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.main_image} alt={r.name} className="h-72 w-full object-cover" />
        )}
        <div className="p-8">
          <h1 className="text-3xl font-bold text-[var(--ink)]">{r.name}</h1>
          <div className="mt-2.5 flex flex-wrap gap-2 text-[13px]">
            {r.category && (
              <span className="rounded-full bg-[var(--forest-light)] px-3 py-1 font-semibold text-[var(--forest)]">
                {r.category}
              </span>
            )}
            {r.cooking_way && (
              <span className="rounded-full bg-[var(--peach-2)] px-3 py-1 font-semibold text-[var(--peach)]">
                {r.cooking_way}
              </span>
            )}
          </div>

          {/* nutrition */}
          {(r.info_eng || r.info_car || r.info_pro || r.info_fat) && (
            <div className="mt-6 grid grid-cols-4 gap-2.5">
              <Nut label="열량" value={r.info_eng} unit="kcal" />
              <Nut label="탄수화물" value={r.info_car} unit="g" />
              <Nut label="단백질" value={r.info_pro} unit="g" />
              <Nut label="지방" value={r.info_fat} unit="g" />
            </div>
          )}

          {r.ingredients && (
            <section className="mt-7">
              <h3 className="mb-2.5 text-lg font-bold text-[var(--ink)]">재료</h3>
              <p className="whitespace-pre-line rounded-xl bg-[var(--cream)] p-5 text-[15px] leading-relaxed text-[var(--ink)]">
                {r.ingredients}
              </p>
            </section>
          )}

          {steps.length > 0 && (
            <section className="mt-7">
              <h3 className="mb-4 text-lg font-bold text-[var(--ink)]">조리 순서</h3>
              <ol className="space-y-5">
                {steps.map((s) => (
                  <li key={s.step} className="flex gap-3.5">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-[13px] font-bold text-white">
                      {s.step}
                    </span>
                    <div className="flex-1">
                      <p className="text-[15px] leading-relaxed text-[var(--ink)]">
                        {s.text}
                      </p>
                      {s.img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.img}
                          alt={`step ${s.step}`}
                          className="mt-2.5 max-h-48 rounded-xl"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {r.na_tip && (
            <p className="mt-7 rounded-xl bg-[var(--peach-2)] p-5 text-[15px] text-[var(--ink)]">
              💡 {r.na_tip}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Nut({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] p-3 text-center">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold text-[var(--ink)]">
        {value ?? "-"}
        <span className="ml-0.5 text-[11px] font-normal text-[var(--muted)]">
          {unit}
        </span>
      </div>
    </div>
  );
}
