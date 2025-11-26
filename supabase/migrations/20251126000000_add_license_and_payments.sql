-- Migration pour le système de paiement sans friction
-- Ajoute les champs de licence à profiles et crée la table payments

begin;

-- Ajouter les champs de licence à la table profiles
alter table public.profiles 
  add column if not exists license text default 'none' check (license in ('none', 'starter', 'pro', 'elite')),
  add column if not exists license_valid_until timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists updated_at timestamptz default now();

-- Index pour les recherches par licence
create index if not exists profiles_license_idx on public.profiles(license);
create index if not exists profiles_stripe_customer_idx on public.profiles(stripe_customer_id);

-- Table des paiements
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_session_id text unique not null,
  stripe_payment_intent text,
  amount integer,
  currency text default 'eur',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  license_type text check (license_type in ('starter', 'pro', 'elite')),
  created_at timestamptz not null default now()
);

-- Index pour les recherches
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_created_at_idx on public.payments(created_at);

-- RLS pour payments
alter table public.payments enable row level security;
alter table public.payments force row level security;

-- Les utilisateurs peuvent voir leurs propres paiements
create policy "users_read_own_payments"
  on public.payments
  for select
  using (user_id = auth.uid());

-- Les admins peuvent tout voir
create policy "admins_read_all_payments"
  on public.payments
  for select
  using (public.is_admin(auth.uid()));

-- Le service role peut tout faire (pour le webhook)
create policy "service_role_all_payments"
  on public.payments
  for all
  using (auth.role() = 'service_role');

-- Permettre l'insertion par le service role (webhook)
create policy "service_role_insert_payments"
  on public.payments
  for insert
  with check (true);

-- Politique pour permettre à l'admin de mettre à jour les profiles
create policy "admins_update_profiles"
  on public.profiles
  for update
  using (public.is_admin(auth.uid()));

-- Politique pour le service role de mettre à jour les profiles
create policy "service_role_update_profiles"
  on public.profiles
  for update
  using (auth.role() = 'service_role');

create policy "service_role_insert_profiles"
  on public.profiles
  for insert
  with check (true);

commit;

