import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient } from "./mock";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerSupabaseClient = ReturnType<typeof createServerClient<any, "public">>;

export async function createClient(): Promise<ServerSupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase 프로젝트가 연결되지 않은 로컬 테스트 환경에서는 인메모리 목업을 사용한다.
  if (!url || !key) {
    return createMockClient() as unknown as ServerSupabaseClient;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // called from a Server Component — safe to ignore, proxy refreshes the session
        }
      },
    },
  });
}
