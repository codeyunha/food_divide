import PageHead from "@/components/PageHead";
import PartyCard from "@/components/PartyCard";
import { getMyParties, getFavoriteIds } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MyPartiesPage() {
  const [{ hosted, joined }, favIds] = await Promise.all([
    getMyParties(),
    getFavoriteIds(),
  ]);

  return (
    <>
      <PageHead title="📋 내 파티 목록" subtitle="내가 개설하거나 참여한 파티예요" />

      <section className="mb-10">
        <h3 className="mb-3 text-base font-bold text-[var(--ink)]">
          내가 개설한 파티 · {hosted.length}
        </h3>
        {hosted.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">개설한 파티가 없어요.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {hosted.map((p) => (
              <PartyCard key={p.id} party={p} initialFavorite={favIds.has(p.id)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-base font-bold text-[var(--ink)]">
          참여한 파티 · {joined.length}
        </h3>
        {joined.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">참여한 파티가 없어요.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {joined.map((p) => (
              <PartyCard key={p.id} party={p} initialFavorite={favIds.has(p.id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
