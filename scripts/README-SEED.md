# Instructions pour exécuter le seed de données de test

## Prérequis

1. **Ajouter la clé service_role dans `.env.local`**

   Ouvre ton fichier `.env.local` (ou crée-le s'il n'existe pas) et ajoute :

   ```env
   VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
   VITE_SUPABASE_ANON_KEY=ton_anon_key_ici
   VITE_SUPABASE_SERVICE_ROLE_KEY=ton_service_role_key_ici
   ```

2. **Récupérer la service_role key**

   - Va sur https://supabase.com/dashboard
   - Sélectionne ton projet : `vveswlmcgmizmjsriezw`
   - Va dans **Settings** > **API**
   - Copie la **service_role key** (⚠️ **SECRET** - ne la partage jamais publiquement)
   - Colle-la dans `.env.local` comme `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Exécution

Une fois la clé ajoutée, lance simplement :

```bash
npm run seed-test
```

Le script va :
- ✅ Créer 3 modules de formation sur le trading
- ✅ Créer 6 leçons (2 par module)
- ✅ Vérifier que les données ont bien été créées

## Contenu créé

### Modules :
1. **Les Bases du Trading** (Débutant, Gratuit)
2. **Stratégies Avancées** (Intermédiaire, 297€)
3. **Trading Algorithmique** (Expert, 597€)

### Leçons :
- 2 leçons par module
- IDs Bunny Stream :
  - Leçon 1 : `9295490a-0072-4752-996d-6f573306318b` (vidéo topstepx.mp4)
  - Les autres leçons utilisent encore des IDs `test-video-2` à `test-video-6` comme placeholders

## Notes importantes

- ⚠️ Le script vérifie si les données existent déjà et les met à jour si nécessaire
- ⚠️ La **service_role key** bypass les Row Level Security (RLS) - garde-la secrète !
- ⚠️ Ne commit jamais le fichier `.env.local` dans Git

## Dépannage

Si tu rencontres une erreur :

1. Vérifie que `.env.local` contient bien les 3 variables
2. Vérifie que la service_role key est correcte (copie depuis Supabase Dashboard)
3. Vérifie que les tables `training_modules` et `training_lessons` existent dans Supabase

