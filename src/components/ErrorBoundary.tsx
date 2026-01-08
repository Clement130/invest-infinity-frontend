import { Component, type ReactNode } from 'react';
import { 
  isChunkLoadError, 
  shouldAttemptReload, 
  markReloadAttempted, 
  forceHardReload 
} from '../utils/lazyWithRetry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const chunkError = isChunkLoadError(error);
    return { hasError: true, error, isChunkError: chunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erreur capturée:', error, errorInfo);
    
    // Si c'est une erreur de chunk et qu'on n'a pas encore tenté de reload
    if (isChunkLoadError(error) && shouldAttemptReload()) {
      console.warn('[ErrorBoundary] Chunk load error - forcing hard reload...');
      markReloadAttempted();
      forceHardReload();
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
    
    if (this.state.isChunkError) {
      // Pour les erreurs de chunk, forcer un hard reload
      forceHardReload();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunk = this.state.isChunkError;

      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center space-y-4 max-w-md px-4">
            <h1 className="text-2xl font-bold text-red-400">
              {isChunk ? 'Mise à jour détectée' : 'Une erreur est survenue'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isChunk 
                ? 'Une nouvelle version de l\'application est disponible. Veuillez recharger la page pour continuer.'
                : (this.state.error?.message || 'Erreur inconnue')
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
              >
                {isChunk ? 'Mettre à jour' : 'Recharger la page'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

