"use client";

import { useEffect } from "react";

/** 서비스워커(/sw.js) 등록 — PWA 설치 가능 + 기본 오프라인 지원. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // 개발 중 HMR 방해를 피하려면 프로덕션에서만 등록
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 등록 실패는 조용히 무시 (PWA 미지원 환경 등) */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
