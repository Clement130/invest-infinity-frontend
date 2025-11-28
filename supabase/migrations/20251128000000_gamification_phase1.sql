-- Gamification Phase 1 schema additions
set check_function_bodies = off;

create type public.track_type as enum ('foundation', 'execution', 'mindset', 'community');

create table if not exists public.user_xp_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  track public.track_type not null,
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_xp_tracks_user_track_key unique (user_id, track)
);

create type public.quest_type as enum ('daily', 'weekly');

create table if not exists public.quest_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type public.quest_type not null default 'daily',
  target jsonb not null default jsonb_build_object('metric', 'lessons_completed', 'value', 1),
  reward jsonb not null default jsonb_build_object('xp', 25),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  template_id uuid not null references public.quest_templates on delete cascade,
  status text not null default 'active' check (status in ('active','claimed','expired')),
  progress jsonb not null default jsonb_build_object('current', 0),
  expires_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_quests_user_idx on public.user_quests(user_id);
create index user_quests_status_idx on public.user_quests(status);

create type public.item_type as enum ('freeze_pass', 'booster');

create table if not exists public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item public.item_type not null,
  quantity integer not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_items_user_item_unique unique (user_id, item)
);



-- Helper function: ensure xp track row exists and update xp/level
create or replace function public.increment_xp_track(p_user_id uuid, p_track public.track_type, p_xp integer)
returns void
language plpgsql
security definer
as $$
declare
  new_xp integer;
  new_level integer;
begin
  if p_xp <= 0 then
    return;
  end if;

  insert into public.user_xp_tracks(user_id, track, xp)
  values (p_user_id, p_track, 0)
  on conflict (user_id, track) do nothing;

  update public.user_xp_tracks
  set xp = user_xp_tracks.xp + p_xp
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


-- Helper function: claim quest reward
create or replace function public.claim_user_quest(p_quest_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  quest_record record;
  reward_json jsonb;
  xp_reward integer;
  item_reward text;
  response jsonb := '{}'::jsonb;
begin
  select uq.*, qt.reward
  into quest_record
  from public.user_quests uq
  join public.quest_templates qt on qt.id = uq.template_id
  where uq.id = p_quest_id and uq.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Quest introuvable';
  end if;

  if quest_record.status <> 'active' then
    raise exception 'La quête a déjà été traitée';
  end if;

  reward_json := coalesce(quest_record.reward, jsonb_build_object('xp', 25));
  xp_reward := coalesce((reward_json ->> 'xp')::int, 0);

  if xp_reward > 0 then
    perform public.increment_xp_track(p_user_id, 'foundation', xp_reward);
    response := response || jsonb_build_object('xpAwarded', xp_reward);
  end if;

  if reward_json ? 'item' then
    item_reward := reward_json ->> 'item';
    insert into public.user_items(user_id, item, quantity)
    values (p_user_id, item_reward::public.item_type, 1)
    on conflict (user_id, item) do update
      set quantity = user_items.quantity + 1,
          updated_at = now();
    response := response || jsonb_build_object('itemAwarded', item_reward);
  end if;

  update public.user_quests
  set status = 'claimed',
      claimed_at = now()
  where id = p_quest_id;

  return response;
end;
$$;

