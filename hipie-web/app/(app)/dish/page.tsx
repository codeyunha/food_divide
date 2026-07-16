import Link from "next/link";
import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import ListBanner from "@/components/ListBanner";
import EmptyState from "@/components/EmptyState";
import { listParties, getFavoriteIds } from "@/lib/queries";
import { daysLeft } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DishPage() {
  const [parties, favIds] = await Promise.all([
    listParties("finished"),
    getFavoriteIds(),
  ]);
  const urgentCount = parties.filter((p) => daysLeft(p.expiry_date) <= 2).length;

  return (
    <>
      <PageHead
        title="🍲 완제품 파티"
        subtitle="직접 만들거나 주문한 완제품을 이웃과 나눠요"
        action={
          <Link
            href="/party/new?type=finished"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: "var(--forest)" }}
          >
            ＋ 완제품 올리기
          </Link>
        }
      />

      {parties.length === 0 ? (
        <EmptyState
          emoji="🍲"
          title="아직 완제품 파티가 없어요"
          desc="직접 만들거나 주문한 완제품을 나눠보세요. 첫 파티를 열면 이웃들이 함께해요!"
          actionHref="/party/new?type=finished"
          actionLabel="＋ 완제품 파티 열기"
        />
      ) : (
        <>
          <ListBanner count={parties.length} urgentCount={urgentCount} label="완제품 파티" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {parties.map((p) => (
              <PartyCard key={p.id} party={p} initialFavorite={favIds.has(p.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
