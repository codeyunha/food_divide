# Hi! Pie! — Supabase 데이터베이스 설계 (DB.md)

> `PRD.md` v1.0 기반 · Supabase(PostgreSQL 15+) 스키마 정의
> 문서 버전: v1.0 · 작성일: 2026-07-16

---

## 1. 개요

Hi! Pie! 의 백엔드는 **Supabase**를 사용한다.

| 구성요소 | 사용처 |
|----------|--------|
| **Postgres** | 파티/사용자/채팅/레시피 데이터 |
| **Auth** (`auth.users`) | 회원 인증. `profiles`가 이를 1:1 확장 |
| **Storage** | 실물 사진 / 영수증 사진 / 프로필 이미지 |
| **Realtime** | 채팅(`messages`) 실시간 구독 |
| **RLS** | 모든 public 테이블에 Row Level Security 적용 |

**설계 원칙**
- `auth.users`(Supabase 관리)는 직접 건드리지 않고 `public.profiles`로 확장.
- 위치 정보 컬럼은 **두지 않는다** (PRD 비목표).
- 파티 개설 필수값(사진·영수증·태그·가격·유통기한·용량)은 **DB 제약(NOT NULL / CHECK)** 으로 강제.
- 태그·사진은 Postgres 배열(`text[]`) + GIN 인덱스로 처리 → 레시피 재료 매칭에 활용.

---

## 2. ERD (개념)

```
auth.users ─1:1─ profiles
                    │
                    ├─1:N─ parties (host_id)
                    │         ├─1:N─ party_members ─N:1─ profiles
                    │         ├─1:N─ manner_votes ─N:1─ profiles (voter_id → target_id = host_id)
                    │         ├─1:N─ favorites ─N:1─ profiles
                    │         └─1:1─ chat_rooms ─1:N─ messages ─N:1─ profiles
                    │
recipes (독립 참조 데이터, merged_recipes (1).json)

profiles ─1:N─ posts ─1:N─ comments ─N:1─ profiles
```

---

## 3. ENUM 타입

```sql
-- 파티 유형: 완제품 / 원재료(재료)
create type party_type as enum ('finished', 'ingredient');

-- 파티 상태: 모집중 / 마감 / 완료
create type party_status as enum ('recruiting', 'closed', 'done');
```

---

## 4. 테이블 정의

### 4.1 profiles — 사용자 프로필 (`auth.users` 확장)

