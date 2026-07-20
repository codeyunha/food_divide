-- Hi! Pie! — 커뮤니티 게시글에서 작성자 "내 그릇" 좋아요/싫어요 평가
-- 파티의 cast_manner_vote(0002)와 동일한 규칙을 게시글 작성자 대상으로 확장.

-- ============================================================
-- 1. post_manner_votes: 게시글당 1인 1표 (작성자 추천/비추천)
-- ============================================================
create table if not exists public.post_manner_votes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  voter_id   uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  vote       smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);

create index if not exists post_manner_votes_target_idx on public.post_manner_votes (target_id);

alter table public.post_manner_votes enable row level security;

create policy "post_manner_votes read all"   on public.post_manner_votes for select using (true);
create policy "post_manner_votes insert self" on public.post_manner_votes for insert with check (auth.uid() = voter_id);
create policy "post_manner_votes update self" on public.post_manner_votes for update using (auth.uid() = voter_id);
create policy "post_manner_votes delete self" on public.post_manner_votes for delete using (auth.uid() = voter_id);

-- ============================================================
-- 2. cast_post_manner_vote — 게시글 작성자 "내 그릇" 좋아요(+1)/싫어요(-1)
--    같은 방향 재클릭 시 취소, 반대 방향 클릭 시 전환. 0~100 clamp.
-- ============================================================
create or replace function public.cast_post_manner_vote(p_post_id uuid, p_vote smallint)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_author    uuid;
  v_existing  smallint;
  v_delta     smallint;
  v_new_score integer;
begin
  if p_vote not in (-1, 1) then
    raise exception 'invalid vote value';
  end if;
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select author_id into v_author from public.posts where id = p_post_id;
  if v_author is null then
    raise exception 'post not found';
  end if;
  if v_author = auth.uid() then
    raise exception 'cannot vote for own post';
  end if;

  select vote into v_existing from public.post_manner_votes
    where post_id = p_post_id and voter_id = auth.uid();

  if v_existing is null then
    insert into public.post_manner_votes (post_id, voter_id, target_id, vote)
      values (p_post_id, auth.uid(), v_author, p_vote);
    v_delta := p_vote;
  elsif v_existing = p_vote then
    delete from public.post_manner_votes where post_id = p_post_id and voter_id = auth.uid();
    v_delta := -p_vote;
  else
    update public.post_manner_votes set vote = p_vote, created_at = now()
      where post_id = p_post_id and voter_id = auth.uid();
    v_delta := p_vote * 2;
  end if;

  update public.profiles
    set manner_score = greatest(0, least(100, manner_score + v_delta))
    where id = v_author
  returning manner_score into v_new_score;

  return v_new_score;
end;
$$;

grant execute on function public.cast_post_manner_vote(uuid, smallint) to authenticated;
