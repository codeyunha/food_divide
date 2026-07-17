import Link from "next/link";
import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import { listParties, getFavoriteIds } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DishPage() {
  const [parties, favIds] = await Promise.all([
    listParties("finished"),
    getFavoriteIds(),
  ]);

  return (
    <>
      <PageHead
        title="🍲 완제품 파티"
        subtitle="직접 만들거나 주문한 완제품을 이웃과 나눠요"
      />

      <div
        className="mb-8 flex flex-col items-start gap-5 rounded-3xl px-6 py-6 text-white md:flex-row md:items-center md:justify-between md:px-10 md:py-8"
        style={{
          background:
            "linear-gradient(135deg, var(--forest), var(--forest-2))",
        }}
      >
        <div>
          <h3 className="text-2xl font-bold">너무 많이 시켰다면 나눠보세요</h3>
          <p className="mt-2 text-[15px] opacity-85">
            사진 한 장이면 30초 만에 이웃과 나눌 수 있어요
          </p>
        </div>
        <Link
          href="/party/new?type=finished"
          className="flex w-full shrink-0 items-center justify-center gap-3 rounded-2xl px-9 py-4 text-lg font-bold text-[var(--forest)] shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.24)] md:w-auto md:py-5"
          style={{ background: "#fff" }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-white"
            style={{ background: "var(--peach)" }}
          >
            +
          </span>
          완제품 올리기
        </Link>
      </div>

      {parties.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5 md:gap-6">
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
      <div className="text-5xl">🍲</div>
      <p className="mt-4 text-base text-[var(--muted)]">
        아직 완제품 파티가 없어요. 첫 파티를 열어보세요!
      </p>
    </div>
  );
}
