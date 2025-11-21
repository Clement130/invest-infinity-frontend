import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { VideoProgressTracker, type VideoProgressEvent } from '../../services/progressTrackingService';

interface BunnyPlayerProps {
  videoId: string;
  userId?: string;
  lessonId?: string;
  onProgress?: (event: VideoProgressEvent) => void;
}

export default function BunnyPlayer({ videoId, userId, lessonId, onProgress }: BunnyPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackerRef = useRef<VideoProgressTracker | null>(null);
  const progressCheckIntervalRef = useRef<number | null>(null);
  const baseUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;

  // Initialiser le tracker si userId et lessonId sont fournis
  useEffect(() => {
    if (userId && lessonId) {
      trackerRef.current = new VideoProgressTracker(userId, lessonId);
    }
    return () => {
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
      }
    };
  }, [userId, lessonId]);

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

  // Fonction pour vérifier la progression de la vidéo via l'API BunnyStream
  const checkVideoProgress = useCallback(async () => {
    if (!iframeRef.current || !videoId || !baseUrl) return;

    try {
      // Note: BunnyStream ne permet pas d'accéder directement à la progression via iframe
      // Pour un suivi précis, il faudrait utiliser l'API BunnyStream avec un token
      // Pour l'instant, on simule avec un délai basé sur le temps écoulé
      // Cette approche sera améliorée avec l'intégration de l'API BunnyStream
      
      // Si on a un tracker et que la vidéo est chargée, on peut estimer la progression
      // En production, utiliser l'API BunnyStream pour obtenir le temps réel
    } catch (error) {
      console.error('[BunnyPlayer] Erreur lors de la vérification de progression:', error);
    }
  }, [videoId, baseUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Démarrer le suivi de progression si userId et lessonId sont fournis
    if (userId && lessonId && trackerRef.current) {
      // Marquer comme "vue" après 30 secondes (approximation)
      // En production, utiliser les événements réels de BunnyStream
      setTimeout(async () => {
        if (trackerRef.current) {
          const event: VideoProgressEvent = {
            currentTime: 30,
            duration: 100,
            percentage: 30,
          };
          await trackerRef.current.handleProgress(event);
          if (onProgress) onProgress(event);
        }
      }, 30000);
    }
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

  // Timeout pour détecter les vidéos qui ne chargent pas
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      // Si toujours en chargement après 15 secondes, considérer comme erreur potentielle
      if (isLoading) {
        console.warn('[BunnyPlayer] Timeout: la vidéo prend trop de temps à charger');
        setIsLoading(false);
        // Ne pas définir hasError automatiquement car l'iframe pourrait encore charger
        // mais on arrête au moins le spinner pour éviter un écran noir infini
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isLoading, videoId]);

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
            <p className="text-gray-400 text-sm">Chargement de la vidéo...</p>
            <p className="text-gray-500 text-xs">Cela peut prendre quelques instants</p>
          </div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
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
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        title="Lecteur vidéo Bunny Stream"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ 
          backgroundColor: '#000',
          minHeight: '100%',
        }}
      />
    </div>
  );
}


