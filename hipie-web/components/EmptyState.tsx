import Link from "next/link";

export default function EmptyState({
  emoji,
  title,
  desc,
  actionHref,
  actionLabel,
}: {
  emoji: string;
  title: string;
  desc: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line)] bg-white/50 px-8 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full text-4xl" style={{ background: "var(--forest-light)" }}>
        {emoji}
      </div>
      <h3 className="mt-5 text-lg font-bold text-[var(--ink)]">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
        {desc}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "var(--forest)" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
