import { useState, useEffect } from 'react';
import { X, Save, Zap, Star, Crown } from 'lucide-react';
import type { TrainingModule } from '../../../types/training';

type LicenseType = 'starter' | 'pro' | 'elite';

const LICENSE_OPTIONS: { value: LicenseType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'starter', label: 'Starter (97€)', icon: <Zap className="w-4 h-4" />, color: 'text-pink-400' },
  { value: 'pro', label: 'Pro (347€)', icon: <Star className="w-4 h-4" />, color: 'text-blue-400' },
  { value: 'elite', label: 'Elite (497€)', icon: <Crown className="w-4 h-4" />, color: 'text-yellow-400' },
];

interface ModuleModalProps {
  module: TrainingModule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<TrainingModule> & { title: string }) => Promise<void>;
  isSaving?: boolean;
}

export function ModuleModal({
  module,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: ModuleModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: 0,
    is_active: true,
    required_license: 'starter' as LicenseType,
  });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || '',
        position: module.position || 0,
        is_active: module.is_active ?? true,
        required_license: (module.required_license as LicenseType) || 'starter',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        position: 0,
        is_active: true,
        required_license: 'starter',
      });
    }
  }, [module, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return;
    }
    await onSave({
      ...(module ? { id: module.id } : {}),
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            {module ? 'Modifier le module' : 'Nouveau module'}
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
              placeholder="Ex: Étape 1 - La Fondation"
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
              placeholder="Description du module..."
            />
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Licence requise <span className="text-xs text-gray-500">(niveau minimum pour accéder)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LICENSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, required_license: option.value })}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${
                    formData.required_license === option.value
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-black/20 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <span className={option.color}>{option.icon}</span>
                  <span className="text-sm">{option.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {formData.required_license === 'starter' && '✓ Accessible à tous les clients (Starter, Pro, Elite)'}
              {formData.required_license === 'pro' && '✓ Accessible aux clients Pro et Elite uniquement'}
              {formData.required_license === 'elite' && '✓ Accessible aux clients Elite uniquement'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-400 cursor-pointer">
              Module actif
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

