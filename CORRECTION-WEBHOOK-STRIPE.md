# 🔧 Correction du Webhook Stripe - Guide Complet

## ✅ État Actuel

### Projet Supabase Actif
- **Project ID** : `vveswlmcgmizmjsriezw`
- **URL** : `https://vveswlmcgmizmjsriezw.supabase.co`
- **Statut** : ACTIVE_HEALTHY
- **Fonction webhook** : ✅ Déployée (version 33, ACTIVE)

### URL du Webhook Correcte
```
https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook
```

### Problème Identifié
L'email Stripe mentionne une URL incorrecte :
- ❌ **URL actuelle dans Stripe** : `https://yjbyermyfbugfyzmidsp.supabase.co/functions/v1/stripe-webhook`
- ✅ **URL correcte** : `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook`

---

## 🚀 Actions à Effectuer

### 1. Mettre à Jour l'URL du Webhook dans Stripe

1. **Connectez-vous au Dashboard Stripe** :
   - Allez sur : https://dashboard.stripe.com/webhooks
   - Assurez-vous d'être en mode **LIVE** (pas Test)

2. **Trouvez le webhook qui échoue** :
   - Recherchez le webhook avec l'URL : `https://yjbyermyfbugfyzmidsp.supabase.co/functions/v1/stripe-webhook`
   - Cliquez dessus pour l'éditer

3. **Mettez à jour l'URL** :
   - Remplacez l'URL par : `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook`
   - Cliquez sur **"Update endpoint"** ou **"Save"**

4. **Vérifiez les événements sélectionnés** :
   Assurez-vous que ces événements sont bien sélectionnés :
   - ✅ `checkout.session.completed`
   - ✅ `invoice.paid`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. **Copiez le nouveau Signing Secret** :
   - Après la mise à jour, Stripe générera un nouveau "Signing secret"
   - Copiez-le (commence par `whsec_...`)

---

### 2. Mettre à Jour les Variables d'Environnement Supabase

1. **Connectez-vous au Dashboard Supabase** :
   - Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions

2. **Vérifiez les secrets suivants** :
   - `STRIPE_SECRET_KEY_LIVE` : Votre clé secrète Stripe LIVE (commence par `sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET_LIVE` : Le nouveau Signing Secret copié à l'étape précédente (commence par `whsec_...`)

3. **Si nécessaire, mettez à jour le secret** :
   - Cliquez sur "Add new secret" ou modifiez le secret existant
   - Nom : `STRIPE_WEBHOOK_SECRET_LIVE`
   - Valeur : Le nouveau Signing Secret de Stripe

---

### 3. Tester le Webhook

1. **Dans le Dashboard Stripe** :
   - Allez sur : https://dashboard.stripe.com/webhooks
   - Cliquez sur votre webhook mis à jour
   - Cliquez sur **"Send test webhook"**
   - Sélectionnez l'événement `checkout.session.completed`
   - Cliquez sur **"Send test webhook"**

2. **Vérifiez les logs Supabase** :
   - Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions/stripe-webhook/logs
   - Vous devriez voir une nouvelle entrée avec un statut 200

3. **Vérifiez dans Stripe** :
   - Dans les détails du webhook, vous devriez voir que le dernier événement a réussi (statut 200)

---

## 📋 Checklist de Vérification

- [ ] URL du webhook mise à jour dans Stripe vers `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook`
- [ ] Nouveau Signing Secret copié depuis Stripe
- [ ] Variable `STRIPE_WEBHOOK_SECRET_LIVE` mise à jour dans Supabase avec le nouveau secret
- [ ] Variable `STRIPE_SECRET_KEY_LIVE` vérifiée dans Supabase
- [ ] Tous les événements nécessaires sont sélectionnés dans Stripe
- [ ] Test du webhook effectué avec succès
- [ ] Logs Supabase montrent des réponses 200

---

## 🔍 Vérification des Logs

### Voir les logs en temps réel :
```bash
supabase functions logs stripe-webhook --project-ref vveswlmcgmizmjsriezw
```

### Ou via le Dashboard :
https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions/stripe-webhook/logs

---

## ⚠️ Notes Importantes

1. **Le projet `yjbyermyfbugfyzmidsp` n'existe pas** dans vos projets Supabase accessibles. C'est pourquoi Stripe ne peut pas se connecter.

2. **Le bon projet est `vveswlmcgmizmjsriezw`** - c'est celui utilisé partout dans votre code.

3. **Après la mise à jour de l'URL**, Stripe générera un nouveau Signing Secret. Vous DEVEZ mettre à jour `STRIPE_WEBHOOK_SECRET_LIVE` dans Supabase avec ce nouveau secret, sinon la vérification de signature échouera.

4. **La fonction webhook a été optimisée** pour éviter les timeouts :
   - Utilisation de `maybeSingle()` au lieu de `listUsers()` pour une recherche plus rapide
   - Gestion d'erreur globale pour garantir qu'une réponse HTTP est toujours renvoyée
   - Envoi d'email non bloquant

---

## 🆘 En Cas de Problème

Si après ces étapes le webhook échoue encore :

1. **Vérifiez les logs Supabase** pour voir l'erreur exacte
2. **Vérifiez que les secrets sont bien configurés** dans Supabase
3. **Testez avec Stripe CLI** :
   ```bash
   stripe listen --forward-to https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook
   ```

---

## 📞 Liens Utiles

- **Dashboard Stripe Webhooks** : https://dashboard.stripe.com/webhooks
- **Dashboard Supabase Functions** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
- **Secrets Supabase** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions
- **Logs Supabase** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions/stripe-webhook/logs

---

**Date de création** : 26 novembre 2025
**Fonction webhook version** : 33
**Statut** : ✅ Déployée et optimisée

