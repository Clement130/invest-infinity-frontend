begin;

-- Table des événements
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null check (type in ('live', 'workshop', 'masterclass', 'event')),
  date timestamptz not null,
  duration integer not null default 60, -- en minutes
  speaker text,
  is_exclusive boolean not null default false,
  registration_required boolean not null default true,
  discord_invite_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table des inscriptions aux événements
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Index pour améliorer les performances
create index if not exists events_date_idx on public.events(date);
create index if not exists events_type_idx on public.events(type);
create index if not exists events_active_idx on public.events(is_active);
create index if not exists event_registrations_event_idx on public.event_registrations(event_id);
create index if not exists event_registrations_user_idx on public.event_registrations(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger pour events
drop trigger if exists events_set_timestamp on public.events;
create trigger events_set_timestamp
before update on public.events
for each row
execute function public.trigger_set_timestamp();

-- RLS (Row Level Security)
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

-- Politique pour les événements : tous les utilisateurs authentifiés peuvent les lire
create policy "Events are viewable by authenticated users"
  on public.events
  for select
  using (auth.role() = 'authenticated' and is_active = true);

-- Politique pour les admins : peuvent tout faire sur les événements
create policy "Admins can manage events"
  on public.events
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Politique pour les inscriptions : les utilisateurs peuvent voir leurs propres inscriptions
create policy "Users can view their own registrations"
  on public.event_registrations
  for select
  using (auth.uid() = user_id);

-- Politique pour les inscriptions : les utilisateurs peuvent s'inscrire
create policy "Users can register for events"
  on public.event_registrations
  for insert
  with check (auth.uid() = user_id);

-- Politique pour les inscriptions : les utilisateurs peuvent se désinscrire
create policy "Users can unregister from events"
  on public.event_registrations
  for delete
  using (auth.uid() = user_id);

-- Politique pour les admins : peuvent voir toutes les inscriptions
create policy "Admins can view all registrations"
  on public.event_registrations
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

commit;

