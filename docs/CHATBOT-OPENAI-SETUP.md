# 🤖 Configuration du Chatbot IA avec OpenAI

Ce guide explique comment configurer l'intégration OpenAI pour le chatbot Invest Infinity.

## 📋 Prérequis

1. Un compte OpenAI (https://platform.openai.com)
2. Des crédits OpenAI (minimum recommandé : 5-10€)
3. Accès au dashboard Supabase

## 🔑 Étape 1 : Obtenir une clé API OpenAI

1. **Créer un compte OpenAI**
   - Aller sur https://platform.openai.com
   - Créer un compte ou se connecter

2. **Ajouter des crédits**
   - Aller dans "Billing" (Facturation)
   - Cliquer sur "Add payment method"
   - Ajouter une carte bancaire
   - Ajouter des crédits (5-10€ recommandés pour commencer)

3. **Créer une clé API**
   - Aller sur https://platform.openai.com/api-keys
   - Cliquer sur "Create new secret key"
   - Donner un nom (ex: "Invest Infinity Chatbot")
   - **Copier la clé immédiatement** (elle ne sera plus visible après)

## 🔐 Étape 2 : Configurer la clé dans Supabase

### Méthode 1 : Via le Dashboard Supabase (Recommandé)

1. Aller sur votre projet Supabase : https://supabase.com/dashboard
2. Aller dans **Settings** → **Edge Functions** → **Secrets**
3. Cliquer sur **Add new secret**
4. Nom : `OPENAI_API_KEY`
5. Valeur : Coller votre clé API OpenAI
6. Cliquer sur **Save**

### Méthode 2 : Via la CLI Supabase

```bash
# Installer la CLI Supabase si ce n'est pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Définir le secret
supabase secrets set OPENAI_API_KEY=votre-clé-api-openai
```

## 🚀 Étape 3 : Déployer l'Edge Function

L'Edge Function `chatbot-ai` doit être déployée sur Supabase :

```bash
# Depuis la racine du projet
supabase functions deploy chatbot-ai
```

## ✅ Étape 4 : Vérifier la configuration

1. Ouvrir le chatbot sur votre site
2. Poser une question complexe qui ne correspond pas aux patterns définis
3. Le chatbot devrait utiliser OpenAI pour répondre

## 💰 Coûts estimés

- **GPT-3.5-turbo** : ~0.001€ par conversation
- **Avec 1000 utilisateurs/jour × 2 questions** = 400 appels API/jour (20% des questions)
- **Coût estimé** : ~0.40€/jour = **~12€/mois**

### Optimisation des coûts

Le système utilise une approche hybride :
- **80% des questions** → Logique locale (gratuit)
- **20% des questions** → API OpenAI (payant)

Pour réduire encore plus les coûts :
- Augmenter le seuil de confiance dans `chatbotService.ts` (ligne ~150)
- Ajouter plus de patterns dans `analyzeIntent()`

## 🔒 Sécurité

✅ **La clé API est sécurisée** :
- Stockée uniquement dans les secrets Supabase
- Jamais exposée côté client
- Appelée uniquement via Edge Function
- Rate limiting : 20 requêtes/minute par IP

## 🐛 Dépannage

### Le chatbot n'utilise pas OpenAI

1. Vérifier que la clé API est bien configurée dans Supabase
2. Vérifier les logs de l'Edge Function dans Supabase Dashboard
3. Vérifier la console du navigateur pour les erreurs

### Erreur "Quota dépassé"

- Vérifier vos crédits OpenAI sur https://platform.openai.com/account/billing
- Ajouter des crédits si nécessaire

### Erreur "Service configuration error"

- Vérifier que le secret `OPENAI_API_KEY` est bien défini dans Supabase
- Redéployer l'Edge Function après avoir ajouté le secret

## 📚 Documentation

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets](https://supabase.com/docs/guides/functions/secrets)

