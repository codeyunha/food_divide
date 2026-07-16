import Link from "next/link";
import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import ListBanner from "@/components/ListBanner";
import EmptyState from "@/components/EmptyState";
import { listParties, getFavoriteIds } from "@/lib/queries";
import { daysLeft } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IngredientPage() {
  const [parties, favIds] = await Promise.all([
    listParties("ingredient"),
    getFavoriteIds(),
  ]);
  const urgentCount = parties.filter((p) => daysLeft(p.expiry_date) <= 2).length;

  return (
    <>
      <PageHead
        title="🥬 재료 파티"
        subtitle="대용량으로 구매한 식재료를 이웃과 나눠요"
      />

      <div
        className="mb-7 flex items-center justify-between gap-5 rounded-3xl px-9 py-7 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--forest), var(--forest-2))",
        }}
      >
        <div>
          <h3 className="text-xl font-bold">지금 남는 재료 있으신가요?</h3>
          <p className="mt-1.5 text-[13.5px] opacity-85">
            사진 한 장이면 30초 만에 이웃과 나눌 수 있어요
          </p>
        </div>
        <Link
          href="/party/new?type=ingredient"
          className="flex shrink-0 items-center gap-2.5 rounded-2xl px-8 py-[18px] text-[17px] font-bold text-[var(--forest)] shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.24)]"
          style={{ background: "#fff" }}
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-base text-white"
            style={{ background: "var(--peach)" }}
          >
            +
          </span>
          재료 올리기
        </Link>
      </div>

      {parties.length === 0 ? (
        <EmptyState
          emoji="🥬"
          title="아직 재료 파티가 없어요"
          desc="대용량으로 구매한 식재료를 나눠보세요. 첫 파티를 열면 이웃들이 함께해요!"
          actionHref="/party/new?type=ingredient"
          actionLabel="＋ 재료 파티 열기"
        />
      ) : (
        <>
          <ListBanner count={parties.length} urgentCount={urgentCount} label="재료 파티" />
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
