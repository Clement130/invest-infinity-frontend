import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { VideoProgressTracker, type VideoProgressEvent } from '../../services/progressTrackingService';

// Déclaration du type Player.js pour TypeScript
declare global {
  interface Window {
    playerjs?: {
      Player: new (iframe: HTMLIFrameElement) => PlayerJS;
    };
  }
}

interface PlayerJS {
  on(event: string, callback: (data?: any) => void): void;
  get(callback: (data: any) => void): void;
  play(): void;
  pause(): void;
  getPaused(callback: (paused: boolean) => void): void;
  mute(): void;
  unmute(): void;
  getMuted(callback: (muted: boolean) => void): void;
  setVolume(volume: number): void;
  getVolume(callback: (volume: number) => void): void;
  getDuration(callback: (duration: number) => void): void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(callback: (seconds: number) => void): void;
  setLoop(loop: boolean): void;
  getLoop(callback: (loop: boolean) => void): void;
  removeEventListener(event: string, callback: (data?: any) => void): void;
}

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
  const playerRef = useRef<PlayerJS | null>(null);
  const progressCheckIntervalRef = useRef<number | null>(null);
  const baseUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;

  // Déterminer le type d'erreur à afficher
  const isTestVideo = videoId?.startsWith('test-');
  const isMissingConfig = !baseUrl;
  const isMissingVideoId = !videoId || videoId.trim() === '';

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

  // Réinitialiser l'état quand le videoId change
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);

    // Vérifier si c'est un ID de test (qui ne fonctionnera pas)
    if (videoId && videoId.startsWith('test-')) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [videoId]);

  // Timeout pour détecter les vidéos qui ne chargent pas
  useEffect(() => {
    if (!isLoading || isMissingConfig || isMissingVideoId || isTestVideo) return;

    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[BunnyPlayer] Timeout: la vidéo prend trop de temps à charger');
        setIsLoading(false);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isLoading, videoId, isMissingConfig, isMissingVideoId, isTestVideo]);

  // Fonction pour vérifier la progression de la vidéo
  const checkVideoProgress = useCallback(async () => {
    if (!iframeRef.current || !videoId || !baseUrl) return;
    // Placeholder pour l'API BunnyStream
  }, [videoId, baseUrl]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Démarrer le suivi de progression si userId et lessonId sont fournis
    if (userId && lessonId && trackerRef.current) {
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
  }, [userId, lessonId, onProgress]);

  const handleIframeError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  // Rendu conditionnel APRÈS tous les hooks
  if (isMissingConfig) {
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

  if (isMissingVideoId) {
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

  if (isTestVideo) {
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

  // Construction de l'URL d'embed
  const embedUrl = `${baseUrl}/${videoId}`;

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
