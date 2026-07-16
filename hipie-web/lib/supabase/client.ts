import { createBrowserClient } from "@supabase/ssr";
import { createMockClient } from "./mock";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<any, "public">>;

export function createClient(): BrowserSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase 프로젝트가 연결되지 않은 로컬 테스트 환경에서는 인메모리 목업을 사용한다.
  if (!url || !key) {
    return createMockClient() as unknown as BrowserSupabaseClient;
  }
  return createBrowserClient(url, key);
}
