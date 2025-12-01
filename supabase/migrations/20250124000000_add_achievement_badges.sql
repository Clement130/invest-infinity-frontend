begin;

-- Insérer les badges d'accomplissement (calculés dynamiquement)
insert into public.badges (id, name, description, icon, rarity) values
  ('first-lesson', 'Premier Pas', 'A complété sa première leçon', '🎯', 'common'),
  ('10-lessons', 'Étudiant Assidu', 'A complété 10 leçons', '📚', 'rare'),
  ('first-module', 'Module Master', 'A complété un module entier', '🏆', 'epic')
on conflict (id) do nothing;

commit;























