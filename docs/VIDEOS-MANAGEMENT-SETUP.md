# Configuration du Dashboard de Gestion Vidéos

## Variables d'environnement requises

Pour utiliser toutes les fonctionnalités du dashboard de gestion vidéos, vous devez configurer ces variables dans votre fichier `.env.local` :

```env
# Variables Supabase (obligatoires)
VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Variables Bunny Stream (obligatoires pour la gestion vidéo)
VITE_BUNNY_STREAM_LIBRARY_ID=542258
VITE_BUNNY_STREAM_API_KEY=votre_api_key_bunny_stream
VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/542258
```

## Où trouver les valeurs

### VITE_BUNNY_STREAM_LIBRARY_ID
1. Connectez-vous à [bunny.net](https://bunny.net)
2. Allez dans **Stream** > **Libraries**
3. Sélectionnez votre bibliothèque
4. L'ID se trouve dans l'URL ou dans les paramètres

### VITE_BUNNY_STREAM_API_KEY
1. Dans Bunny.net, allez dans **Account** > **API Keys**
2. Créez une nouvelle clé API ou utilisez une existante
3. Copiez la clé (elle ne sera affichée qu'une seule fois)

### VITE_BUNNY_EMBED_BASE_URL
Format : `https://iframe.mediadelivery.net/embed/{LIBRARY_ID}`

## Vérification

Le dashboard affichera automatiquement un avertissement si des variables sont manquantes. Vous pouvez également vérifier dans la console du navigateur :

```javascript
console.log('Library ID:', import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID);
console.log('API Key:', import.meta.env.VITE_BUNNY_STREAM_API_KEY ? 'Configuré' : 'Manquant');
```

## Fonctionnalités

### ✅ Disponibles avec toutes les variables
- Upload de vidéos
- Assignation de vidéos aux leçons
- Bibliothèque de vidéos
- Gestion complète du contenu

### ⚠️ Limitées sans variables Bunny Stream
- Upload de vidéos (désactivé)
- Assignation automatique (désactivée)
- Bibliothèque vidéos (désactivée)
- Gestion manuelle des IDs vidéo (toujours disponible)

## Support

En cas de problème, vérifiez :
1. Que les variables sont bien définies dans `.env.local`
2. Que le serveur de développement a été redémarré après l'ajout des variables
3. Que les clés API Bunny Stream sont valides et actives

