import Link from "next/link";
import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import { listParties, getFavoriteIds } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function IngredientPage() {
  const [parties, favIds] = await Promise.all([
    listParties("ingredient"),
    getFavoriteIds(),
  ]);

  return (
    <>
      <PageHead
        title="🥬 재료 파티"
        subtitle="대용량으로 구매한 식재료를 이웃과 나눠요"
        action={
          <Link
            href="/party/new?type=ingredient"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: "var(--forest)" }}
          >
            ＋ 재료 올리기
          </Link>
        }
      />

      {parties.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {parties.map((p) => (
            <PartyCard key={p.id} party={p} initialFavorite={favIds.has(p.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-24 text-center">
      <div className="text-4xl">🥬</div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        아직 재료 파티가 없어요. 첫 파티를 열어보세요!
      </p>
    </div>
  );
}
