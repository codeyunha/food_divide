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
      />

      <div
        className="mb-8 flex items-center justify-between gap-5 rounded-3xl px-10 py-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--forest), var(--forest-2))",
        }}
      >
        <div>
          <h3 className="text-2xl font-bold">지금 남는 재료 있으신가요?</h3>
          <p className="mt-2 text-[15px] opacity-85">
            사진 한 장이면 30초 만에 이웃과 나눌 수 있어요
          </p>
        </div>
        <Link
          href="/party/new?type=ingredient"
          className="flex shrink-0 items-center gap-3 rounded-2xl px-9 py-5 text-lg font-bold text-[var(--forest)] shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.24)]"
          style={{ background: "#fff" }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-white"
            style={{ background: "var(--peach)" }}
          >
            +
          </span>
          재료 올리기
        </Link>
      </div>

      {parties.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-28 text-center">
      <div className="text-5xl">🥬</div>
      <p className="mt-4 text-base text-[var(--muted)]">
        아직 재료 파티가 없어요. 첫 파티를 열어보세요!
      </p>
    </div>
  );
}
