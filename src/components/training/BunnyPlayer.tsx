import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface BunnyPlayerProps {
  videoId: string;
}

export default function BunnyPlayer({ videoId }: BunnyPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;

  useEffect(() => {
    // Réinitialiser l'état d'erreur quand le videoId change
    setHasError(false);
    setIsLoading(true);

    // Vérifier si c'est un ID de test (qui ne fonctionnera pas)
    if (videoId && videoId.startsWith('test-')) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [videoId]);

  if (!baseUrl) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <p className="text-red-400 font-medium">
            Bunny Stream n'est pas configuré
          </p>
          <p className="text-sm text-gray-400">
            La variable d'environnement VITE_BUNNY_EMBED_BASE_URL est manquante.
          </p>
        </div>
      </div>
    );
  }

  if (!videoId || videoId.trim() === '') {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-yellow-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <p className="text-yellow-400 font-medium">Vidéo non configurée</p>
          <p className="text-sm text-gray-400">
            Aucun identifiant vidéo n'est associé à cette leçon.
          </p>
        </div>
      </div>
    );
  }

  // Détecter les IDs de test
  if (videoId.startsWith('test-')) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-orange-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto" />
          <p className="text-orange-400 font-medium text-lg">Vidéo non disponible</p>
          <p className="text-sm text-gray-400">
            Cette vidéo utilise un identifiant de test et n'est pas encore configurée.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ID vidéo: {videoId}
          </p>
        </div>
      </div>
    );
  }

  // Construction de l'URL d'embed
  const embedUrl = `${baseUrl}/${videoId}`;

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-400 font-medium text-lg">Erreur de chargement</p>
          <p className="text-sm text-gray-400">
            La vidéo n'a pas pu être chargée. Vérifiez que l'ID vidéo est correct.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ID vidéo: {videoId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
            <p className="text-gray-400 text-sm">Chargement de la vidéo...</p>
          </div>
        </div>
      )}
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        title="Lecteur vidéo Bunny Stream"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}


