begin;

-- Table de configuration pour les Price IDs Stripe
create table if not exists public.stripe_prices (
  id uuid primary key default gen_random_uuid(),
  plan_type text not null unique check (plan_type in ('entree', 'transformation', 'immersion')),
  stripe_price_id text unique, -- Le vrai Price ID de Stripe
  amount_euros numeric(10, 2) not null,
  is_active boolean default true,
  plan_name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.stripe_prices is 'Table de configuration pour les Price IDs Stripe, gérée dynamiquement.';

-- RLS pour la table stripe_prices (lecture publique)
alter table public.stripe_prices enable row level security;

create policy "Allow public read access to stripe_prices"
  on public.stripe_prices for select
  using (true);

-- Insertion des prix initiaux (avec placeholders pour Entrée et Immersion)
insert into public.stripe_prices (plan_type, plan_name, amount_euros, description, stripe_price_id, is_active) 
values
  ('entree', 'Entrée', 147.00, 'Formule Entrée - 147€', 'price_ENTREE_PLACEHOLDER', true),
  ('transformation', 'Transformation', 497.00, 'Formule Transformation - 497€', 'price_1SXfxaKaUb6KDbNFRgl7y7I5', true),
  ('immersion', 'Immersion Élite', 1997.00, 'Formule Immersion Élite - 1997€', 'price_IMMERSION_PLACEHOLDER', true)
on conflict (plan_type) do update set
  plan_name = excluded.plan_name,
  amount_euros = excluded.amount_euros,
  description = excluded.description,
  updated_at = now();

-- Fonction pour mettre à jour updated_at automatiquement
create or replace function update_stripe_prices_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_stripe_prices_updated_at
  before update on public.stripe_prices
  for each row
  execute function update_stripe_prices_updated_at();

commit;

