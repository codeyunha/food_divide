export default function ListBanner({
  count,
  urgentCount,
  label,
}: {
  count: number;
  urgentCount: number;
  label: string;
}) {
  if (count === 0) return null;
  return (
    <div
      className="mb-6 flex flex-col items-start gap-3 rounded-2xl px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6"
      style={{ background: "linear-gradient(135deg, var(--forest), var(--forest-2))" }}
    >
      <p className="text-[15px] font-semibold">
        지금 <b className="text-[17px]">{count}개</b>의 {label}이 모집 중이에요
      </p>
      {urgentCount > 0 && (
        <span
          className="rounded-full px-3 py-1.5 text-[12.5px] font-bold"
          style={{ background: "var(--peach)" }}
        >
          ⏰ {urgentCount}개 마감임박
        </span>
      )}
    </div>
  );
}