```sql
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nickname      text not null,
  avatar_url    text,
  manner_score  integer not null default 50 check (manner_score >= 0 and manner_score <= 100), -- 내 그릇 (0~100, 기본 50)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

| 컬럼 | 설명 |
|------|------|
| `id` | `auth.users.id` 와 동일 (PK/FK) |
| `nickname` | 표시 닉네임 (필수) |
| `avatar_url` | Storage `avatars` 버킷 경로 |
| `manner_score` | 내 그릇 점수, 0~100 정수, 기본 50 |

> 신규 가입 시 트리거로 profiles 자동 생성(§8 참조).

---

### 4.2 parties — 소분 파티

```sql
create table public.parties (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.profiles(id) on delete cascade,

  -- 필수 등록 정보 (PRD 4.1)
  type           party_type   not null,                       -- 완제품/재료
  title          text         not null,
  photos         text[]       not null check (array_length(photos,1) >= 1), -- 실물 사진 1장+
  receipt_photo  text         not null,                        -- 영수증 사진
  tags           text[]       not null check (array_length(tags,1) >= 1),   -- 음식/재료 태그 → 레시피 매칭
  price          integer      not null check (price >= 0),     -- 가격(원)
  expiry_date    date         not null,                        -- 유통기한
  total_amount   text         not null,                        -- 전체 용량(g/kg/ml) 또는 개수

  -- 선택 정보
  description    text,                                         -- 추가 설명
  capacity       integer      check (capacity is null or capacity >= 1), -- 모집 인원

  status         party_status not null default 'recruiting',
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

create index parties_type_status_idx on public.parties (type, status);
create index parties_tags_gin_idx    on public.parties using gin (tags);
create index parties_host_idx        on public.parties (host_id);
create index parties_expiry_idx      on public.parties (expiry_date);
```

**핵심 제약**
- `photos`: 실물 사진 최소 1장 (`array_length >= 1`).
- `receipt_photo`, `tags`, `price`, `expiry_date`, `total_amount`: `NOT NULL` → 필수 등록 강제.
- `type`: `party_type` ENUM으로 완제품/재료만 허용.

> 가격 기준(전체/1인분)은 PRD 확인사항 — 확정 시 컬럼 코멘트 또는 `price_basis` ENUM 추가 검토.

---

### 4.3 party_members — 파티 참여자

```sql
create table public.party_members (
  party_id   uuid not null references public.parties(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (party_id, user_id)
);

create index party_members_user_idx on public.party_members (user_id);
```

> 파티장도 참여자로 자동 등록(트리거, §8). "내 파티 목록"은 `host_id` + `party_members` 조합으로 조회.

---

### 4.3a manner_votes — "내 그릇" 추천/비추천 (파티당 1인 1표)

```sql
create table public.manner_votes (
  party_id   uuid not null references public.parties(id) on delete cascade,
  voter_id   uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  vote       smallint not null check (vote in (-1, 1)),      -- +1 추천 / -1 비추천
  created_at timestamptz not null default now(),
  primary key (party_id, voter_id)
);

create index manner_votes_target_idx on public.manner_votes (target_id);
```

- 파티에 참여한 사용자만 그 파티의 호스트에게 투표 가능(호스트 본인 제외), 파티당 1표.
- 같은 방향 재클릭 = 투표 취소, 반대 방향 클릭 = 투표 전환. `cast_manner_vote()` 함수(§5.1)가 처리.
- 실제 마이그레이션 SQL: `hipie-web/supabase/migrations/0002_manner_bowl.sql`

---

### 4.4 favorites — 파티 찜하기

```sql
create table public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  party_id   uuid not null references public.parties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, party_id)
);

create index favorites_user_idx on public.favorites (user_id);
```

---

### 4.5 chat_rooms — 파티 채팅방 (파티 1:1)

```sql
create table public.chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  party_id   uuid not null unique references public.parties(id) on delete cascade,
  created_at timestamptz not null default now()
);
```

> 파티 개설 시 트리거로 채팅방 자동 생성(§8). `party_id` UNIQUE → 파티당 1개.

---

### 4.6 messages — 채팅 메시지

```sql
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index messages_room_created_idx on public.messages (room_id, created_at);
```

> Supabase Realtime으로 `room_id` 기준 구독.

---

### 4.7 recipes — 레시피 참조 데이터 (`merged_recipes (1).json`)

식약처 `COOKRCP01` 데이터(약 1,146건)를 적재. 원본 필드를 정규화한 형태.

```sql
create table public.recipes (
  id            text primary key,          -- RCP_SEQ
  name          text not null,             -- RCP_NM
  category      text,                       -- RCP_PAT2 (반찬/국 등)
  cooking_way   text,                       -- RCP_WAY2 (찌기/굽기 등)
  ingredients   text,                       -- RCP_PARTS_DTLS (재료 원문)
  ingredient_tokens text[],                 -- 재료명 토큰화 (매칭용, 전처리 생성)
  hash_tag      text,                       -- HASH_TAG
  main_image    text,                       -- ATT_FILE_NO_MAIN / ATT_FILE_NO_MK
  na_tip        text,                       -- RCP_NA_TIP (저감 조리 팁)

  -- 영양정보
  info_eng      numeric,                    -- 열량(kcal)
  info_car      numeric,                    -- 탄수화물
  info_pro      numeric,                    -- 단백질
  info_fat      numeric,                    -- 지방
  info_na       numeric,                    -- 나트륨

  -- 조리 단계 (MANUAL01~20 / MANUAL_IMG01~20)
  manuals       jsonb,                      -- [{ "step": 1, "text": "...", "img": "..." }, ...]

  created_at    timestamptz not null default now()
);

