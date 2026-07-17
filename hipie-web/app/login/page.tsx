"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname: nickname || email.split("@")[0] } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--forest)" }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-9 shadow-2xl">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-[var(--forest-light)] p-2">
            <Image
              src="/hipie.png"
              alt="Hi! Pie!"
              width={72}
              height={72}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-3.5 text-[28px] font-bold text-[var(--ink)]">Hi! Pie!</h1>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">
            {mode === "signin" ? "다시 오셨네요!" : "소분 파티에 참여해보세요"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {mode === "signup" && (
            <input
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3.5 text-[15px] outline-none focus:border-[var(--forest)]"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            className="w-full rounded-xl border border-[var(--line)] px-4 py-3.5 text-[15px] outline-none focus:border-[var(--forest)]"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-[var(--line)] px-4 py-3.5 text-[15px] outline-none focus:border-[var(--forest)]"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition disabled:opacity-60"
            style={{ background: "var(--forest)" }}
          >
            {loading ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-5 w-full text-center text-[15px] text-[var(--muted)] hover:text-[var(--forest)]"
        >
          {mode === "signin" ? "처음이신가요? 회원가입" : "이미 계정이 있어요 → 로그인"}
        </button>

        <Link
          href="/"
          className="mt-2.5 block text-center text-[13px] text-[var(--muted)]/70 hover:underline"
        >
          ← 홈으로
        </Link>
      </div>
    </main>
  );
}
