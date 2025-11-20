# Invest Infinity - Frontend

Plateforme de formation et communauté de trading.

## 🚀 Déploiement Rapide

### Sur Vercel

1. **Connecter GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Importez votre dépôt GitHub
   - Vercel détectera automatiquement Vite

2. **Configurer les variables d'environnement**

   Dans Vercel > Settings > Environment Variables, ajoutez :

   ```
   VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon
   VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/542258
   ```

3. **Déployer**
   - Cliquez sur "Deploy"
   - Vercel déploiera automatiquement à chaque push sur `main`

📖 **Guide complet** : Voir [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🛠️ Développement Local

### Installation

```bash
npm install
```

### Variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/542258
```

### Lancer le serveur de développement

```bash
npm run dev
```

### Build pour production

```bash
npm run build
```

## 📦 Technologies

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend & Auth
- **React Router** - Routing
- **Stripe** - Paiements

## 📁 Structure du Projet

```
src/
├── components/     # Composants réutilisables
├── pages/          # Pages de l'application
├── services/       # Services API
├── hooks/          # Hooks React personnalisés
├── layouts/        # Layouts de pages
├── context/        # Contextes React
└── types/          # Types TypeScript
```

## 🔐 Variables d'Environnement Requises

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |
| `VITE_BUNNY_EMBED_BASE_URL` | URL d'embed Bunny Stream | ✅ |
| `VITE_SUPABASE_FUNCTIONS_URL` | URL des Edge Functions | ⚠️ Optionnel |

## 📚 Documentation

- [Guide de déploiement](./docs/DEPLOYMENT.md)
- [Optimisation de conversion](./docs/CONVERSION-OPTIMIZATION.md)

## 🐛 Support

Pour toute question ou problème, consultez la documentation ou ouvrez une issue.