create index recipes_tokens_gin_idx on public.recipes using gin (ingredient_tokens);
create index recipes_name_trgm_idx  on public.recipes using gin (name gin_trgm_ops); -- pg_trgm
```

**적재 참고**
- JSON 로드 시 요리명 등 문자열의 **인코딩(EUC-KR/CP949) 보정 → UTF-8** 전처리 필요(PRD 4.4).
- `ingredient_tokens`: `RCP_PARTS_DTLS`에서 재료명만 추출·정규화하여 배열로 저장 → 파티 `tags`와 매칭.
- `MANUAL01~20` + `MANUAL_IMG01~20`을 `manuals` jsonb 배열로 병합.
- 확장 필요: `create extension if not exists pg_trgm;`

---

### 4.8 posts — 커뮤니티 게시글

```sql
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) > 0),
  content     text not null check (char_length(content) > 0),
  images      text[] not null default '{}',            -- Storage post-images 경로
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx  on public.posts (author_id);
```

### 4.9 comments — 게시글 댓글

```sql
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(content) > 0),
  created_at  timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);
```

> 실제 마이그레이션 SQL: `hipie-web/supabase/migrations/0001_community_and_avatar.sql`

---

## 5. 함수

### 5.1 cast_manner_vote — "내 그릇" 추천/비추천 처리

파티원이 파티장의 "내 그릇" 점수에 투표. 파티당 1표, 같은 방향 재클릭 시 취소, 반대 방향 클릭 시 전환, 결과는 0~100으로 clamp.

```sql
create or replace function public.cast_manner_vote(p_party_id uuid, p_vote smallint)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_host_id   uuid;
  v_existing  smallint;
  v_delta     smallint;
  v_new_score integer;
begin
  if p_vote not in (-1, 1) then raise exception 'invalid vote value'; end if;
  select host_id into v_host_id from public.parties where id = p_party_id;
  if v_host_id is null then raise exception 'party not found'; end if;
  if v_host_id = auth.uid() then raise exception 'cannot vote for own party'; end if;
  if not exists (select 1 from public.party_members where party_id = p_party_id and user_id = auth.uid()) then
    raise exception 'must join the party to vote';
  end if;

  select vote into v_existing from public.manner_votes where party_id = p_party_id and voter_id = auth.uid();

  if v_existing is null then
    insert into public.manner_votes (party_id, voter_id, target_id, vote) values (p_party_id, auth.uid(), v_host_id, p_vote);
    v_delta := p_vote;
  elsif v_existing = p_vote then
    delete from public.manner_votes where party_id = p_party_id and voter_id = auth.uid();
    v_delta := -p_vote;
  else
    update public.manner_votes set vote = p_vote, created_at = now() where party_id = p_party_id and voter_id = auth.uid();
    v_delta := p_vote * 2;
  end if;

  update public.profiles set manner_score = greatest(0, least(100, manner_score + v_delta))
    where id = v_host_id returning manner_score into v_new_score;
  return v_new_score;
end;
$$;
```

> 실제 마이그레이션 SQL: `hipie-web/supabase/migrations/0002_manner_bowl.sql`

### 5.2 레시피 추천 매칭 (핵심 로직)

파티/보유 재료 태그(`text[]`)와 레시피의 `ingredient_tokens(text[])`를 **배열 겹침(overlap)** 으로 매칭, 일치 개수로 정렬.

```sql
-- 입력 태그와 겹치는 재료가 많은 레시피 순으로 추천
create or replace function public.recommend_recipes(input_tags text[], lim int default 20)
returns table (id text, name text, main_image text, match_count int)
language sql stable as $$
  select r.id, r.name, r.main_image,
         cardinality(array(select unnest(r.ingredient_tokens) intersect select unnest(input_tags))) as match_count
  from public.recipes r
  where r.ingredient_tokens && input_tags        -- GIN 인덱스 활용(overlap)
  order by match_count desc, r.name
  limit lim;
