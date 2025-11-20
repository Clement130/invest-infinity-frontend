begin;

-- Table des défis
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null check (type in ('weekly', 'monthly', 'special')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  target_value integer not null default 1,
  reward_description text,
  reward_xp integer default 0,
  reward_badge_id text,
  is_active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table des participations aux défis
create table if not exists public.challenge_participations (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_value integer not null default 0,
  completed_at timestamptz,
  reward_claimed boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

-- Table des soumissions de défis (pour les défis qui nécessitent des soumissions)
create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references public.challenge_participations(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_type text not null, -- 'analysis', 'trade', 'screenshot', etc.
  content text,
  file_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Table des badges
create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text,
  icon text,
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  created_at timestamptz not null default now()
);

-- Table des badges utilisateurs
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  source text, -- 'challenge', 'achievement', etc.
  unique (user_id, badge_id)
);

-- Fonction pour mettre à jour updated_at
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers pour updated_at
drop trigger if exists challenges_set_timestamp on public.challenges;
create trigger challenges_set_timestamp
before update on public.challenges
for each row
execute function public.trigger_set_timestamp();

drop trigger if exists challenge_participations_set_timestamp on public.challenge_participations;
create trigger challenge_participations_set_timestamp
before update on public.challenge_participations
for each row
execute function public.trigger_set_timestamp();

-- Index pour améliorer les performances
create index if not exists idx_challenges_active on public.challenges(is_active, start_date, end_date);
create index if not exists idx_challenge_participations_user on public.challenge_participations(user_id);
create index if not exists idx_challenge_participations_challenge on public.challenge_participations(challenge_id);
create index if not exists idx_challenge_submissions_participation on public.challenge_submissions(participation_id);
create index if not exists idx_user_badges_user on public.user_badges(user_id);

-- RLS Policies
alter table public.challenges enable row level security;
alter table public.challenge_participations enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- Les utilisateurs peuvent voir les défis actifs
create policy "Users can view active challenges"
  on public.challenges
  for select
  using (is_active = true);

-- Les admins peuvent tout faire sur les défis
create policy "Admins can manage challenges"
  on public.challenges
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Les utilisateurs peuvent voir leurs propres participations
create policy "Users can view own participations"
  on public.challenge_participations
  for select
  using (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres participations
create policy "Users can create own participations"
  on public.challenge_participations
  for insert
  with check (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres participations
create policy "Users can update own participations"
  on public.challenge_participations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Les utilisateurs peuvent voir leurs propres soumissions
create policy "Users can view own submissions"
  on public.challenge_submissions
  for select
  using (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres soumissions
create policy "Users can create own submissions"
  on public.challenge_submissions
  for insert
  with check (auth.uid() = user_id);

-- Les admins peuvent voir toutes les soumissions
create policy "Admins can view all submissions"
  on public.challenge_submissions
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Les badges sont publics (lecture seule pour tous)
create policy "Anyone can view badges"
  on public.badges
  for select
  using (true);

-- Les utilisateurs peuvent voir leurs propres badges
create policy "Users can view own badges"
  on public.user_badges
  for select
  using (auth.uid() = user_id);

-- Les admins peuvent gérer les badges
create policy "Admins can manage badges"
  on public.badges
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Insérer quelques badges par défaut
insert into public.badges (id, name, description, icon, rarity) values
  ('challenge-weekly-winner', 'Gagnant Hebdomadaire', 'A complété un défi hebdomadaire', '🏆', 'rare'),
  ('challenge-monthly-winner', 'Gagnant Mensuel', 'A complété un défi mensuel', '👑', 'epic'),
  ('challenge-special', 'Défi Spécial', 'A complété un défi spécial', '⭐', 'legendary'),
  ('risk-management-master', 'Maître du Risk Management', 'A appliqué les règles de gestion du risque pendant 7 jours', '🛡️', 'rare'),
  ('analysis-expert', 'Expert en Analyse', 'A partagé 3 analyses de trading', '📊', 'common')
on conflict (id) do nothing;

commit;

