# ✅ Mise à jour du prix Transformation

**Date** : 29 Novembre 2025

## 📊 Changement effectué

- **Ancien prix** : 497€
- **Nouveau prix** : 347€

## 🔧 Modifications apportées

### 1. Frontend (`src/pages/PricingPage.tsx`)
- ✅ Prix affiché mis à jour : `497€` → `347€`
- ✅ Bouton mis à jour : `"Choisir Transformation — 497€"` → `"Choisir Transformation — 347€"`

### 2. Configuration (`src/config/stripe.ts`)
- ✅ Commentaire mis à jour : `// Transformation - 497€` → `// Transformation - 347€`

### 3. Base de données
- ✅ Migration créée : `supabase/migrations/20250129000001_update_transformation_price.sql`
- ⚠️ **À APPLIQUER** : La migration doit être exécutée dans Supabase pour mettre à jour le prix dans la table `stripe_prices`

## 📝 Note importante

Le **Price ID Stripe** (`price_1SXfxaKaUb6KDbNFRgl7y7I5`) reste le même. 

⚠️ **ATTENTION** : Si le prix a changé dans Stripe, il faut créer un **nouveau Price ID** dans Stripe Dashboard et mettre à jour la table `stripe_prices` avec ce nouveau Price ID.

## 🚀 Prochaines étapes

1. ✅ Code frontend déployé
2. ⏳ Appliquer la migration SQL dans Supabase
3. ⏳ Vérifier que le Price ID Stripe correspond bien à 347€
4. ⏳ Tester le checkout en production

