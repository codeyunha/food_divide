-- Hi! Pie! — 파티 정원(capacity) 초과 참여 차단
-- UI는 정원이 차면 "마감"을 표시하지만 DB에는 이를 강제하는 제약이 없어
-- 동시 요청 시 정원을 넘겨 참여할 수 있었음. Supabase SQL Editor(또는 supabase db push)로 실행하세요.

create or replace function public.enforce_party_capacity()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_capacity integer;
  v_count    integer;
begin
  select capacity into v_capacity from public.parties where id = new.party_id;

  if v_capacity is not null and v_capacity > 0 then
    select count(*) into v_count from public.party_members where party_id = new.party_id;
    if v_count >= v_capacity then
      raise exception '정원이 마감된 파티예요.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_party_members_capacity on public.party_members;
create trigger trg_party_members_capacity
  before insert on public.party_members
  for each row execute function public.enforce_party_capacity();
