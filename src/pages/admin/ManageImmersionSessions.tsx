import { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ImmersionSession } from '../../services/immersionSessionsService';
import { supabase } from '../../lib/supabaseClient';

export default function ManageImmersionSessions() {
  const toast = useToast();
  const [sessions, setSessions] = useState<ImmersionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    session_date_start: '',
    session_date_end: '',
    max_places: 8,
    reserved_places: 0,
    location: 'Près de Halo, Marseille',
    price_cents: 199700,
    description: '',
    is_active: true,
  });

  // Charger les sessions
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
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
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('immersion_sessions')
        .insert([formData]);

      if (error) throw error;

      toast.success('Session créée avec succès');
      setShowCreateForm(false);
      resetForm();
      loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('immersion_sessions')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Session mise à jour');
      setEditingId(null);
      resetForm();
      loadSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;

    try {
      const { error } = await supabase
        .from('immersion_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Session supprimée');
      loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEdit = (session: ImmersionSession) => {
    setEditingId(session.id);
    setFormData({
      session_date_start: session.session_date_start,
      session_date_end: session.session_date_end,
      max_places: session.max_places,
      reserved_places: session.reserved_places,
      location: session.location,
      price_cents: session.price_cents,
      description: session.description || '',
      is_active: session.is_active,
    });
  };

  const resetForm = () => {
    setFormData({
      session_date_start: '',
      session_date_end: '',
      max_places: 8,
      reserved_places: 0,
      location: 'Près de Halo, Marseille',
      price_cents: 199700,
      description: '',
      is_active: true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (session: ImmersionSession) => {
    if (session.status === 'full') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Complet</span>;
    }
    if (session.status === 'closed') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Fermé</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ouvert</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions Immersion Élite</h1>
          <p className="text-gray-600 mt-2">Gérer les créneaux et les places disponibles</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Nouvelle session
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-blue-500">
          <h2 className="text-xl font-bold mb-4">Créer une nouvelle session</h2>
          <SessionForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleCreate}
            onCancel={cancelEdit}
          />
        </div>
      )}

      {/* Liste des sessions */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Aucune session créée pour le moment</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Créer la première session
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
              {editingId === session.id ? (
                <SessionForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={() => handleUpdate(session.id)}
                  onCancel={cancelEdit}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {formatDate(session.session_date_start)} - {formatDate(session.session_date_end)}
                      </h3>
                      {getStatusBadge(session)}
                      {!session.is_active && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Désactivé
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users size={18} />
                        <span>
                          {session.reserved_places}/{session.max_places} places réservées
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={18} />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {(session.price_cents / 100).toFixed(0)}€
                        </span>
                      </div>
                    </div>

                    {session.description && (
                      <p className="text-gray-600 mt-2 text-sm">{session.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEdit(session)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Composant de formulaire réutilisable
interface SessionFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

function SessionForm({ formData, setFormData, onSave, onCancel }: SessionFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de début *
        </label>
        <input
          type="date"
          value={formData.session_date_start}
          onChange={(e) => setFormData({ ...formData, session_date_start: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de fin *
        </label>
        <input
          type="date"
          value={formData.session_date_end}
          onChange={(e) => setFormData({ ...formData, session_date_end: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Places maximum *
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={formData.max_places}
          onChange={(e) => setFormData({ ...formData, max_places: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Places réservées
        </label>
        <input
          type="number"
          min="0"
          value={formData.reserved_places}
          onChange={(e) => setFormData({ ...formData, reserved_places: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lieu *
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Près de Halo, Marseille"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prix (€) *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={formData.price_cents / 100}
          onChange={(e) => setFormData({ ...formData, price_cents: parseFloat(e.target.value) * 100 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Session active</span>
        </label>
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Session de mars 2026"
        />
      </div>

      <div className="col-span-2 flex items-center justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <X size={18} />
          Annuler
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Save size={18} />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

