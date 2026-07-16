import Link from "next/link";

export default function RecipeCard({
  id,
  name,
  image,
  category,
  matchCount,
}: {
  id: string;
  name: string;
  image: string | null;
  category?: string | null;
  matchCount?: number;
}) {
  return (
    <Link
      href={`/recipes/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-40 w-full overflow-hidden bg-[var(--forest-light)]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
        )}
        {matchCount != null && matchCount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--peach)] px-2 py-0.5 text-[11px] font-bold text-white">
            재료 {matchCount}개 일치
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h4 className="truncate text-sm font-bold text-[var(--ink)]">{name}</h4>
        {category && (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{category}</p>
        )}
      </div>
    </Link>
  );
}
