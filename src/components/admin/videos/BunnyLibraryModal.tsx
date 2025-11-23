import { useState } from 'react';
import { X, Search, Video as VideoIcon, CheckCircle2, AlertCircle, Copy, ExternalLink, Target } from 'lucide-react';
import { useBunnyLibrary } from '../../../hooks/admin/useBunnyLibrary';
import { getBunnyThumbnail, formatDuration } from '../../../utils/admin/bunnyStreamAPI';
import toast from 'react-hot-toast';

interface BunnyLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo?: (videoId: string) => void;
  onAssignVideo?: (videoId: string) => void;
  selectedLessonTitle?: string;
}

export function BunnyLibraryModal({
  isOpen,
  onClose,
  onSelectVideo,
  onAssignVideo,
  selectedLessonTitle,
}: BunnyLibraryModalProps) {
  const { videos, orphanVideos, assignedVideos, isLoading, error, isConfigured } = useBunnyLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'orphan'>('all');

  if (!isOpen) return null;

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'assigned' && !video.isOrphan) ||
      (filter === 'orphan' && video.isOrphan);
    return matchesSearch && matchesFilter;
  });

  const handleCopyId = async (videoId: string) => {
    try {
      await navigator.clipboard.writeText(videoId);
      toast.success('ID copié dans le presse-papiers');
    } catch (error) {
      toast.error('Impossible de copier l\'ID');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">🎞️ BIBLIOTHÈQUE BUNNY STREAM</h2>
            <p className="text-sm text-gray-400">
              {videos.length} vidéo{videos.length > 1 ? 's' : ''} disponible{videos.length > 1 ? 's' : ''}
            </p>
            {selectedLessonTitle && onSelectVideo && (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm">
                📝 Assignation à : <span className="font-semibold">{selectedLessonTitle}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Search and filters */}
        <div className="p-6 border-b border-white/10 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher une vidéo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              Toutes ({videos.length})
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'assigned'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              Assignées ({assignedVideos.length})
            </button>
            <button
              onClick={() => setFilter('orphan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'orphan'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              🔴 Orphelines ({orphanVideos.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isConfigured ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-amber-400 text-lg mb-2">⚠️ Configuration requise</div>
              <p className="text-gray-400 max-w-md mx-auto">
                Les variables d'environnement Bunny Stream ne sont pas configurées.
                <br />
                <br />
                <strong className="text-white">En production (Vercel) :</strong>
                <br />
                Configurez ces variables dans <strong>Vercel → Settings → Environment Variables</strong> :
                <br />
                <code className="bg-black/40 px-1 py-0.5 rounded text-xs">VITE_BUNNY_STREAM_LIBRARY_ID</code>
                <br />
                <code className="bg-black/40 px-1 py-0.5 rounded text-xs">VITE_BUNNY_EMBED_BASE_URL</code>
                <br />
                <br />
                <strong className="text-white">En développement local :</strong>
                <br />
                Configurez-les dans votre fichier <code className="bg-black/40 px-1 py-0.5 rounded text-xs">.env.local</code>.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-red-400 text-lg mb-2">❌ Erreur de chargement</div>
              <p className="text-gray-400">
                Impossible de charger les vidéos depuis Bunny Stream.
                <br />
                Vérifiez vos clés API et votre connexion.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-gray-400">
              Chargement de la bibliothèque...
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Aucune vidéo trouvée</p>
              {searchQuery && (
                <p className="text-sm mt-2">Essayez de modifier votre recherche</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => {
                const thumbnailUrl = getBunnyThumbnail(video.guid);
                return (
                  <div
                    key={video.guid}
                    className={`rounded-lg border p-4 space-y-3 ${
                      video.isOrphan
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-white/10 bg-black/40'
                    }`}
                  >
                    {/* Thumbnail */}
                    {thumbnailUrl && (
                      <div className="relative aspect-video rounded overflow-hidden bg-gray-800">
                        <img
                          src={thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        {video.length > 0 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white">
                            {formatDuration(video.length)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div>
                      <h3 className="font-semibold text-white mb-1 line-clamp-2">{video.title}</h3>
                      <code className="text-xs text-purple-300 font-mono block truncate">
                        {video.guid}
                      </code>
                      {video.isOrphan ? (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="w-3 h-3" />
                          <span>Non assignée</span>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Assignée</span>
                          </div>
                          {video.assignedToLessonTitle && (
                            <div className="text-xs text-gray-400">
                              {video.assignedToModuleTitle} → {video.assignedToLessonTitle}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyId(video.guid)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 transition text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        Copier
                      </button>
                      {onSelectVideo && (
                        <button
                          onClick={() => {
                            onSelectVideo(video.guid);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition text-xs"
                        >
                          <VideoIcon className="w-3 h-3" />
                          Utiliser
                        </button>
                      )}
                      {onAssignVideo && video.isOrphan && (
                        <button
                          onClick={() => {
                            onAssignVideo(video.guid);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition text-xs"
                        >
                          <Target className="w-3 h-3" />
                          Assigner
                        </button>
                      )}
                      <a
                        href={`https://bunny.net/stream/library/videos/${video.guid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition"
                      >
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

