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
    <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[22px] font-bold text-[var(--ink)] sm:text-[26px]">{title}</h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
