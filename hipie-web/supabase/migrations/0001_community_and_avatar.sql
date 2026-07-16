-- Hi! Pie! — 커뮤니티(게시글/댓글) + 프로필 아바타 업로드
-- DB.md §4, §6, §7, §8 확장. car-reservation-app / team6 project 등 실제 프로젝트에
-- 연결한 뒤 Supabase SQL Editor(또는 supabase db push)로 실행하세요.

-- ============================================================
-- 1. 테이블: posts (커뮤니티 게시글)
-- ============================================================
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) > 0),
  content     text not null check (char_length(content) > 0),
  images      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx  on public.posts (author_id);

-- ============================================================
-- 2. 테이블: comments (게시글 댓글)
-- ============================================================
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(content) > 0),
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ============================================================
-- 3. updated_at 자동 갱신 (DB.md §8.3 함수 재사용)
-- ============================================================
drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. Storage 버킷: post-images (avatars는 DB.md §6에서 이미 생성)
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- ============================================================
-- 5. RLS 활성화 및 정책
-- ============================================================
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- posts: 누구나 읽기, 본인만 쓰기/수정/삭제
create policy "posts read all"     on public.posts for select using (true);
create policy "posts insert self"  on public.posts for insert with check (auth.uid() = author_id);
create policy "posts update self"  on public.posts for update using (auth.uid() = author_id);
create policy "posts delete self"  on public.posts for delete using (auth.uid() = author_id);

-- comments: 누구나 읽기, 본인만 쓰기/삭제 (수정은 없음 — 삭제 후 재작성)
create policy "comments read all"    on public.comments for select using (true);
create policy "comments insert self" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments delete self" on public.comments for delete using (auth.uid() = author_id);

-- ============================================================
-- 6. Storage 객체 정책: avatars / post-images
--    (DB.md §6에는 버킷만 정의되어 있고 storage.objects 정책이 없었음 —
--     본인 폴더({user_id}/...)에만 업로드/수정/삭제 가능하도록 여기서 추가)
-- ============================================================
drop policy if exists "avatars read all"   on storage.objects;
drop policy if exists "avatars insert own" on storage.objects;
drop policy if exists "avatars update own" on storage.objects;
drop policy if exists "avatars delete own" on storage.objects;

create policy "avatars read all" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars insert own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars update own" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars delete own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post-images read all"   on storage.objects;
drop policy if exists "post-images insert own" on storage.objects;
drop policy if exists "post-images delete own" on storage.objects;

create policy "post-images read all" on storage.objects
  for select using (bucket_id = 'post-images');
create policy "post-images insert own" on storage.objects
  for insert with check (
    bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "post-images delete own" on storage.objects
  for delete using (
    bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
