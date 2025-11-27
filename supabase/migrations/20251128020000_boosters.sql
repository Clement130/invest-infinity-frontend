set check_function_bodies = off;

create table if not exists public.user_boosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  multiplier numeric not null default 1,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active','expired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_boosters_user_idx on public.user_boosters(user_id);
create index user_boosters_status_idx on public.user_boosters(status);

create or replace function public.get_active_booster_multiplier(p_user_id uuid)
returns numeric
language plpgsql
security definer
as $$
declare
  boost numeric;
begin
  select multiplier
  into boost
  from public.user_boosters
  where user_id = p_user_id
    and status = 'active'
    and expires_at > now()
  order by expires_at desc
  limit 1;

  return coalesce(boost, 1);
end;
$$;

create or replace function public.activate_booster(
  p_user_id uuid,
  p_inventory_id uuid,
  p_multiplier numeric,
  p_duration_minutes integer
)
returns void
language plpgsql
security definer
as $$
declare
  expires timestamptz := now() + make_interval(mins => greatest(p_duration_minutes, 5));
begin
  insert into public.user_boosters(user_id, multiplier, expires_at, metadata)
  values (p_user_id, greatest(p_multiplier, 1), expires, jsonb_build_object('inventoryId', p_inventory_id));

  update public.user_inventory
  set quantity = greatest(quantity - 1, 0)
  where id = p_inventory_id
    and user_id = p_user_id;

  delete from public.user_inventory
  where id = p_inventory_id
    and quantity <= 0;
end;
$$;

-- Update increment_xp_track to appliquer booster
create or replace function public.increment_xp_track(p_user_id uuid, p_track public.track_type, p_xp integer)
returns void
language plpgsql
security definer
as $$
declare
  new_xp integer;
  new_level integer;
  effective_xp integer;
begin
  if p_xp <= 0 then
    return;
  end if;

  effective_xp := floor(p_xp * public.get_active_booster_multiplier(p_user_id));

  insert into public.user_xp_tracks(user_id, track, xp)
  values (p_user_id, p_track, 0)
  on conflict (user_id, track) do nothing;

  update public.user_xp_tracks
  set xp = user_xp_tracks.xp + effective_xp
  where user_id = p_user_id
    and track = p_track
  returning xp into new_xp;

  if new_xp is not null then
    new_level := floor(new_xp::numeric / 500)::integer + 1;
    update public.user_xp_tracks
    set level = greatest(new_level, level)
    where user_id = p_user_id and track = p_track;
  end if;
end;
$$;

