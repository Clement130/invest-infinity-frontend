# Instructions pour exécuter seed-test-data.sql

## Méthode 1 : Via Supabase Dashboard (RECOMMANDÉ)

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet : `vveswlmcgmizmjsriezw`
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu de `supabase/seed-test-data.sql`
6. Cliquez sur **Run** (ou `Ctrl+Enter`)

## Méthode 2 : Via psql (si vous avez la connexion directe)

```bash
# Récupérez votre connection string depuis Supabase Dashboard > Settings > Database
# Format : postgresql://postgres:[PASSWORD]@db.vveswlmcgmizmjsriezw.supabase.co:5432/postgres

psql "postgresql://postgres:[PASSWORD]@db.vveswlmcgmizmjsriezw.supabase.co:5432/postgres" -f supabase/seed-test-data.sql
```

## Méthode 3 : Via Supabase CLI (si projet lié)

Si vous avez lié votre projet local avec `supabase link` :

```bash
# Exécuter le script sur la base distante
psql $(npx supabase db remote-url) -f supabase/seed-test-data.sql
```

## Vérification

Après exécution, vérifiez que les données sont bien créées :

```sql
-- Vérifier les modules
SELECT id, title, position, is_active FROM public.training_modules ORDER BY position;

-- Vérifier les leçons
SELECT m.title as module, l.title as lesson, l.bunny_video_id, l.position
FROM public.training_lessons l
JOIN public.training_modules m ON m.id = l.module_id
ORDER BY m.position, l.position;
```

## Contenu du script

- **3 modules** de formation sur le trading
- **6 leçons** au total (2 par module)
- **IDs Bunny Stream** :
  - Leçon 1 : `9295490a-0072-4752-996d-6f573306318b` (vidéo topstepx.mp4)
  - Autres leçons : placeholders `test-video-2` à `test-video-6`

### Modules créés :

1. **Les Bases du Trading** (Débutant, Gratuit)
   - Introduction au Trading (preview)
   - Analyse Technique de Base

2. **Stratégies Avancées** (Intermédiaire, 297€)
   - Scalping et Trading Intraday
   - Swing Trading et Analyse Fondamentale

3. **Trading Algorithmique** (Expert, 597€)
   - Introduction au Trading Algorithmique
   - Création et Backtesting de Stratégies