$$;
```

사용 예 (특정 파티 재료 기반 추천):
```sql
select * from public.recommend_recipes(
  (select tags from public.parties where id = '<party_uuid>')
);
```

---

## 6. Storage 버킷

| 버킷 | 공개 | 용도 | 경로 규칙(예) |
|------|:---:|------|----------------|
| `party-photos` | public | 파티 실물 사진 | `{party_id}/{uuid}.jpg` |
| `receipts` | **private** | 영수증 사진(민감) | `{party_id}/receipt.jpg` |
| `avatars` | public | 프로필 이미지 | `{user_id}/avatar.jpg` |
| `post-images` | public | 커뮤니티 게시글 첨부 이미지 | `{user_id}/{uuid}.jpg` |

> 영수증은 개인정보(구매내역) 성격이 있어 **private 버킷 + 파티원만 접근** 정책 권장. DB에는 경로만 저장.

```sql
insert into storage.buckets (id, name, public) values
  ('party-photos', 'party-photos', true),
  ('receipts',     'receipts',     false),
  ('avatars',      'avatars',      true),
  ('post-images',  'post-images',  true)
on conflict (id) do nothing;
```

**`storage.objects` 정책 (avatars / post-images)**: 각 버킷 모두 `{user_id}/...` 경로 규칙을 따르며,
본인 폴더에만 업로드·수정·삭제할 수 있도록 `storage.foldername(name)[1] = auth.uid()::text` 조건의
RLS 정책을 둔다. 전체 SQL은 `hipie-web/supabase/migrations/0001_community_and_avatar.sql` 참조.

---

## 7. RLS(Row Level Security) 정책

```sql
-- 전 테이블 RLS 활성화
alter table public.profiles      enable row level security;
alter table public.parties       enable row level security;
alter table public.party_members enable row level security;
alter table public.manner_votes  enable row level security;
alter table public.favorites     enable row level security;
alter table public.chat_rooms    enable row level security;
alter table public.messages      enable row level security;
alter table public.recipes       enable row level security;
```

### profiles
```sql
create policy "profiles read all"    on public.profiles for select using (true);
create policy "profiles update self" on public.profiles for update using (auth.uid() = id);
```

### parties
```sql
create policy "parties read all"    on public.parties for select using (true);
create policy "parties insert self" on public.parties for insert with check (auth.uid() = host_id);
create policy "parties update host" on public.parties for update using (auth.uid() = host_id);
create policy "parties delete host" on public.parties for delete using (auth.uid() = host_id);
```

### party_members
```sql
create policy "members read all"    on public.party_members for select using (true);
create policy "members join self"   on public.party_members for insert with check (auth.uid() = user_id);
create policy "members leave self"  on public.party_members for delete using (auth.uid() = user_id);
```

### manner_votes ("내 그릇" 추천/비추천)
```sql
create policy "manner_votes read all"    on public.manner_votes for select using (true);
create policy "manner_votes insert self" on public.manner_votes for insert with check (auth.uid() = voter_id);
create policy "manner_votes update self" on public.manner_votes for update using (auth.uid() = voter_id);
create policy "manner_votes delete self" on public.manner_votes for delete using (auth.uid() = voter_id);
```
> 실제 점수 반영은 `cast_manner_vote()`(§5.1, `security definer`)를 통해서만 이루어짐 — 파티원이 다른 사람의 `profiles.manner_score`를 직접 UPDATE할 권한은 없음.

### favorites (본인만)
```sql
create policy "favorites own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### chat_rooms (파티원만 조회)
```sql
create policy "chatroom members read" on public.chat_rooms for select using (
  exists (
    select 1 from public.party_members m
    where m.party_id = chat_rooms.party_id and m.user_id = auth.uid()
  )
);
```

