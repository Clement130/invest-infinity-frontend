alter table public.profiles
add column if not exists theme text not null default 'default';

comment on column public.profiles.theme is 'Identifiant du thème UI choisi dans la boutique';

create or replace function public.set_active_theme(p_user_id uuid, p_inventory_id uuid, p_theme text)
returns void
language plpgsql
security definer
as $$
begin
  update public.user_inventory
  set equipped = false
  where user_id = p_user_id
    and id <> p_inventory_id
    and item_id in (select id from public.store_items where type = 'theme');

  if p_inventory_id is not null then
    update public.user_inventory
    set equipped = true
    where id = p_inventory_id
      and user_id = p_user_id;
  end if;

  update public.profiles
  set theme = coalesce(p_theme, 'default')
  where id = p_user_id;
end;
$$;

