-- ============================================
-- Migration : Ajouter section_title aux leçons
-- ============================================
-- Objectif : Permettre de spécifier dans quelle section
-- une leçon doit apparaître côté client
-- ============================================

BEGIN;

-- Ajouter le champ section_title aux leçons
ALTER TABLE public.training_lessons
ADD COLUMN IF NOT EXISTS section_title TEXT;

-- Créer un index pour les recherches par section
CREATE INDEX IF NOT EXISTS training_lessons_section_title_idx 
ON public.training_lessons(module_id, section_title);

-- Commenter la colonne
COMMENT ON COLUMN public.training_lessons.section_title IS 
'Titre de la section dans laquelle cette leçon doit apparaître côté client. 
Si NULL, la leçon sera assignée automatiquement selon le moduleLayouts ou placée dans "Autres leçons".';

COMMIT;

