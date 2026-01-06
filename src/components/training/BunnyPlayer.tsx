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

// Clé pour la persistence dans sessionStorage (par leçon)
const getStorageKey = (lessonId: string | undefined, videoId: string) => 
  `bunny_player_state_${lessonId || videoId}`;

export default function BunnyPlayer({ videoId, userId, lessonId, onProgress }: BunnyPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackerRef = useRef<VideoProgressTracker | null>(null);
  const playerRef = useRef<PlayerJS | null>(null);
  const progressCheckIntervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveStateIntervalRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const restorationAttemptedRef = useRef<boolean>(false);
  
  // Déterminer le type d'erreur à afficher
  const isTestVideo = videoId?.startsWith('test-');
  const isMissingVideoId = !videoId || videoId.trim() === '';
  
  // Détection mobile pour les optimisations
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // ============================================================================
  // INITIALISATION & NETTOYAGE
  // ============================================================================
  
  /**
   * Initialiser le tracker de progression
   */
  useEffect(() => {
    if (userId && lessonId) {
      console.log('[BunnyPlayer] Création du tracker pour:', { userId, lessonId, videoId });
      trackerRef.current = new VideoProgressTracker(userId, lessonId);
    } else {
      console.log('[BunnyPlayer] Tracker non créé - paramètres manquants:', { userId: !!userId, lessonId: !!lessonId });
    }
    
    return () => {
      // Nettoyage des intervalles
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
        progressCheckIntervalRef.current = null;
      }
      if (saveStateIntervalRef.current) {
        clearInterval(saveStateIntervalRef.current);
        saveStateIntervalRef.current = null;
      }
      
      // Sauvegarder une dernière fois avant de quitter
      if (playerRef.current) {
        persistPlayerState();
      }
    };
  }, [userId, lessonId, videoId, persistPlayerState]);
  
  /**
   * Nettoyage lors du changement de vidéo
   * Réinitialiser le flag de restauration
   */
  useEffect(() => {
    restorationAttemptedRef.current = false;
    lastSavedTimeRef.current = 0;
  }, [videoId, lessonId]);

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

  // ============================================================================
  // GESTION DE LA PERSISTENCE DE L'ÉTAT (sessionStorage)
  // ============================================================================
  
  /**
   * Sauvegarde l'état actuel dans sessionStorage
   * Appelé automatiquement toutes les secondes et lors des événements critiques
   */
  const persistPlayerState = useCallback(() => {
    if (!playerRef.current || !videoId) return;
    
    try {
      playerRef.current.getPaused((paused: boolean) => {
        playerRef.current?.getCurrentTime((currentTime: number) => {
          // Sauvegarder seulement si le temps a changé (éviter les écritures inutiles)
          if (Math.abs(currentTime - lastSavedTimeRef.current) >= 0.5) {
            const state = {
              currentTime,
              wasPlaying: !paused,
              timestamp: Date.now(),
            };
            
            try {
              sessionStorage.setItem(getStorageKey(lessonId, videoId), JSON.stringify(state));
              lastSavedTimeRef.current = currentTime;
              console.log('[BunnyPlayer] État persisté:', state);
            } catch (storageError) {
              console.warn('[BunnyPlayer] Impossible de sauvegarder dans sessionStorage:', storageError);
            }
          }
        });
      });
    } catch (error) {
      console.error('[BunnyPlayer] Erreur lors de la persistence:', error);
    }
  }, [videoId, lessonId]);
  
  /**
   * Restaure l'état depuis sessionStorage
   * Appelé automatiquement au chargement du player
   */
  const restorePersistedState = useCallback(() => {
    if (!playerRef.current || !videoId || restorationAttemptedRef.current) return;
    
    try {
      const savedStateStr = sessionStorage.getItem(getStorageKey(lessonId, videoId));
      if (!savedStateStr) {
        console.log('[BunnyPlayer] Aucun état persisté trouvé');
        return;
      }
      
      const savedState = JSON.parse(savedStateStr);
      const { currentTime, wasPlaying, timestamp } = savedState;
      
      // Vérifier que l'état n'est pas trop ancien (max 1 heure)
      const isStateStale = (Date.now() - timestamp) > 3600000;
      if (isStateStale) {
        console.log('[BunnyPlayer] État trop ancien, ignoré');
        sessionStorage.removeItem(getStorageKey(lessonId, videoId));
        return;
      }
      
      console.log('[BunnyPlayer] Restauration de l\'état persisté:', savedState);
      restorationAttemptedRef.current = true;
      
      // Attendre que le player soit prêt (avec retry)
      let attempts = 0;
      const maxAttempts = 30; // 3 secondes max
      
      const attemptRestore = () => {
        attempts++;
        
        if (!playerRef.current) {
          if (attempts < maxAttempts) {
            setTimeout(attemptRestore, 100);
          }
          return;
        }
        
        try {
          // Restaurer le temps
          if (typeof currentTime === 'number' && currentTime > 0) {
            playerRef.current.setCurrentTime(currentTime);
            console.log('[BunnyPlayer] Temps restauré à:', currentTime);
          }
          
          // Restaurer l'état de lecture après un délai
          const playDelay = isMobile ? 800 : 500;
          setTimeout(() => {
            if (playerRef.current && wasPlaying) {
              try {
                playerRef.current.play();
                console.log('[BunnyPlayer] Lecture automatiquement reprise');
              } catch (playError) {
                console.warn('[BunnyPlayer] Impossible de reprendre automatiquement (interaction requise)');
              }
            }
          }, playDelay);
          
        } catch (restoreError) {
          console.error('[BunnyPlayer] Erreur lors de la restauration:', restoreError);
          if (attempts < maxAttempts) {
            setTimeout(attemptRestore, 100);
          }
        }
      };
      
      attemptRestore();
      
    } catch (error) {
      console.error('[BunnyPlayer] Erreur lors de la lecture de l\'état persisté:', error);
      // Nettoyer l'état corrompu
      try {
        sessionStorage.removeItem(getStorageKey(lessonId, videoId));
      } catch {}
    }
  }, [videoId, lessonId, isMobile]);
  
  // ============================================================================
  // SUIVI DE PROGRESSION
  // ============================================================================
  
  /**
   * Vérifie et notifie la progression de la vidéo
   * Appelé lors des événements timeupdate
   */
  const checkVideoProgress = useCallback(async () => {
    if (!playerRef.current || !videoId) return;

    try {
      // Obtenir la durée totale
      playerRef.current.getDuration((duration: number) => {
        // Obtenir le temps actuel
        playerRef.current?.getCurrentTime((currentTime: number) => {
          if (duration > 0) {
            const percentage = (currentTime / duration) * 100;

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

  // ============================================================================
  // GESTION DES ÉVÉNEMENTS D'ORIENTATION & VISIBILITÉ
  // ============================================================================
  
  /**
   * Gestionnaire optimisé pour les changements d'orientation
   * Sauvegarde l'état immédiatement dans sessionStorage
   */
  useEffect(() => {
    const handleOrientationChange = () => {
      console.log('[BunnyPlayer] Changement d\'orientation détecté');
      
      // Sauvegarder immédiatement dans sessionStorage
      persistPlayerState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[BunnyPlayer] Page cachée - sauvegarde de l\'état');
        persistPlayerState();
      } else {
        console.log('[BunnyPlayer] Page visible - vérification de la restauration');
        // Ne restaurer que si la page était cachée pendant un changement d'orientation
        if (restorationAttemptedRef.current === false) {
          restorationAttemptedRef.current = false; // Permettre une nouvelle tentative
        }
      }
    };

    // Écouter les changements d'orientation (iOS et Android)
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Écouter screen.orientation pour Android moderne
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
    
    // Écouter les changements de visibilité (lorsque l'app passe en arrière-plan)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Écouter aussi les changements de taille de fenêtre avec debounce
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = window.setTimeout(() => {
        const isLandscape = window.innerWidth > window.innerHeight;
        const wasLandscape = containerRef.current?.dataset.orientation === 'landscape';
        
        if (isLandscape !== wasLandscape) {
          containerRef.current?.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait');
          handleOrientationChange();
        }
      }, 200);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initialiser l'orientation
    const initialOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    if (containerRef.current) {
      containerRef.current.setAttribute('data-orientation', initialOrientation);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [persistPlayerState]);

  /**
   * Gestionnaire pour les événements de plein écran
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      console.log('[BunnyPlayer] État plein écran:', isCurrentlyFullscreen);
      
      // Sauvegarder l'état lors des transitions plein écran
      if (isCurrentlyFullscreen) {
        persistPlayerState();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [persistPlayerState]);

  /**
   * Initialisation du player après chargement de l'iframe
   */
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);

    // Initialiser Player.js si disponible
    if (iframeRef.current && window.playerjs && userId && lessonId) {
      try {
        playerRef.current = new window.playerjs.Player(iframeRef.current);

        // Attendre que le player soit prêt
        playerRef.current.on('ready', () => {
          console.log('[BunnyPlayer] Player.js prêt');

          // 🎯 RESTAURER L'ÉTAT PERSISTÉ IMMÉDIATEMENT
          restorePersistedState();

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
            
            // Nettoyer l'état persisté quand la vidéo est terminée
            try {
              sessionStorage.removeItem(getStorageKey(lessonId, videoId));
            } catch {}
          });

          // Écouter les événements de pause/play pour sauvegarder l'état
          playerRef.current?.on('play', () => {
            console.log('[BunnyPlayer] Lecture démarrée');
            persistPlayerState();
          });

          playerRef.current?.on('pause', () => {
            console.log('[BunnyPlayer] Lecture en pause');
            persistPlayerState();
          });

          // 🔄 SAUVEGARDE PÉRIODIQUE DE L'ÉTAT (toutes les secondes)
          if (saveStateIntervalRef.current === null) {
            saveStateIntervalRef.current = window.setInterval(() => {
              persistPlayerState();
            }, 1000); // Toutes les secondes
          }

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
  }, [userId, lessonId, videoId, onProgress, checkVideoProgress, restorePersistedState, persistPlayerState]);

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

  // Détection mobile pour les styles
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl"
      style={{
        // Amélioration du FOV lors des changements d'orientation
        transition: isMobileDevice ? 'transform 0.2s ease-out' : 'transform 0.3s ease-out',
        transform: isFullscreen ? 'scale(1)' : 'scale(1)',
        // Assurer que le conteneur maintient ses proportions
        willChange: 'transform',
        // Optimisations spécifiques mobile
        WebkitTransform: 'translateZ(0)', // iOS Safari
        WebkitBackfaceVisibility: 'hidden', // iOS Safari
        // Prévenir le zoom sur double-tap iOS
        touchAction: 'pan-x pan-y',
      }}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
        allowFullScreen
        title="Lecteur vidéo Bunny Stream"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{
          backgroundColor: '#000',
          minHeight: '100%',
          // Amélioration du rendu lors des changements d'orientation
          objectFit: 'contain',
          // Préserver les proportions lors des rotations
          transform: 'translateZ(0)', // Force l'accélération matérielle
          WebkitTransform: 'translateZ(0)', // iOS Safari
          backfaceVisibility: 'hidden', // Améliore les performances lors des rotations
          WebkitBackfaceVisibility: 'hidden', // iOS Safari
          // Optimisations spécifiques mobile
          WebkitTouchCallout: 'none', // Désactiver le menu contextuel iOS
          WebkitUserSelect: 'none', // Désactiver la sélection iOS
          userSelect: 'none',
          // Prévenir le zoom sur double-tap
          touchAction: 'pan-x pan-y',
        }}
      />
    </div>
  );
}
