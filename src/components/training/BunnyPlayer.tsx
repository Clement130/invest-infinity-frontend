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
  play(): void;
  pause(): void;
  getPaused(callback: (paused: boolean) => void): void;
  getDuration(callback: (duration: number) => void): void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(callback: (seconds: number) => void): void;
}

interface BunnyPlayerProps {
  videoId: string;
  userId?: string;
  lessonId?: string;
  onProgress?: (event: VideoProgressEvent) => void;
}

// Clé pour la persistence dans sessionStorage
const getStorageKey = (lessonId: string | undefined, videoId: string) => 
  `bunny_video_${lessonId || 'default'}_${videoId}`;

export default function BunnyPlayer({ videoId, userId, lessonId, onProgress }: BunnyPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackerRef = useRef<VideoProgressTracker | null>(null);
  const playerRef = useRef<PlayerJS | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const saveIntervalRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  const isTestVideo = videoId?.startsWith('test-');
  const isMissingVideoId = !videoId || videoId.trim() === '';

  // ============================================================================
  // SAUVEGARDE SIMPLE - toutes les 2 secondes
  // ============================================================================
  const saveCurrentTime = useCallback(() => {
    if (!playerRef.current || !videoId) return;
    
    playerRef.current.getCurrentTime((time: number) => {
      if (typeof time === 'number' && !isNaN(time) && time > 0) {
        playerRef.current?.getPaused((paused: boolean) => {
          const data = { time, playing: !paused, saved: Date.now() };
          sessionStorage.setItem(getStorageKey(lessonId, videoId), JSON.stringify(data));
          lastTimeRef.current = time;
        });
      }
    });
  }, [videoId, lessonId]);

  // ============================================================================
  // RESTAURATION SIMPLE - au chargement du player
  // ============================================================================
  const restoreTime = useCallback(() => {
    if (!playerRef.current || !videoId) return;
    
    const saved = sessionStorage.getItem(getStorageKey(lessonId, videoId));
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      const age = Date.now() - data.saved;
      
      // Restaurer seulement si sauvegardé il y a moins de 30 minutes
      if (age < 1800000 && data.time > 2) {
        console.log('[BunnyPlayer] Restauration à', data.time.toFixed(1), 's');
        
        // Attendre un peu que le player soit vraiment prêt
        setTimeout(() => {
          playerRef.current?.setCurrentTime(data.time);
          
          // Vérifier et réessayer si nécessaire
          setTimeout(() => {
            playerRef.current?.getCurrentTime((currentTime: number) => {
              if (Math.abs(currentTime - data.time) > 5) {
                playerRef.current?.setCurrentTime(data.time);
              }
            });
          }, 500);
        }, 300);
      }
    } catch (e) {
      console.warn('[BunnyPlayer] Erreur restauration:', e);
    }
  }, [videoId, lessonId]);

  // ============================================================================
  // TRACKER DE PROGRESSION
  // ============================================================================
  useEffect(() => {
    if (userId && lessonId) {
      trackerRef.current = new VideoProgressTracker(userId, lessonId);
    }
    
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [userId, lessonId]);

  // ============================================================================
  // CHARGEMENT DE L'URL SÉCURISÉE
  // ============================================================================
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setEmbedUrl('');

    if (isTestVideo || isMissingVideoId) {
      setHasError(isTestVideo);
      setIsLoading(false);
      return;
    }

    VideoService.getPlaybackUrl(videoId, { expiryHours: 4 })
      .then(result => {
        setEmbedUrl(result.embedUrl + '&autoplay=false&preload=true');
        setIsLoading(false);
      })
      .catch(error => {
        console.error('[BunnyPlayer] Erreur:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Erreur de chargement');
        setIsLoading(false);
      });
  }, [videoId, isTestVideo, isMissingVideoId]);

  // ============================================================================
  // VÉRIFICATION DE PROGRESSION
  // ============================================================================
  const checkProgress = useCallback(() => {
    if (!playerRef.current || !videoId) return;

    playerRef.current.getDuration((duration: number) => {
      playerRef.current?.getCurrentTime((currentTime: number) => {
        if (duration > 0) {
          const event: VideoProgressEvent = {
            currentTime,
            duration,
            percentage: (currentTime / duration) * 100,
          };
          trackerRef.current?.handleProgress(event);
          onProgress?.(event);
        }
      });
    });
  }, [videoId, onProgress]);

  // ============================================================================
  // INITIALISATION DU PLAYER
  // ============================================================================
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);

    if (!iframeRef.current || !window.playerjs || !userId || !lessonId) return;

    try {
      playerRef.current = new window.playerjs.Player(iframeRef.current);

      playerRef.current.on('ready', () => {
        console.log('[BunnyPlayer] Player prêt');
        
        // Restaurer la position sauvegardée
        restoreTime();

        // Écouter les événements
        playerRef.current?.on('timeupdate', checkProgress);
        playerRef.current?.on('play', saveCurrentTime);
        playerRef.current?.on('pause', saveCurrentTime);
        playerRef.current?.on('ended', () => {
          sessionStorage.removeItem(getStorageKey(lessonId, videoId));
        });

        // Sauvegarde périodique toutes les 2 secondes
        if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = window.setInterval(saveCurrentTime, 2000);

        // Suivi de progression toutes les 30 secondes
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = window.setInterval(() => {
          trackerRef.current?.updateLastViewed();
        }, 30000);
      });
    } catch (error) {
      console.error('[BunnyPlayer] Erreur init:', error);
    }
  }, [userId, lessonId, videoId, checkProgress, saveCurrentTime, restoreTime]);

  // ============================================================================
  // RENDU
  // ============================================================================
  if (isMissingVideoId) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-yellow-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-yellow-400 font-medium text-lg">Vidéo non configurée</p>
          <p className="text-sm text-gray-400">Aucun identifiant vidéo n'est associé à cette leçon.</p>
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
          <p className="text-sm text-gray-400">Cette vidéo utilise un identifiant de test.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    const isAccessDenied = errorMessage.includes('accès') || errorMessage.includes('403');
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          {isAccessDenied ? <Lock className="w-12 h-12 text-orange-400 mx-auto" /> : <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />}
          <p className={`font-medium text-lg ${isAccessDenied ? 'text-orange-400' : 'text-red-400'}`}>
            {isAccessDenied ? 'Accès non autorisé' : 'Erreur de chargement'}
          </p>
          <p className="text-sm text-gray-400">{errorMessage || 'La vidéo n\'a pas pu être chargée.'}</p>
        </div>
      </div>
    );
  }

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
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title="Lecteur vidéo"
        onLoad={handleIframeLoad}
        onError={() => { setHasError(true); setIsLoading(false); }}
        style={{ backgroundColor: '#000' }}
      />
    </div>
  );
}
