import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { VideoProgressTracker, type VideoProgressEvent } from '../../services/progressTrackingService';
import { VideoService } from '../../services/videoService';

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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackerRef = useRef<VideoProgressTracker | null>(null);
  const playerRef = useRef<PlayerJS | null>(null);
  const progressCheckIntervalRef = useRef<number | null>(null);

  // Déterminer le type d'erreur à afficher
  const isTestVideo = videoId?.startsWith('test-');
  const isMissingVideoId = !videoId || videoId.trim() === '';

  // Initialiser le tracker si userId et lessonId sont fournis
  useEffect(() => {
    if (userId && lessonId) {
      console.log('[BunnyPlayer] Création du tracker pour:', { userId, lessonId, videoId });
      trackerRef.current = new VideoProgressTracker(userId, lessonId);
    } else {
      console.log('[BunnyPlayer] Tracker non créé - paramètres manquants:', { userId: !!userId, lessonId: !!lessonId });
    }
    return () => {
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
      }
    };
  }, [userId, lessonId, videoId]);

  // Générer l'URL d'embed SÉCURISÉE avec token via Edge Function
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setEmbedUrl('');

    // Vérifier si c'est un ID de test (qui ne fonctionnera pas)
    if (videoId && videoId.startsWith('test-')) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (!videoId) {
      setIsLoading(false);
      return;
    }

    // Générer l'URL sécurisée via l'Edge Function
    const fetchSecureUrl = async () => {
      try {
        console.log('[BunnyPlayer] Génération du token sécurisé pour:', videoId);
        const result = await VideoService.getPlaybackUrl(videoId, { expiryHours: 4 }); // Token valide 4h
        console.log('[BunnyPlayer] URL sécurisée générée');
        setEmbedUrl(result.embedUrl + '&autoplay=false&preload=true');
        setIsLoading(false);
      } catch (error) {
        console.error('[BunnyPlayer] Erreur génération token:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Erreur de chargement');
        setIsLoading(false);
      }
    };

    fetchSecureUrl();
  }, [videoId]);

  // Timeout pour détecter les vidéos qui ne chargent pas
  useEffect(() => {
    if (!isLoading || isMissingVideoId || isTestVideo) return;

    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[BunnyPlayer] Timeout: la vidéo prend trop de temps à charger');
        setIsLoading(false);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isLoading, videoId, isMissingVideoId, isTestVideo]);

  // Fonction pour vérifier la progression de la vidéo
  const checkVideoProgress = useCallback(async () => {
    if (!playerRef.current || !videoId) return;

    try {
      // Obtenir la durée totale
      playerRef.current.getDuration((duration: number) => {
        // Obtenir le temps actuel
        playerRef.current?.getCurrentTime((currentTime: number) => {
          if (duration > 0) {
            const percentage = (currentTime / duration) * 100;
            console.log('[BunnyPlayer] Progression détectée:', {
              currentTime,
              duration,
              percentage: Math.round(percentage)
            });

            // Créer l'événement de progression
            const event: VideoProgressEvent = {
              currentTime,
              duration,
              percentage,
            };

            // Notifier le tracker si disponible
            if (trackerRef.current) {
              trackerRef.current.handleProgress(event);
            }

            // Notifier le parent
            if (onProgress) {
              onProgress(event);
            }
          }
        });
      });
    } catch (error) {
      console.error('[BunnyPlayer] Erreur lors de la vérification de progression:', error);
    }
  }, [videoId, onProgress]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);

    // Initialiser Player.js si disponible
    if (iframeRef.current && window.playerjs && userId && lessonId) {
      try {
        playerRef.current = new window.playerjs.Player(iframeRef.current);

        // Attendre que le player soit prêt
        playerRef.current.on('ready', () => {
          console.log('[BunnyPlayer] Player.js prêt');

          // Écouter les événements de progression
          playerRef.current?.on('timeupdate', () => {
            checkVideoProgress();
          });

          // Écouter la fin de la vidéo
          playerRef.current?.on('ended', () => {
            console.log('[BunnyPlayer] Vidéo terminée');
            if (trackerRef.current) {
              // Marquer comme complétée à 100%
              const event: VideoProgressEvent = {
                currentTime: 100,
                duration: 100,
                percentage: 100,
              };
              trackerRef.current.handleProgress(event);
              if (onProgress) onProgress(event);
            }
          });

          // Démarrer le suivi périodique pour les mises à jour de last_viewed
          if (trackerRef.current && progressCheckIntervalRef.current === null) {
            progressCheckIntervalRef.current = window.setInterval(() => {
              trackerRef.current?.updateLastViewed();
            }, 30000); // Toutes les 30 secondes
          }
        });

        // Démarrer une vérification initiale après un court délai
        setTimeout(() => {
          checkVideoProgress();
        }, 2000);

      } catch (error) {
        console.error('[BunnyPlayer] Erreur lors de l\'initialisation de Player.js:', error);
      }
    }
  }, [userId, lessonId, onProgress, checkVideoProgress]);

  const handleIframeError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  // Rendu conditionnel APRÈS tous les hooks
  if (isMissingVideoId) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-yellow-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-yellow-400 font-medium text-lg">Vidéo non configurée</p>
          <p className="text-sm text-gray-400">
            Aucun identifiant vidéo n'est associé à cette leçon.
          </p>
          {lessonId && (
            <p className="text-xs text-gray-500 mt-2">
              ID Leçon: {lessonId}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
            💡 Contactez un administrateur pour associer une vidéo à cette leçon.
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
    // Déterminer si c'est une erreur d'accès ou une autre erreur
    const isAccessDenied = errorMessage.includes('accès') || errorMessage.includes('access') || errorMessage.includes('403');
    
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          {isAccessDenied ? (
            <Lock className="w-12 h-12 text-orange-400 mx-auto" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          )}
          <p className={`font-medium text-lg ${isAccessDenied ? 'text-orange-400' : 'text-red-400'}`}>
            {isAccessDenied ? 'Accès non autorisé' : 'Erreur de chargement'}
          </p>
          <p className="text-sm text-gray-400">
            {errorMessage || 'La vidéo n\'a pas pu être chargée.'}
          </p>
          {!isAccessDenied && (
            <p className="text-xs text-gray-500 mt-2">
              ID vidéo: {videoId}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Ne rendre que si l'URL est chargée
  if (isLoading) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
            <p className="text-gray-400 text-sm">Chargement de la vidéo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
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
