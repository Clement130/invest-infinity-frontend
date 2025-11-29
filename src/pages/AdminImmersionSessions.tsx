import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import { 
  ImmersionSession, 
  formatSessionDates, 
  getAvailablePlaces 
} from '../services/immersionSessionsService';

export default function AdminImmersionSessions() {
  const toast = useToast();
  const [sessions, setSessions] = useState<ImmersionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<ImmersionSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    session_date_start: '',
    session_date_end: '',
    max_places: 8,
    reserved_places: 0,
    location: 'Près de Halo, Marseille',
    description: '',
    is_active: true,
  });

  // Charger les sessions
  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const { data, error } = await supabase
        .from('immersion_sessions')
        .select('*')
        .order('session_date_start', { ascending: true });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setIsCreating(true);
    setFormData({
      session_date_start: '',
      session_date_end: '',
      max_places: 8,
      reserved_places: 0,
      location: 'Près de Halo, Marseille',
      description: '',
      is_active: true,
    });
  }

  function handleEdit(session: ImmersionSession) {
    setEditingSession(session);
    setFormData({
      session_date_start: session.session_date_start,
      session_date_end: session.session_date_end,
      max_places: session.max_places,
      reserved_places: session.reserved_places,
      location: session.location,
      description: session.description || '',
      is_active: session.is_active,
    });
  }

  function handleCancel() {
    setIsCreating(false);
    setEditingSession(null);
  }

  async function handleSave() {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('immersion_sessions')
          .insert(formData);

        if (error) throw error;

        toast.success('Session créée avec succès');
      } else if (editingSession) {
        const { error } = await supabase
          .from('immersion_sessions')
          .update(formData)
          .eq('id', editingSession.id);

        if (error) throw error;

        toast.success('Session mise à jour avec succès');
      }

      setIsCreating(false);
      setEditingSession(null);
      loadSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;

    try {
      const { error } = await supabase
        .from('immersion_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Session supprimée');
      loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-yellow-400" />
            Gestion des Sessions Immersion Élite
          </h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Session
          </button>
        </div>

        {/* Formulaire de création/édition */}
        {(isCreating || editingSession) && (
          <div className="bg-[#1f1f23] border border-yellow-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {isCreating ? 'Créer une nouvelle session' : 'Modifier la session'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.session_date_start}
                  onChange={(e) => setFormData({ ...formData, session_date_start: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.session_date_end}
                  onChange={(e) => setFormData({ ...formData, session_date_end: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Places maximales
                </label>
                <input
                  type="number"
                  value={formData.max_places}
                  onChange={(e) => setFormData({ ...formData, max_places: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Places réservées
                </label>
                <input
                  type="number"
                  value={formData.reserved_places}
                  onChange={(e) => setFormData({ ...formData, reserved_places: parseInt(e.target.value) })}
                  min="0"
                  max={formData.max_places}
                  className="w-full px-4 py-2 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  disabled={isCreating}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0f0f13] border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-yellow-500 bg-[#0f0f13] border-gray-700 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Session active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Save className="w-5 h-5" />
                Enregistrer
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des sessions */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Aucune session créée
            </div>
          ) : (
            sessions.map((session) => {
              const availablePlaces = getAvailablePlaces(session);
              const isFull = session.status === 'full';

              return (
                <div
                  key={session.id}
                  className={`bg-[#1f1f23] border rounded-xl p-6 ${
                    isFull
                      ? 'border-red-500/30'
                      : session.is_active
                      ? 'border-yellow-500/30'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">
                          {formatSessionDates(session.session_date_start, session.session_date_end)}
                        </h3>
                        {isFull && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                            COMPLET
                          </span>
                        )}
                        {!session.is_active && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded">
                            INACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {session.reserved_places}/{session.max_places} élèves
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                      </div>

                      {session.description && (
                        <p className="text-gray-400 text-sm">{session.description}</p>
                      )}

                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isFull ? 'bg-red-500' : 'bg-yellow-500'
                              }`}
                              style={{
                                width: `${(session.reserved_places / session.max_places) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-24">
                            {availablePlaces} {availablePlaces === 1 ? 'place' : 'places'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(session)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

