begin;

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (email);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  title text not null,
  description text,
  bunny_video_id text,
  position integer not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.training_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  access_type text not null default 'full',
  granted_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table if not exists public.training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  done boolean not null default false,
  last_viewed timestamptz,
  unique (user_id, lesson_id)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  stripe_session_id text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique (stripe_session_id)
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.training_modules enable row level security;
alter table public.training_modules force row level security;

alter table public.training_lessons enable row level security;
alter table public.training_lessons force row level security;

alter table public.training_access enable row level security;
alter table public.training_access force row level security;

alter table public.training_progress enable row level security;
alter table public.training_progress force row level security;

alter table public.purchases enable row level security;
alter table public.purchases force row level security;

create policy "users can see their own profile"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "admins can see all profiles"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));

create policy "clients can view their modules"
  on public.training_modules
  for select
  using (
    is_active
    and exists (
      select 1
      from public.training_access ta
      where ta.user_id = auth.uid()
        and ta.module_id = public.training_modules.id
    )
  );

create policy "admins manage modules"
  on public.training_modules
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "clients can view lessons"
  on public.training_lessons
  for select
  using (
    is_preview
    or exists (
      select 1
      from public.training_access ta
      join public.training_modules tm on tm.id = ta.module_id
      where ta.user_id = auth.uid()
        and tm.is_active
        and ta.module_id = public.training_lessons.module_id
    )
  );

create policy "admins manage lessons"
  on public.training_lessons
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "users can view their access"
  on public.training_access
  for select
  using (user_id = auth.uid());

create policy "admins manage access"
  on public.training_access
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "users manage their own progress"
  on public.training_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admins can read all progress"
  on public.training_progress
  for select
  using (public.is_admin(auth.uid()));

create policy "users can see their purchases"
  on public.purchases
  for select
  using (user_id = auth.uid());

create policy "admins can see all purchases"
  on public.purchases
  for select
  using (public.is_admin(auth.uid()));

commit;
