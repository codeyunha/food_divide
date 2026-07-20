import Image from "next/image";
import Link from "next/link";
import FallingFood from "@/components/FallingFood";

export default function SplashPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white"
      style={{ background: "var(--forest)" }}
    >
      {/* 배경: 천천히 떨어지는 음식 */}
      <FallingFood />
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
        <div className="mb-7 h-64 w-64 overflow-hidden">
          <Image
            src="/hipie_nobase_hitpaw.com.png"
            alt="Hi! Pie!"
            width={256}
            height={256}
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Hi! Pie!</h1>
        <p className="mt-3.5 text-base opacity-75">
          대용량 재료·완제품을 이웃과 나누는 소분 파티
        </p>
        <Link
          href="/login"
          className="mt-11 rounded-full border border-white/30 bg-white/15 px-10 py-4 text-base font-semibold transition hover:bg-white/25"
        >
          시작하기
        </Link>
      </div>
    </main>
  );
}
