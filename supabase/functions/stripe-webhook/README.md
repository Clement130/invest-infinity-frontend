# Stripe Webhook - Edge Function Supabase

## URL de l'endpoint

```
https://yjbyermyfbugfyzmidsp.supabase.co/functions/v1/stripe-webhook
```

## Variables d'environnement requises

Ces variables doivent être configurées dans **Supabase Dashboard > Project Settings > Edge Functions > Secrets** :

| Variable | Description | Où la trouver |
|----------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (sk_live_xxx ou sk_test_xxx) | [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook (whsec_xxx) | [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks) > Votre webhook > Signing secret |

> ⚠️ **IMPORTANT** : Chaque endpoint webhook Stripe a son propre `Signing secret`. Assurez-vous de copier le bon !

## Événements Stripe gérés

Configurez ces événements dans votre webhook Stripe :

- ✅ `checkout.session.completed` - Paiement one-time réussi
- ✅ `invoice.paid` - Facture payée (abonnements)
- ✅ `customer.subscription.created` - Nouvel abonnement
- ✅ `customer.subscription.updated` - Abonnement modifié
- ✅ `customer.subscription.deleted` - Abonnement annulé
- ✅ `payment_intent.succeeded` - Paiement réussi
- ✅ `payment_intent.payment_failed` - Paiement échoué

## Configuration du webhook Stripe

1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer sur **Add endpoint**
3. URL : `https://yjbyermyfbugfyzmidsp.supabase.co/functions/v1/stripe-webhook`
4. Sélectionner les événements listés ci-dessus
5. Copier le **Signing secret** (whsec_xxx)
6. Configurer `STRIPE_WEBHOOK_SECRET` dans Supabase

## Déploiement

```bash
# Depuis la racine du projet
supabase functions deploy stripe-webhook --project-ref yjbyermyfbugfyzmidsp
```

## Debugging

Les logs sont disponibles dans :
- **Supabase Dashboard** > Edge Functions > stripe-webhook > Logs
- **CLI** : `supabase functions logs stripe-webhook --project-ref yjbyermyfbugfyzmidsp`

## Résumé des corrections (29 Nov 2025)

### Problèmes corrigés

1. **`serve()` obsolète** → Remplacé par `Deno.serve()` moderne
2. **Variables d'environnement non vérifiées** → Vérification explicite au démarrage avec logs
3. **Erreurs de signature non distinguées** → Séparation claire 400 (signature) vs 500 (interne)
4. **Pas de logs de debugging** → Ajout de logs détaillés à chaque étape
5. **Événements manquants** → Ajout de `invoice.paid`, `customer.subscription.*`
6. **Gestion d'erreurs fragile** → Try/catch à chaque niveau avec réponses appropriées

### Ce qu'il faut faire côté Stripe

1. ✅ Vérifier que le webhook pointe vers la bonne URL
2. ✅ Copier le **Signing secret** et le configurer dans Supabase
3. ✅ Activer les événements listés ci-dessus
4. ✅ Cliquer sur **Réessayer** pour les événements en échec

