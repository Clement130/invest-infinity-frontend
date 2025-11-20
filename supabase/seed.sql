-- Seed de développement : exécuté automatiquement via `supabase db reset`
-- ou manuellement avec `supabase db seed`
begin;

with module as (
  insert into public.training_modules (title, description, position, is_active)
  values (
    'Programme Découverte',
    'Parcours introductif pour prendre en main la plateforme Invest Infinity.',
    1,
    true
  )
  returning id
)
insert into public.training_lessons (
  module_id,
  title,
  description,
  bunny_video_id,
  position,
  is_preview
)
select id,
       'Bienvenue dans la formation',
       'Présentation courte du parcours et des objectifs.',
       'preview-intro-lesson',
       1,
       true
from module
union all
select id,
       'Définir un plan de trading',
       'Méthodologie pour structurer ses sessions et éviter les erreurs.',
       'full-plan-lesson',
       2,
       false
from module
union all
select id,
       'Gestion du risque',
       'Concepts essentiels pour protéger son capital.',
       'full-risk-lesson',
       3,
       false
from module;

commit;
