export default function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-9 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[30px] font-bold text-[var(--ink)]">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-[15px] text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
