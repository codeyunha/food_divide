import Image from "next/image";

export const metadata = { title: "오프라인 — Hi! Pie!" };

export default function OfflinePage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-white"
      style={{ background: "var(--forest)" }}
    >
      <Image
        src="/hipie_nobase_hitpaw.png"
        alt="Hi! Pie!"
        width={140}
        height={140}
        className="h-32 w-32 object-contain opacity-90"
      />
      <h1 className="mt-6 text-2xl font-bold">오프라인 상태예요</h1>
      <p className="mt-3 text-base opacity-75">
        인터넷 연결을 확인한 뒤 다시 시도해 주세요.
      </p>
    </main>
  );
}
