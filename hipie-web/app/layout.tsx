import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hi! Pie! — 소분 파티",
  description: "대용량 원재료·완제품 음식을 이웃과 나누는 소분 파티 플랫폼",
  icons: { icon: "/hipie.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
