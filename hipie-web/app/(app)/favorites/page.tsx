import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import EmptyState from "@/components/EmptyState";

import { getFavoriteParties } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const parties = await getFavoriteParties();

  return (
    <>
      <PageHead title="❤️ 파티 찜하기" subtitle="관심 있게 찜해둔 파티들이에요" />

      {parties.length === 0 ? (
        <EmptyState
          emoji="🤍"
          title="아직 찜한 파티가 없어요"
          desc="마음에 드는 파티를 찜해두면 여기서 한눈에 모아볼 수 있어요."
          actionHref="/home"
          actionLabel="파티 둘러보기"
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {parties.map((p) => (
            <PartyCard key={p.id} party={p} initialFavorite />
          ))}
        </div>
      )}
    </>
  );
}
