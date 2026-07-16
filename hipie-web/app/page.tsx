import Image from "next/image";
import Link from "next/link";

export default function SplashPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white"
      style={{ background: "var(--forest)" }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          top: -160,
          right: -140,
          background: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          bottom: -100,
          left: -80,
          background: "rgba(255,255,255,0.05)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-6 h-28 w-28 overflow-hidden rounded-[28px] bg-white/10 p-2 shadow-2xl">
          <Image
            src="/hipie.png"
            alt="Hi! Pie!"
            width={112}
            height={112}
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Hi! Pie!</h1>
        <p className="mt-3 text-[15px] opacity-75">
          대용량 재료·완제품을 이웃과 나누는 소분 파티
        </p>
        <Link
          href="/login"
          className="mt-10 rounded-full border border-white/30 bg-white/15 px-9 py-3.5 text-[15px] font-semibold transition hover:bg-white/25"
        >
          시작하기
        </Link>
      </div>
    </main>
  );
}