### messages (파티원만 읽기/쓰기)
```sql
create policy "messages read members" on public.messages for select using (
  exists (
    select 1 from public.chat_rooms c
    join public.party_members m on m.party_id = c.party_id
    where c.id = messages.room_id and m.user_id = auth.uid()
  )
);

create policy "messages send members" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.chat_rooms c
    join public.party_members m on m.party_id = c.party_id
    where c.id = messages.room_id and m.user_id = auth.uid()
  )
);
```

### recipes (읽기 전용 공개)
```sql
create policy "recipes read all" on public.recipes for select using (true);
```

### posts / comments (읽기 전체 공개, 쓰기/수정/삭제는 본인만)
```sql
create policy "posts read all"    on public.posts for select using (true);
create policy "posts insert self" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts update self" on public.posts for update using (auth.uid() = author_id);
create policy "posts delete self" on public.posts for delete using (auth.uid() = author_id);

create policy "comments read all"    on public.comments for select using (true);
create policy "comments insert self" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments delete self" on public.comments for delete using (auth.uid() = author_id);
```

---

## 8. 트리거 / 자동화

### 8.1 신규 가입 → profiles 자동 생성
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 8.2 파티 개설 → 채팅방 생성 + 파티장 멤버 등록
```sql
create or replace function public.handle_new_party()
returns trigger language plpgsql security definer as $$
begin
  insert into public.chat_rooms (party_id) values (new.id);
  insert into public.party_members (party_id, user_id) values (new.id, new.host_id);
  return new;
end; $$;

create trigger on_party_created
  after insert on public.parties
  for each row execute function public.handle_new_party();
```

### 8.3 updated_at 자동 갱신
```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_parties_updated  before update on public.parties
  for each row execute function public.set_updated_at();
```

---

## 9. 페이지 ↔ 쿼리 매핑 (PRD 5.1)

| 페이지 | 주요 쿼리 |
|--------|-----------|
| 완제품 파티 | `parties where type='finished' and status='recruiting'` |
| 재료 파티 | `parties where type='ingredient' and status='recruiting'` |
| 레시피 | `recommend_recipes(tags)` / `recipes` 전체 |
| 파티 찜하기 | `favorites join parties where user_id=auth.uid()` |
| 내 파티 목록 | `parties where host_id=auth.uid()` ∪ `party_members where user_id=auth.uid()` |
| 프로필 | `profiles where id=auth.uid()` + 활동 집계 |
| 채팅방 | `messages where room_id=? order by created_at` (Realtime 구독) |
| 커뮤니티 | `posts order by created_at desc` / `comments where post_id=? order by created_at` |

---

## 10. 마이그레이션 순서

1. `create extension if not exists pg_trgm;`
2. ENUM 타입 생성 (§3)
3. 테이블 생성: `profiles` → `parties` → `party_members` → `favorites` → `chat_rooms` → `messages` → `recipes` → `posts` → `comments` (§4)
4. 인덱스 (§4 내 포함)
5. 함수 `recommend_recipes` (§5)
6. Storage 버킷 (§6)
7. RLS 활성화 및 정책 (§7)
8. 트리거/함수 (§8)
9. `recipes` 데이터 적재 (merged_recipes (1).json 전처리 후 insert)

---

## 11. 향후 확장 (Out of Scope, PRD §10 연계)
- `party_reviews` (파티 후기), `notifications` (알림함)
- `price_basis`(전체/1인분) ENUM 컬럼
- "내 그릇" 랭킹 뷰 (현재는 `manner_votes` 자체가 투표 이력 역할)
- 결제/정산 테이블
