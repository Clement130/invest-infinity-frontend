-- Script de seed pour données de test - InvestInfinity LMS
-- Exécuter avec : npx supabase db execute --file supabase/seed-test-data.sql
-- OU via l'interface Supabase Dashboard > SQL Editor

begin;

-- Module 1 : Les Bases du Trading (niveau débutant, gratuit)
with module_1 as (
  insert into public.training_modules (title, description, position, is_active)
  values (
    'Les Bases du Trading',
    'Module d''introduction au trading pour débutants. Apprenez les fondamentaux : analyse technique, gestion du risque, et psychologie du trader. Niveau : Débutant | Prix : Gratuit',
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
       'Introduction au Trading',
       'Découvrez les concepts fondamentaux du trading : qu''est-ce que le trading, les différents marchés financiers, et comment commencer votre parcours.',
       '9295490a-0072-4752-996d-6f573306318b',
       1,
       true
from module_1
union all
select id,
       'Analyse Technique de Base',
       'Apprenez à lire les graphiques, identifier les tendances, et utiliser les indicateurs techniques essentiels pour prendre vos premières décisions.',
       'test-video-2',
       2,
       false
from module_1;

-- Module 2 : Stratégies Avancées (niveau intermédiaire, 297€)
with module_2 as (
  insert into public.training_modules (title, description, position, is_active)
  values (
    'Stratégies Avancées',
    'Approfondissez vos connaissances avec des stratégies de trading avancées : scalping, swing trading, et analyse fondamentale. Niveau : Intermédiaire | Prix : 297€',
    2,
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
       'Scalping et Trading Intraday',
       'Maîtrisez les techniques de scalping et de trading intraday pour capturer les mouvements de prix à court terme avec précision.',
       'test-video-3',
       1,
       false
from module_2
union all
select id,
       'Swing Trading et Analyse Fondamentale',
       'Développez vos compétences en swing trading en combinant analyse technique et fondamentale pour des positions à moyen terme.',
       'test-video-4',
       2,
       false
from module_2;

-- Module 3 : Trading Algorithmique (niveau expert, 597€)
with module_3 as (
  insert into public.training_modules (title, description, position, is_active)
  values (
    'Trading Algorithmique',
    'Passez au niveau supérieur avec le trading algorithmique : création de bots, backtesting, et optimisation de stratégies automatisées. Niveau : Expert | Prix : 597€',
    3,
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
       'Introduction au Trading Algorithmique',
       'Découvrez les concepts du trading algorithmique : APIs, connexions aux brokers, et architecture d''un système de trading automatisé.',
       'test-video-5',
       1,
       false
from module_3
union all
select id,
       'Création et Backtesting de Stratégies',
       'Apprenez à développer vos propres stratégies automatisées, les tester sur des données historiques, et optimiser leurs paramètres.',
       'test-video-6',
       2,
       false
from module_3;

commit;

