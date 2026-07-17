// Hi! Pie! service worker — 설치 가능(PWA) + 기본 오프라인 지원
// 캐시 버전을 올리면 이전 캐시는 activate 시 정리됩니다.
const CACHE = "hipie-v1";
const OFFLINE_URL = "/offline";

// 앱 셸(오프라인 폴백 + 로고)만 사전 캐시
const PRECACHE = [OFFLINE_URL, "/hipie_nobase_hitpaw.png", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// 정적 자산인지(해시된 빌드 산출물/아이콘/이미지) 판별 — cache-first 대상
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부 요청(예: Supabase)은 건드리지 않음

  // 1) 페이지 이동: network-first, 실패 시 오프라인 폴백
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || Response.error())
      )
    );
    return;
  }

  // 2) 정적 자산: cache-first (백그라운드 갱신)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
