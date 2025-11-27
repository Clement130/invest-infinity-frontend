-- Gamification Economy & Cosmetics schema
set check_function_bodies = off;

create type public.store_item_type as enum ('theme', 'booster', 'freeze_pass', 'avatar');

create table if not exists public.user_wallets (
  user_id uuid primary key references auth.users on delete cascade,
  focus_coins integer not null default 0,
  total_earned integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.store_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type public.store_item_type not null,
  cost integer not null,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.store_items on delete cascade,
  quantity integer not null default 1,
  equipped boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  acquired_at timestamptz not null default now()
);

create index user_inventory_user_idx on public.user_inventory(user_id);
create index user_inventory_item_idx on public.user_inventory(item_id);


create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  reward_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_rewards_user_idx on public.user_rewards(user_id);


create or replace function public.ensure_user_wallet(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_wallets(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;


create or replace function public.adjust_focus_coins(p_user_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_balance integer;
begin
  if p_delta = 0 then
    select focus_coins into new_balance from public.user_wallets where user_id = p_user_id;
    return coalesce(new_balance, 0);
  end if;

  perform public.ensure_user_wallet(p_user_id);

  update public.user_wallets
  set focus_coins = greatest(0, focus_coins + p_delta),
      total_earned = total_earned + greatest(p_delta, 0)
  where user_id = p_user_id
  returning focus_coins into new_balance;

  return coalesce(new_balance, 0);
end;
$$;


create or replace function public.purchase_store_item(p_user_id uuid, p_item_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  item_record record;
  wallet_record record;
  balance integer;
begin
  select * into item_record from public.store_items where id = p_item_id and is_active = true;
  if not found then
    raise exception 'Item introuvable';
  end if;

  perform public.ensure_user_wallet(p_user_id);
  select * into wallet_record from public.user_wallets where user_id = p_user_id for update;

  if wallet_record.focus_coins < item_record.cost then
    raise exception 'Solde insuffisant';
  end if;

  update public.user_wallets
  set focus_coins = wallet_record.focus_coins - item_record.cost
  where user_id = p_user_id
  returning focus_coins into balance;

  insert into public.user_inventory(user_id, item_id, quantity, metadata)
  values (p_user_id, p_item_id, 1, jsonb_build_object('acquiredFromStore', true));

  return jsonb_build_object(
    'remainingBalance', balance,
    'itemId', p_item_id,
    'itemType', item_record.type,
    'itemName', item_record.name
  );
end;
$$;

