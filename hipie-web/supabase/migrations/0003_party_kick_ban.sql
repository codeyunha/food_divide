-- Hi! Pie! — 파티장 추방 + 영구 차단
-- 파티장이 파티원을 추방하면 party_bans에 기록되고, 해당 유저는 그 파티에 영원히 재참여 불가.

-- ============================================================
-- 1. party_bans: 파티별 영구 차단 명단
-- ============================================================
create table if not exists public.party_bans (
  party_id   uuid not null references public.parties(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  banned_by  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

alter table public.party_bans enable row level security;

-- 읽기: 해당 파티의 파티장, 또는 차단 당사자 본인(참여 불가 안내용)
create policy "party_bans read host or self" on public.party_bans
  for select using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.parties p
      where p.id = party_id and p.host_id = (select auth.uid())
    )
  );
-- insert/delete는 클라이언트에 열지 않는다 — kick_member(SECURITY DEFINER)로만 처리.

-- ============================================================
-- 2. 트리거: party_members INSERT 시 차단 명단이면 거부 (영구 차단 DB 강제)
-- ============================================================
create or replace function public.enforce_party_ban()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.party_bans
    where party_id = new.party_id and user_id = new.user_id
  ) then
    raise exception 'BANNED: 이 파티에서 추방되어 다시 참여할 수 없습니다'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_party_ban on public.party_members;
create trigger trg_enforce_party_ban
  before insert on public.party_members
  for each row execute function public.enforce_party_ban();

-- ============================================================
-- 3. RPC: kick_member — 파티장이 파티원 추방(+영구 차단)
-- ============================================================
create or replace function public.kick_member(p_party_id uuid, p_target_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_host uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select host_id into v_host from public.parties where id = p_party_id;
  if v_host is null then
    raise exception 'party not found';
  end if;
  if v_host <> auth.uid() then
    raise exception 'only the host can kick members';
  end if;
  if p_target_id = v_host then
    raise exception 'cannot kick the host';
  end if;

  insert into public.party_bans (party_id, user_id, banned_by)
    values (p_party_id, p_target_id, auth.uid())
    on conflict (party_id, user_id) do nothing;

  delete from public.party_members
    where party_id = p_party_id and user_id = p_target_id;
end;
$$;

grant execute on function public.kick_member(uuid, uuid) to authenticated;
