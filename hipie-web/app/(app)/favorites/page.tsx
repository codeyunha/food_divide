import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import { getFavoriteParties } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const parties = await getFavoriteParties();

  return (
    <>
      <PageHead title="❤️ 파티 찜하기" subtitle="관심 있게 찜해둔 파티들이에요" />

      {parties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-28 text-center">
          <div className="text-5xl">🤍</div>
          <p className="mt-4 text-base text-[var(--muted)]">
            아직 찜한 파티가 없어요. 마음에 드는 파티를 찜해보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          {parties.map((p) => (
            <PartyCard key={p.id} party={p} initialFavorite />
          ))}
        </div>
      )}
    </>
  );
}
