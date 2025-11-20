import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar, Target } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  start_date: string;
  end_date: string;
  target_value: number;
  reward_description: string;
  reward_xp: number;
  reward_badge_id: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ['admin', 'challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (challenge: Partial<Challenge> & { title: string; description: string }) => {
      if (editingChallenge) {
        const { data, error } = await supabase
          .from('challenges')
          .update(challenge)
          .eq('id', editingChallenge.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('challenges')
          .insert(challenge)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'challenges'] });
      setIsModalOpen(false);
      setEditingChallenge(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'challenges'] });
    },
  });

  const handleAdd = () => {
    setEditingChallenge(null);
    setIsModalOpen(true);
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce défi ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Défis</h1>
          <p className="text-gray-400">Créez et gérez les défis pour vos clients</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition"
        >
          <Plus className="w-4 h-4" />
          Créer un défi
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des défis...</p>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">{challenge.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        challenge.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {challenge.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        challenge.type === 'weekly'
                          ? 'bg-blue-500/20 text-blue-400'
                          : challenge.type === 'monthly'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {challenge.type === 'weekly' ? 'Hebdomadaire' : challenge.type === 'monthly' ? 'Mensuel' : 'Spécial'}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4">{challenge.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date de début</p>
                      <p className="text-white">
                        {new Date(challenge.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date de fin</p>
                      <p className="text-white">
                        {new Date(challenge.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Objectif</p>
                      <p className="text-white">{challenge.target_value}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Récompense</p>
                      <p className="text-white">{challenge.reward_description || `+${challenge.reward_xp} XP`}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(challenge)}
                    className="p-2 rounded-full hover:bg-white/10 transition"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(challenge.id)}
                    className="p-2 rounded-full hover:bg-white/10 transition"
                    title="Supprimer"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ChallengeModal
          challenge={editingChallenge}
          onClose={() => {
            setIsModalOpen(false);
            setEditingChallenge(null);
          }}
          onSave={(challenge) => createUpdateMutation.mutate(challenge)}
          isSaving={createUpdateMutation.isPending}
        />
      )}
    </div>
  );
}

function ChallengeModal({
  challenge,
  onClose,
  onSave,
  isSaving,
}: {
  challenge: Challenge | null;
  onClose: () => void;
  onSave: (challenge: Partial<Challenge> & { title: string; description: string }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: challenge?.title || '',
    description: challenge?.description || '',
    type: challenge?.type || ('weekly' as 'weekly' | 'monthly' | 'special'),
    start_date: challenge?.start_date ? challenge.start_date.split('T')[0] : '',
    end_date: challenge?.end_date ? challenge.end_date.split('T')[0] : '',
    target_value: challenge?.target_value || 1,
    reward_description: challenge?.reward_description || '',
    reward_xp: challenge?.reward_xp || 0,
    reward_badge_id: challenge?.reward_badge_id || '',
    is_active: challenge?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(challenge && { id: challenge.id }),
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      reward_badge_id: formData.reward_badge_id || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">
          {challenge ? 'Modifier le défi' : 'Créer un défi'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titre</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="special">Spécial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Objectif</label>
              <input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
                required
                min="1"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date de début</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date de fin</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Récompense (description)</label>
              <input
                type="text"
                value={formData.reward_description}
                onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                placeholder="Ex: Badge exclusif + 100 XP"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">XP</label>
              <input
                type="number"
                value={formData.reward_xp}
                onChange={(e) => setFormData({ ...formData, reward_xp: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Badge ID (optionnel)</label>
            <input
              type="text"
              value={formData.reward_badge_id}
              onChange={(e) => setFormData({ ...formData, reward_badge_id: e.target.value })}
              placeholder="challenge-weekly-winner"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-700 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-300">
              Actif
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-white font-medium disabled:opacity-50"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

