import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { TrainingLesson } from '../../../types/training';

interface LessonModalProps {
  lesson: TrainingLesson | null;
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<TrainingLesson> & { title: string; module_id: string }) => Promise<void>;
  isSaving?: boolean;
}

export function LessonModal({
  lesson,
  moduleId,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: LessonModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bunny_video_id: '',
    position: 0,
    is_preview: false,
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        bunny_video_id: lesson.bunny_video_id || '',
        position: lesson.position || 0,
        is_preview: lesson.is_preview || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        bunny_video_id: '',
        position: 0,
        is_preview: false,
      });
    }
  }, [lesson, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return;
    }
    await onSave({
      ...(lesson ? { id: lesson.id } : {}),
      module_id: moduleId,
      ...formData,
      bunny_video_id: formData.bunny_video_id.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            {lesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              placeholder="Ex: La Structure de marché"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              placeholder="Description de la leçon..."
            />
          </div>

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
              Laissez vide si vous assignerez la vidéo plus tard
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Position</label>
            <input
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              min="0"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_preview"
              checked={formData.is_preview}
              onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="is_preview" className="text-sm text-gray-400 cursor-pointer">
              Leçon en aperçu (gratuite)
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={isSaving || !formData.title.trim()}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

