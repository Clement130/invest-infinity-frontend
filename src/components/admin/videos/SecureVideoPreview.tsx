/**
 * SecureVideoPreview – Prévisualisation vidéo sécurisée pour l'admin
 * 
 * Utilise des URLs signées via l'Edge Function generate-bunny-token.
 * L'URL expire après 2 heures pour limiter le partage non autorisé.
 */

import { useState, useEffect, useCallback } from 'react';
import { Play, Loader2, AlertCircle, RefreshCw, X, Maximize2 } from 'lucide-react';
import { VideoService } from '../../../services/videoService';
import type { SecurePlaybackUrlResponse } from '../../../types/video';

interface SecureVideoPreviewProps {
  /** ID de la vidéo Bunny */
  videoId: string;
  /** Titre de la vidéo (pour l'accessibilité) */
  title?: string;
  /** Callback quand la modal est fermée */
  onClose?: () => void;
  /** Mode compact (miniature cliquable) ou modal */
  mode?: 'thumbnail' | 'modal' | 'inline';
  /** Classe CSS additionnelle */
  className?: string;
}

export function SecureVideoPreview({
  videoId,
  title = 'Vidéo',
  onClose,
  mode = 'thumbnail',
  className = '',
}: SecureVideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secureUrl, setSecureUrl] = useState<SecurePlaybackUrlResponse | null>(null);
  const [showPlayer, setShowPlayer] = useState(mode === 'inline');

  const thumbnailUrl = VideoService.getThumbnailUrl(videoId);

  // Charger l'URL sécurisée
  const loadSecureUrl = useCallback(async () => {
    if (!videoId) {
      setError('ID vidéo manquant');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // URL valide 2 heures pour la preview admin
      const result = await VideoService.getPlaybackUrl(videoId, { expiryHours: 2 });
      setSecureUrl(result);
    } catch (err) {
      console.error('[SecureVideoPreview] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  // Charger automatiquement en mode inline
  useEffect(() => {
    if (mode === 'inline' && videoId) {
      loadSecureUrl();
    }
  }, [mode, videoId, loadSecureUrl]);

  // Gérer le clic sur la miniature
  const handleThumbnailClick = async () => {
    if (mode === 'thumbnail') {
      await loadSecureUrl();
      setShowPlayer(true);
    }
  };

  // Fermer le player
  const handleClose = () => {
    setShowPlayer(false);
    setSecureUrl(null);
    onClose?.();
  };

  // Mode miniature cliquable
  if (mode === 'thumbnail' && !showPlayer) {
    return (
      <button
        onClick={handleThumbnailClick}
        disabled={isLoading}
        className={`
          relative group rounded-lg overflow-hidden bg-slate-800
          aspect-video w-full cursor-pointer
          hover:ring-2 hover:ring-purple-500/50 transition-all
          ${className}
        `}
        aria-label={`Prévisualiser ${title}`}
      >
        {/* Miniature */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-700">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-purple-600">
                <Play className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-white font-medium">Prévisualiser</span>
            </div>
          )}
        </div>
      </button>
    );
  }

  // Mode modal ou inline avec player
  const PlayerContent = () => (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Chargement sécurisé...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center space-y-4 px-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <p className="text-red-400 font-medium">Erreur de chargement</p>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
            <button
              onClick={loadSecureUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {secureUrl && !error && (
        <iframe
          src={secureUrl.embedUrl}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title}
          style={{ border: 'none' }}
        />
      )}
    </div>
  );

  // Mode modal
  if (mode === 'modal' || (mode === 'thumbnail' && showPlayer)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl">
          {/* Boutons de contrôle */}
          <div className="absolute -top-12 right-0 flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Titre */}
          <div className="mb-3">
            <h3 className="text-lg font-medium text-white truncate">{title}</h3>
          </div>

          {/* Player */}
          <PlayerContent />

          {/* Infos de sécurité */}
          {secureUrl && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>URL sécurisée • Expire dans 2h</span>
              <span>ID: {videoId}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mode inline
  return (
    <div className={`space-y-2 ${className}`}>
      <PlayerContent />
      {secureUrl && (
        <p className="text-xs text-gray-500">
          URL sécurisée • Expire dans 2h
        </p>
      )}
    </div>
  );
}

export default SecureVideoPreview;

