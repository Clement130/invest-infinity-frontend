# ⚠️ Vérification Déploiement Stripe - Action Requise

**Date** : 29 Novembre 2025  
**Statut** : ⚠️ Erreur 401 persistante après déploiement

## 🔍 Problème Identifié

L'erreur 401 persiste lors du clic sur "Choisir Entrée — 147€" :
```
POST https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/checkout-public => [401]
```

## 🔧 Solutions Possibles

### 1. Vérifier les Variables d'Environnement dans Vercel

**Action requise** : Vérifier que `VITE_SUPABASE_ANON_KEY` est bien configurée dans Vercel.

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez le projet `invest-infinity-frontend`
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que `VITE_SUPABASE_ANON_KEY` est présente avec la valeur :
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznXXrTNadOwdjY
   ```
5. Assurez-vous qu'elle est activée pour **Production**, **Preview**, et **Development**
6. Si elle n'existe pas ou est incorrecte, ajoutez-la ou modifiez-la
7. **Redéployez** le projet après modification

### 2. Vider le Cache du Navigateur

Le navigateur peut servir une version en cache :
- **Chrome/Edge** : `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- **Firefox** : `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
- Ou ouvrir en navigation privée

### 3. Vérifier le Déploiement Vercel

1. Allez sur https://vercel.com/dashboard
2. Vérifiez que le dernier déploiement est **terminé** et **réussi**
3. Si le déploiement est en cours, attendez qu'il se termine
4. Si le déploiement a échoué, consultez les logs

### 4. Forcer un Redéploiement

Si nécessaire, forcez un redéploiement :
1. Dans Vercel Dashboard → **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **Redeploy**

## 📝 Code Déployé

Le code suivant a été déployé dans `src/pages/PricingPage.tsx` :

```typescript
const response = await fetch(CHECKOUT_PUBLIC_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    priceId: STRIPE_PRICE_IDS[plan],
    successUrl: getStripeSuccessUrl(),
    cancelUrl: getStripeCancelUrl(),
  }),
});
```

## ✅ Checklist de Vérification

- [ ] `VITE_SUPABASE_ANON_KEY` est configurée dans Vercel
- [ ] La variable est activée pour Production
- [ ] Le dernier déploiement Vercel est terminé et réussi
- [ ] Cache du navigateur vidé
- [ ] Test effectué en navigation privée

## 🔗 Liens Utiles

- **Vercel Dashboard** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw
- **Page de tarification** : https://www.investinfinity.fr/pricing

---

**Note** : Si le problème persiste après avoir vérifié les variables d'environnement, il faudra vérifier les logs Vercel pour voir si la variable est bien injectée au moment du build.

