begin;

-- Table pour stocker les paramètres de la plateforme
create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  category text not null default 'general' check (category in ('appearance', 'emails', 'integrations', 'general')),
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Index pour les recherches par catégorie
create index if not exists platform_settings_category_idx on public.platform_settings(category);

-- Fonction pour mettre à jour automatiquement updated_at
create or replace function public.update_platform_settings_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger pour updated_at
drop trigger if exists platform_settings_set_timestamp on public.platform_settings;
create trigger platform_settings_set_timestamp
before update on public.platform_settings
for each row
execute function public.update_platform_settings_timestamp();

-- RLS : Seuls les admins peuvent modifier les paramètres
alter table public.platform_settings enable row level security;

-- Policy : Les admins peuvent tout faire
create policy "Admins can manage platform settings"
  on public.platform_settings
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

-- Policy : Tout le monde peut lire (pour l'affichage côté client)
create policy "Anyone can read platform settings"
  on public.platform_settings
  for select
  using (true);

-- Insérer les paramètres par défaut
insert into public.platform_settings (key, value, category, description) values
  ('appearance', '{"logoUrl": "", "primaryColor": "#9333ea", "secondaryColor": "#ec4899", "welcomeText": "Bienvenue sur InvestInfinity", "footerText": "© 2024 InvestInfinity. Tous droits réservés."}'::jsonb, 'appearance', 'Paramètres d''apparence de la plateforme'),
  ('email_templates', '{"welcome": {"subject": "Bienvenue sur InvestInfinity !", "body": "Bonjour {{name}},\n\nBienvenue sur InvestInfinity ! Nous sommes ravis de vous compter parmi nous.\n\nCordialement,\nL''équipe InvestInfinity"}, "purchase": {"subject": "Confirmation de votre achat", "body": "Bonjour {{name}},\n\nMerci pour votre achat de {{module}} !\n\nVous pouvez maintenant accéder à votre formation.\n\nCordialement,\nL''équipe InvestInfinity"}, "accessGranted": {"subject": "Accès à une formation", "body": "Bonjour {{name}},\n\nVous avez maintenant accès à la formation : {{module}}\n\nCordialement,\nL''équipe InvestInfinity"}}'::jsonb, 'emails', 'Templates d''emails automatiques'),
  ('integrations', '{"stripe": {"publicKey": "", "secretKey": ""}, "bunnyStream": {"libraryId": "", "apiKey": ""}, "webhooks": {"stripeUrl": ""}}'::jsonb, 'integrations', 'Configuration des intégrations tierces')
on conflict (key) do nothing;

commit;

