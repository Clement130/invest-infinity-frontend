# Configuration des secrets pour les Edge Functions

Les Edge Functions `register-lead` et `update-capital` nécessitent des secrets d'environnement pour fonctionner.

## Configuration via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions
2. Pour chaque fonction (`register-lead` et `update-capital`), ajoutez les secrets suivants :
   - `SUPABASE_URL`: `https://vveswlmcgmizmjsriezw.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: (récupérez-la depuis Settings > API > service_role key)

## Configuration via CLI

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref vveswlmcgmizmjsriezw

# Configurer les secrets pour register-lead
supabase secrets set SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co --project-ref vveswlmcgmizmjsriezw
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<votre_service_role_key> --project-ref vveswlmcgmizmjsriezw

# Les secrets sont partagés entre toutes les fonctions du projet
```

## Vérification

Une fois configurés, les secrets sont automatiquement disponibles dans toutes les Edge Functions du projet via `Deno.env.get('SUPABASE_URL')` et `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.

## Note importante

Les secrets configurés via le dashboard ou CLI sont partagés entre **toutes** les Edge Functions du projet. Il n'est pas nécessaire de les configurer pour chaque fonction individuellement.

