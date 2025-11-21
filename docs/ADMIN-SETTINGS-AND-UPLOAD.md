# Configuration des Paramètres Admin et Upload de Vidéos

## ✅ Fonctionnalités Implémentées

### 1. Sauvegarde des Paramètres dans Supabase

Les paramètres de la plateforme sont maintenant stockés dans Supabase via la table `platform_settings` :

- **Apparence** : Logo, couleurs, textes d'accueil et footer
- **Templates d'emails** : Bienvenue, achat, accès accordé
- **Intégrations** : Stripe, Bunny Stream, webhooks

### 2. Upload de Vidéos via Edge Function

L'upload de vidéos vers Bunny Stream se fait maintenant via une Edge Function Supabase sécurisée.

## 📋 Configuration Requise

### 1. Migration de la Base de Données

Exécutez la migration pour créer la table `platform_settings` :

```bash
supabase db push
```

Ou via le dashboard Supabase :
1. Allez dans **SQL Editor**
2. Exécutez le contenu de `supabase/migrations/20250121000000_create_platform_settings.sql`

### 2. Configuration des Secrets Supabase

Pour que l'Edge Function `upload-bunny-video` fonctionne, vous devez configurer les secrets suivants dans Supabase :

#### Via le Dashboard Supabase :

1. Allez dans **Settings** > **Edge Functions** > **Secrets**
2. Ajoutez les secrets suivants :

```
BUNNY_STREAM_LIBRARY_ID=votre_library_id
BUNNY_STREAM_API_KEY=votre_api_key
```

#### Via la CLI Supabase :

```bash
supabase secrets set BUNNY_STREAM_LIBRARY_ID=votre_library_id
supabase secrets set BUNNY_STREAM_API_KEY=votre_api_key
```

### 3. Déploiement de l'Edge Function

Déployez l'Edge Function `upload-bunny-video` :

```bash
supabase functions deploy upload-bunny-video
```

## 🎯 Utilisation

### Paramètres de la Plateforme

1. Connectez-vous en tant qu'admin
2. Allez dans **Admin** > **Paramètres**
3. Modifiez les paramètres dans les onglets :
   - **Apparence** : Personnalisez l'interface
   - **Emails** : Configurez les templates d'emails
   - **Intégrations** : Configurez Stripe, Bunny Stream, webhooks

Les paramètres sont automatiquement sauvegardés dans Supabase.

### Upload de Vidéos

#### Option 1 : Via le Composant VideoUploadModal

Le composant `VideoUploadModal` est disponible dans `src/components/admin/VideoUploadModal.tsx`.

Pour l'utiliser dans une page :

```tsx
import { useState } from 'react';
import VideoUploadModal from '../../components/admin/VideoUploadModal';

function MyPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadComplete = (videoId: string, title: string) => {
    console.log('Vidéo uploadée:', videoId, title);
    // Associer la vidéo à une leçon, etc.
  };

  return (
    <>
      <button onClick={() => setIsUploadModalOpen(true)}>
        Uploader une vidéo
      </button>
      
      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
```

#### Option 2 : Via le Service Directement

```tsx
import { uploadBunnyVideo } from '../services/bunnyStreamService';

const handleUpload = async (file: File, title: string) => {
  try {
    const result = await uploadBunnyVideo(title, file, (progress) => {
      console.log(`Upload: ${progress}%`);
    });
    console.log('Vidéo uploadée:', result.videoId);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## 🔒 Sécurité

- L'Edge Function vérifie que l'utilisateur est authentifié
- Seuls les admins peuvent uploader des vidéos
- Les clés API Bunny Stream sont stockées comme secrets Supabase (jamais exposées côté client)
- Les paramètres sont protégés par RLS (Row Level Security)

## 📝 Notes Importantes

1. **Taille des fichiers** : L'upload supporte des fichiers jusqu'à 2GB
2. **Formats supportés** : Tous les formats vidéo supportés par Bunny Stream (MP4, MOV, AVI, etc.)
3. **Progression** : Le composant `VideoUploadModal` affiche la progression de l'upload en temps réel
4. **Gestion d'erreurs** : Les erreurs sont affichées via des toasts

## 🐛 Dépannage

### L'upload échoue avec "Bunny Stream configuration missing"

Vérifiez que les secrets sont bien configurés dans Supabase :
- `BUNNY_STREAM_LIBRARY_ID`
- `BUNNY_STREAM_API_KEY`

### L'upload échoue avec "Unauthorized: Admin access required"

Vérifiez que votre profil a le rôle `admin` dans la table `profiles`.

### Les paramètres ne se sauvegardent pas

Vérifiez que :
1. La migration a bien été exécutée
2. Votre profil a le rôle `admin`
3. Les policies RLS sont correctement configurées

## 🔄 Prochaines Étapes (Optionnelles)

1. **Upload par URL** : Ajouter la possibilité d'uploader une vidéo depuis une URL
2. **Prévisualisation** : Afficher un aperçu de la vidéo avant l'upload
3. **Compression** : Compresser les vidéos avant l'upload
4. **Thumbnails** : Générer automatiquement des miniatures

