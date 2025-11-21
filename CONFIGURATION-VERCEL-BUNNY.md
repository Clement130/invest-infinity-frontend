# 🌐 Configuration Bunny Stream sur Vercel

## ⚠️ Important

Les variables d'environnement sur Vercel doivent avoir le préfixe `VITE_` pour être accessibles côté client.

## 📋 Variables à Ajouter sur Vercel

Allez dans **Vercel** > **Votre Projet** > **Settings** > **Environment Variables** et ajoutez :

### 1. VITE_BUNNY_STREAM_LIBRARY_ID
```
Value: 542258
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 2. VITE_BUNNY_STREAM_API_KEY
```
Value: be9a7d66-a76f-4314-88af7279bb1e-d7d8-42ca
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 3. VITE_BUNNY_EMBED_BASE_URL (déjà configuré)
```
Value: https://iframe.mediadelivery.net/embed/542258
Environments: ✅ Production, ✅ Preview, ✅ Development
```

## 🔄 Après Ajout

1. **Redéployer** : Vercel redéploiera automatiquement, ou allez dans **Deployments** > **Redeploy**
2. **Vérifier** : L'avertissement "Variables d'environnement manquantes" devrait disparaître
3. **Tester** : La bibliothèque Bunny Stream devrait se charger avec vos vidéos

## ✅ Vérification

Après le redéploiement, vérifiez que :
- ✅ L'avertissement a disparu
- ✅ La bibliothèque affiche vos vidéos
- ✅ L'upload fonctionne

