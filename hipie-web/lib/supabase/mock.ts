// 로컬 UI 테스트용 인메모리 목업 백엔드.
// NEXT_PUBLIC_SUPABASE_URL / ANON_KEY가 설정되지 않았을 때 client.ts / server.ts / proxy.ts에서
// 자동으로 이걸 대신 사용한다. 서버 재시작 시 데이터는 초기화된다.

const MOCK_USER = { id: "00000000-0000-0000-0000-000000000001", email: "local@test.dev" };

type Row = Record<string, unknown>;

const store: Record<string, Row[]> = {
  profiles: [
    { id: MOCK_USER.id, nickname: "테스트유저", avatar_url: null, manner_score: 36.5 },
  ],
};

function table(name: string): Row[] {
  if (!store[name]) store[name] = [];
  return store[name];
}

let seq = 0;
function genId(prefix: string) {
  seq += 1;
  return `mock-${prefix}-${seq}`;
}

// 업로드한 File을 기억해뒀다가 getPublicUrl에서 브라우저 objectURL로 돌려준다 (미리보기용).
const fileMap = new Map<string, File>();

type Filter = { col: string; op: "eq" | "in"; val: unknown };

class MockBuilder {
  private filters: Filter[] = [];
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row = {};
  private wantSingle = false;
  private wantMaybeSingle = false;
  private wantHead = false;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;

  constructor(private tableName: string) {}

  select(_cols?: string, options?: { count?: string; head?: boolean }) {
    if (options?.head) this.wantHead = true;
    return this;
  }
  insert(payload: Row) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }
  in(col: string, val: unknown[]) {
    this.filters.push({ col, op: "in", val });
    return this;
  }
  or() {
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.wantSingle = true;
    return this;
  }
  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  private matches(row: Row) {
    return this.filters.every((f) => {
      if (f.op === "eq") return row[f.col] === f.val;
      if (f.op === "in") return (f.val as unknown[]).includes(row[f.col]);
      return true;
    });
  }

  private enrich(row: Row): Row {
    if (this.tableName === "posts") {
      const author = table("profiles").find((p) => p.id === row.author_id) ?? null;
      const commentCount = table("comments").filter((c) => c.post_id === row.id).length;
      return { ...row, author, comments: [{ count: commentCount }] };
    }
    if (this.tableName === "comments") {
      const author = table("profiles").find((p) => p.id === row.author_id) ?? null;
      return { ...row, author };
    }
    return row;
  }

  // supabase-js 빌더처럼 await 가능하도록 thenable로 구현
  then(
    resolve: (v: { data: unknown; error: unknown; count?: number }) => void,
    reject: (e: unknown) => void
  ) {
    return this.exec().then(resolve, reject);
  }

  private async exec(): Promise<{ data: unknown; error: unknown; count?: number }> {
    const rows = table(this.tableName);

    if (this.mode === "insert") {
      const now = new Date().toISOString();
      const row: Row = { id: genId(this.tableName), created_at: now, updated_at: now, ...this.payload };
      rows.push(row);
      const shaped = this.enrich(row);
      return { data: this.wantSingle || this.wantMaybeSingle ? shaped : [shaped], error: null };
    }

    if (this.mode === "update") {
      rows.filter((r) => this.matches(r)).forEach((r) =>
        Object.assign(r, this.payload, { updated_at: new Date().toISOString() })
      );
      return { data: null, error: null };
    }

    if (this.mode === "delete") {
      const targets = rows.filter((r) => this.matches(r));
      targets.forEach((r) => {
        const idx = rows.indexOf(r);
        if (idx >= 0) rows.splice(idx, 1);
      });
      if (this.tableName === "posts") {
        const c = table("comments");
        targets.forEach((r) => {
          for (let i = c.length - 1; i >= 0; i--) if (c[i].post_id === r.id) c.splice(i, 1);
        });
      }
      return { data: null, error: null };
    }

    // select
    let result = rows.filter((r) => this.matches(r));
    if (this.orderCol) {
      const col = this.orderCol;
      result = [...result].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (this.orderAsc ? 1 : -1);
      });
    }
    if (this.limitN != null) result = result.slice(0, this.limitN);

    if (this.wantHead) return { data: null, error: null, count: result.length };

    const shaped = result.map((r) => this.enrich(r));
    if (this.wantSingle) {
      return { data: shaped[0] ?? null, error: shaped[0] ? null : { message: "mock: not found" } };
    }
    if (this.wantMaybeSingle) return { data: shaped[0] ?? null, error: null };
    return { data: shaped, error: null };
  }
}

export function createMockClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: MOCK_USER }, error: null };
      },
      async signOut() {
        return { error: null };
      },
      async signUp() {
        return { data: {}, error: null };
      },
      async signInWithPassword() {
        return { data: {}, error: null };
      },
    },
    from(name: string) {
      return new MockBuilder(name);
    },
    async rpc() {
      return { data: [], error: null };
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File) {
            if (typeof window !== "undefined") fileMap.set(`${bucket}/${path}`, file);
            return { data: { path }, error: null };
          },
          getPublicUrl(path: string) {
            const f = fileMap.get(`${bucket}/${path}`);
            const url = f && typeof window !== "undefined" ? URL.createObjectURL(f) : "";
            return { data: { publicUrl: url } };
          },
          async createSignedUrl(path: string) {
            const f = fileMap.get(`${bucket}/${path}`);
            const url = f && typeof window !== "undefined" ? URL.createObjectURL(f) : null;
            return { data: url ? { signedUrl: url } : null, error: null };
          },
        };
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    channel(_name: string) {
      const chan = {
        on() {
          return chan;
        },
        subscribe() {
          return chan;
        },
      };
      return chan;
    },
    removeChannel() {},
  };
}
