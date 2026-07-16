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
          <img src={r.main_image} alt={r.name} className="h-64 w-full object-cover" />
        )}
        <div className="p-7">
          <h1 className="text-2xl font-bold text-[var(--ink)]">{r.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {r.category && (
              <span className="rounded-full bg-[var(--forest-light)] px-2.5 py-1 font-semibold text-[var(--forest)]">
                {r.category}
              </span>
            )}
            {r.cooking_way && (
              <span className="rounded-full bg-[var(--peach-2)] px-2.5 py-1 font-semibold text-[var(--peach)]">
                {r.cooking_way}
              </span>
            )}
          </div>

          {/* nutrition */}
          {(r.info_eng || r.info_car || r.info_pro || r.info_fat) && (
            <div className="mt-5 grid grid-cols-4 gap-2">
              <Nut label="열량" value={r.info_eng} unit="kcal" />
              <Nut label="탄수화물" value={r.info_car} unit="g" />
              <Nut label="단백질" value={r.info_pro} unit="g" />
              <Nut label="지방" value={r.info_fat} unit="g" />
            </div>
          )}

          {r.ingredients && (
            <section className="mt-6">
              <h3 className="mb-2 text-base font-bold text-[var(--ink)]">재료</h3>
              <p className="whitespace-pre-line rounded-xl bg-[var(--cream)] p-4 text-sm leading-relaxed text-[var(--ink)]">
                {r.ingredients}
              </p>
            </section>
          )}

          {steps.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 text-base font-bold text-[var(--ink)]">조리 순서</h3>
              <ol className="space-y-4">
                {steps.map((s) => (
                  <li key={s.step} className="flex gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-xs font-bold text-white">
                      {s.step}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-[var(--ink)]">
                        {s.text}
                      </p>
                      {s.img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.img}
                          alt={`step ${s.step}`}
                          className="mt-2 max-h-48 rounded-xl"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {r.na_tip && (
            <p className="mt-6 rounded-xl bg-[var(--peach-2)] p-4 text-sm text-[var(--ink)]">
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
    <div className="rounded-xl border border-[var(--line)] p-2.5 text-center">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-[var(--ink)]">
        {value ?? "-"}
        <span className="ml-0.5 text-[10px] font-normal text-[var(--muted)]">
          {unit}
        </span>
      </div>
    </div>
  );
}
