-- Hi! Pie! — "매너온도" → "내 그릇"(manner bowl) 전환
-- DB.md §4.1, §7 확장. Supabase SQL Editor(또는 supabase db push)로 실행하세요.

-- ============================================================
-- 1. profiles.manner_score: numeric(4,1) 기본 36.5 → integer 0~100 기본 50
-- ============================================================
alter table public.profiles alter column manner_score drop default;
alter table public.profiles alter column manner_score type integer using round(manner_score);
update public.profiles set manner_score = 50;
alter table public.profiles alter column manner_score set default 50;
alter table public.profiles add constraint profiles_manner_score_range
  check (manner_score >= 0 and manner_score <= 100);

-- ============================================================
-- 2. 테이블: manner_votes (파티당 1인 1표 — 파티장 "내 그릇" 추천/비추천)
-- ============================================================
create table if not exists public.manner_votes (
  party_id   uuid not null references public.parties(id) on delete cascade,
  voter_id   uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  vote       smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (party_id, voter_id)
);

create index if not exists manner_votes_target_idx on public.manner_votes (target_id);

alter table public.manner_votes enable row level security;

create policy "manner_votes read all"   on public.manner_votes for select using (true);
create policy "manner_votes insert self" on public.manner_votes for insert with check (auth.uid() = voter_id);
create policy "manner_votes update self" on public.manner_votes for update using (auth.uid() = voter_id);
create policy "manner_votes delete self" on public.manner_votes for delete using (auth.uid() = voter_id);

-- ============================================================
-- 3. 함수: cast_manner_vote — 파티원이 파티장 "내 그릇" 점수를 추천(+1)/비추천(-1)
--    같은 방향 재클릭 시 투표 취소, 반대 방향 클릭 시 투표 전환. 0~100 범위로 clamp.
-- ============================================================
create or replace function public.cast_manner_vote(p_party_id uuid, p_vote smallint)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_host_id  uuid;
  v_existing smallint;
  v_delta    smallint;
  v_new_score integer;
begin
  if p_vote not in (-1, 1) then
    raise exception 'invalid vote value';
  end if;
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select host_id into v_host_id from public.parties where id = p_party_id;
  if v_host_id is null then
    raise exception 'party not found';
  end if;
  if v_host_id = auth.uid() then
    raise exception 'cannot vote for own party';
  end if;
  if not exists (
    select 1 from public.party_members
    where party_id = p_party_id and user_id = auth.uid()
  ) then
    raise exception 'must join the party to vote';
  end if;

  select vote into v_existing from public.manner_votes
    where party_id = p_party_id and voter_id = auth.uid();

  if v_existing is null then
    insert into public.manner_votes (party_id, voter_id, target_id, vote)
      values (p_party_id, auth.uid(), v_host_id, p_vote);
    v_delta := p_vote;
  elsif v_existing = p_vote then
    delete from public.manner_votes where party_id = p_party_id and voter_id = auth.uid();
    v_delta := -p_vote;
  else
    update public.manner_votes set vote = p_vote, created_at = now()
      where party_id = p_party_id and voter_id = auth.uid();
    v_delta := p_vote * 2;
  end if;

  update public.profiles
    set manner_score = greatest(0, least(100, manner_score + v_delta))
    where id = v_host_id
  returning manner_score into v_new_score;

  return v_new_score;
end;
$$;

grant execute on function public.cast_manner_vote(uuid, smallint) to authenticated;
