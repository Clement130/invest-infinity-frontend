set check_function_bodies = off;

create table if not exists public.user_economy_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_economy_events_user_idx on public.user_economy_events(user_id);
create index user_economy_events_type_idx on public.user_economy_events(event_type);

create or replace function public.log_economy_event(p_user_id uuid, p_type text, p_payload jsonb)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_economy_events(user_id, event_type, payload)
  values (p_user_id, p_type, coalesce(p_payload, '{}'::jsonb));
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

  perform public.log_economy_event(
    p_user_id,
    case when p_delta >= 0 then 'coins_gain' else 'coins_spent' end,
    jsonb_build_object('delta', p_delta, 'balance', new_balance)
  );

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

  perform public.log_economy_event(
    p_user_id,
    'purchase',
    jsonb_build_object('itemId', p_item_id, 'itemName', item_record.name, 'cost', item_record.cost, 'balance', balance)
  );

  return jsonb_build_object(
    'remainingBalance', balance,
    'itemId', p_item_id,
    'itemType', item_record.type,
    'itemName', item_record.name
  );
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

  perform public.log_economy_event(
    p_user_id,
    'booster_activated',
    jsonb_build_object('multiplier', p_multiplier, 'durationMinutes', p_duration_minutes, 'expiresAt', expires)
  );
end;
$$;

