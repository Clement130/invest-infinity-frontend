-- Table des modules de formation (gros chapitres)
create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Table des leçons / vidéos à l'intérieur d'un module
create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  title text not null,
  description text,
  bunny_video_id text,          -- l'ID de la vidéo dans Bunny
  position int not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

-- Table des droits d'accès des utilisateurs aux modules
create table if not exists public.training_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  access_type text not null default 'full', -- full, trial, etc. si besoin plus tard
  granted_at timestamptz not null default now(),
  unique (user_id, module_id)
);


