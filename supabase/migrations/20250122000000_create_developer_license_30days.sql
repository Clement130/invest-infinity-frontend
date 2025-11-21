begin;

-- Table developer_license pour gérer les paiements mensuels
create table if not exists public.developer_license (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  last_payment_date timestamptz not null default now(),
  deactivated_at timestamptz,
  admin_revocation_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour les recherches rapides
create index if not exists developer_license_is_active_idx on public.developer_license(is_active);
create index if not exists developer_license_last_payment_date_idx on public.developer_license(last_payment_date);

-- Fonction pour mettre à jour updated_at automatiquement
create or replace function public.update_developer_license_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger pour updated_at
drop trigger if exists developer_license_set_timestamp on public.developer_license;
create trigger developer_license_set_timestamp
before update on public.developer_license
for each row
execute function public.update_developer_license_timestamp();

-- Fonction pour vérifier si un utilisateur est développeur (par email)
create or replace function public.is_developer(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.email = 'butcher13550@gmail.com'
      and (p.role = 'developer' or p.role = 'admin')
  );
$$;

-- Fonction pour vérifier si l'admin doit être révoqué
create or replace function public.should_revoke_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.developer_license dl
    where dl.is_active = false
      and dl.deactivated_at is not null
      and now() >= (dl.deactivated_at + (dl.admin_revocation_days || ' days')::interval)
  );
$$;

-- Fonction pour révoquer le rôle admin du client
create or replace function public.revoke_admin_role()
returns void
language plpgsql
security definer
as $$
begin
  -- Révoquer le rôle admin de investinfinityfr@gmail.com
  update public.profiles
  set role = 'client'
  where email = 'investinfinityfr@gmail.com'
    and role = 'admin';
end;
$$;

-- RLS : Activer RLS sur la table
alter table public.developer_license enable row level security;
alter table public.developer_license force row level security;

-- Policy : Seul le développeur (butcher13550@gmail.com) peut SELECT
create policy "Developer can read license"
  on public.developer_license
  for select
  using (public.is_developer(auth.uid()));

-- Policy : Seul le développeur peut UPDATE
create policy "Developer can update license"
  on public.developer_license
  for update
  using (public.is_developer(auth.uid()))
  with check (public.is_developer(auth.uid()));

-- Policy : Seul le développeur peut INSERT
create policy "Developer can insert license"
  on public.developer_license
  for insert
  with check (public.is_developer(auth.uid()));

-- Insérer une ligne par défaut avec licence active
insert into public.developer_license (is_active, last_payment_date, admin_revocation_days)
values (true, now(), 30)
on conflict do nothing;

-- Mettre à jour le check constraint de profiles pour inclure 'developer'
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check check (role in ('client', 'admin', 'developer'));

commit;

