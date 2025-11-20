begin;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  prenom text,
  telephone text,
  capital numeric,
  statut text not null default 'Lead',
  board_id bigint,
  newsletter boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_timestamp on public.leads;
create trigger leads_set_timestamp
before update on public.leads
for each row
execute function public.trigger_set_timestamp();

alter table public.leads enable row level security;
alter table public.leads force row level security;

create policy "service role manages leads"
  on public.leads
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;

