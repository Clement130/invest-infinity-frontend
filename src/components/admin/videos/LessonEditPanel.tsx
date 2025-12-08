import { useState, useEffect } from 'react';
import { Save, X, Upload, Trash2, ExternalLink, Play, Eye, Video } from 'lucide-react';
import { getThumbnailUrl, formatDuration } from '../../../lib/bunny';
import { SecureVideoPreview } from './SecureVideoPreview';
import type { TrainingLesson } from '../../../types/training';
import toast from 'react-hot-toast';

interface LessonEditPanelProps {
  lesson: TrainingLesson | null;
  moduleTitle?: string;
  onClose: () => void;
  onSave: (lesson: Partial<TrainingLesson>) => Promise<void>;
  onUploadVideo?: () => void;
  onReplaceVideo?: () => void;
  onRemoveVideo?: () => void;
  onSelectFromLibrary?: () => void;
}

export function LessonEditPanel({
  lesson,
  moduleTitle,
  onClose,
  onSave,
  onUploadVideo,
  onReplaceVideo,
  onRemoveVideo,
  onSelectFromLibrary,
}: LessonEditPanelProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bunny_video_id: '',
    is_preview: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        bunny_video_id: lesson.bunny_video_id || '',
        is_preview: lesson.is_preview || false,
      });

      // Charger les métadonnées de la vidéo si elle existe
      if (lesson.bunny_video_id) {
        // TODO: Charger depuis l'API Bunny
        setVideoMetadata(null);
      }
    }
  }, [lesson]);

  const handleSave = async () => {
    if (!lesson) return;

    setIsSaving(true);
    try {
      await onSave({
        id: lesson.id,
        ...formData,
      });
      toast.success('Leçon sauvegardée avec succès');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        bunny_video_id: lesson.bunny_video_id || '',
        is_preview: lesson.is_preview || false,
      });
    }
  };

  if (!lesson) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-gray-400">Sélectionnez une leçon pour l'éditer</p>
      </div>
    );
  }

  const hasVideo = Boolean(formData.bunny_video_id);
  const thumbnailUrl = hasVideo ? getThumbnailUrl(formData.bunny_video_id) : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">✏️ ÉDITION LEÇON</h3>
          {moduleTitle && (
            <p className="text-sm text-gray-400">
              Module : <span className="text-white">{moduleTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-white/10 transition"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Titre */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Titre</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          placeholder="Titre de la leçon"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Description (optionnel)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          placeholder="Description de la leçon"
        />
      </div>

      {/* Vidéo actuelle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">🎬 Vidéo actuelle</label>
        {hasVideo ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              {/* Miniature cliquable pour prévisualisation */}
              <div className="relative group cursor-pointer mb-3" onClick={() => setShowPreview(true)}>
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-700 rounded flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-full text-white text-sm">
                    <Eye className="w-4 h-4" />
                    Prévisualiser
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white font-medium">Vidéo assignée</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    ID: {formData.bunny_video_id.slice(0, 8)}...
                  </div>
                  {videoMetadata && (
                    <div className="text-xs text-gray-400">
                      Durée: {formatDuration(videoMetadata.length)}
                    </div>
                  )}
                </div>
                <a
                  href={`https://dash.bunny.net/stream/library/videos/${formData.bunny_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded hover:bg-white/10 transition"
                  title="Ouvrir dans Bunny Dashboard"
                >
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition text-sm"
              >
                <Play className="w-4 h-4" />
                Prévisualiser
              </button>
              {onSelectFromLibrary && (
                <button
                  onClick={onSelectFromLibrary}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition text-sm"
                >
                  <Video className="w-4 h-4" />
                  Changer
                </button>
              )}
              {onReplaceVideo && (
                <button
                  onClick={onReplaceVideo}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Uploader
                </button>
              )}
              {onRemoveVideo && (
                <button
                  onClick={onRemoveVideo}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Retirer
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 bg-black/40 p-8 text-center space-y-3">
            <p className="text-sm text-gray-400 mb-3">Aucune vidéo assignée</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {onSelectFromLibrary && (
                <button
                  onClick={onSelectFromLibrary}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
                >
                  <Video className="w-4 h-4" />
                  Choisir depuis la bibliothèque
                </button>
              )}
              {onUploadVideo && (
                <button
                  onClick={onUploadVideo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition"
                >
                  <Upload className="w-4 h-4" />
                  Uploader une vidéo
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de prévisualisation sécurisée */}
      {showPreview && hasVideo && (
        <SecureVideoPreview
          videoId={formData.bunny_video_id}
          title={formData.title || 'Prévisualisation'}
          mode="modal"
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* ID vidéo (manuel) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">ID vidéo Bunny Stream</label>
        <input
          type="text"
          value={formData.bunny_video_id}
          onChange={(e) => setFormData({ ...formData, bunny_video_id: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          placeholder="ex: 8254f866-0ab0-498c-b1fe-5ef2b66a2ab8"
        />
        <p className="text-xs text-gray-500">
          Copiez-collez l'ID depuis Bunny Stream ou utilisez les boutons ci-dessus
        </p>
      </div>

      {/* Niveau d'accès */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">🔒 Niveau d'accès</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="access"
              value="preview"
              checked={formData.is_preview}
              onChange={() => setFormData({ ...formData, is_preview: true })}
              className="w-4 h-4 text-purple-500"
            />
            <span className="text-sm text-white">Aperçu (gratuit)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="access"
              value="full"
              checked={!formData.is_preview}
              onChange={() => setFormData({ ...formData, is_preview: false })}
              className="w-4 h-4 text-purple-500"
            />
            <span className="text-sm text-white">Complet (payant)</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition text-sm"
        >
          Réinitialiser
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition text-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

