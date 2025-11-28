import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar, Video, Mic, GraduationCap, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'live' | 'workshop' | 'masterclass' | 'event';
  date: string;
  duration: number;
  speaker: string | null;
  is_exclusive: boolean;
  registration_required: boolean;
  discord_invite_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EventWithRegistrations extends Event {
  registrations_count: number;
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading } = useQuery<EventWithRegistrations[]>({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Récupérer le nombre d'inscriptions pour chaque événement
      const eventsWithRegistrations = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count, error: countError } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          if (countError) {
            console.error('Error counting registrations:', countError);
            return { ...event, registrations_count: 0 };
          }

          return { ...event, registrations_count: count || 0 };
        })
      );

      return eventsWithRegistrations;
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (event: Partial<Event> & { title: string; description: string; date: string }) => {
      if (editingEvent) {
        const { data, error } = await supabase
          .from('events')
          .update(event)
          .eq('id', editingEvent.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(event)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['member-events'] });
      setIsModalOpen(false);
      setEditingEvent(null);
      toast.success(editingEvent ? 'Événement modifié avec succès' : 'Événement créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['member-events'] });
      toast.success('Événement supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteMutation.mutate(id);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'live':
        return Video;
      case 'workshop':
        return Mic;
      case 'masterclass':
        return GraduationCap;
      default:
        return Calendar;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'live':
        return 'Session Live';
      case 'workshop':
        return 'Atelier';
      case 'masterclass':
        return 'Masterclass';
      default:
        return 'Événement';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Événements</h1>
          <p className="text-gray-400">Créez et gérez les événements pour vos clients</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition"
        >
          <Plus className="w-4 h-4" />
          Créer un événement
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des événements...</p>
      ) : (
        <div className="grid gap-4">
          {events.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-white/10 bg-white/5">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucun événement créé</p>
              <p className="text-gray-500 text-sm mt-2">Créez votre premier événement pour commencer</p>
            </div>
          ) : (
            events.map((event) => {
              const Icon = getEventTypeIcon(event.type);
              return (
                <div
                  key={event.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.is_active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {event.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.type === 'live'
                              ? 'bg-red-500/20 text-red-400'
                              : event.type === 'workshop'
                              ? 'bg-blue-500/20 text-blue-400'
                              : event.type === 'masterclass'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {getEventTypeLabel(event.type)}
                        </span>
                        {event.is_exclusive && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                            ⭐ Exclusif
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mb-4">{event.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="text-white">
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durée</p>
                          <p className="text-white">{event.duration} min</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Intervenant</p>
                          <p className="text-white">{event.speaker || 'Non spécifié'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Inscriptions</p>
                          <p className="text-white flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.registrations_count}
                          </p>
                        </div>
                      </div>
                      {event.registration_required && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Inscription requise</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 rounded-full hover:bg-white/10 transition"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 rounded-full hover:bg-white/10 transition"
                        title="Supprimer"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {isModalOpen && (
        <EventModal
          event={editingEvent}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={(event) => createUpdateMutation.mutate(event)}
          isSaving={createUpdateMutation.isPending}
        />
      )}
    </div>
  );
}

function EventModal({
  event,
  onClose,
  onSave,
  isSaving,
}: {
  event: Event | null;
  onClose: () => void;
  onSave: (event: Partial<Event> & { title: string; description: string; date: string }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || ('live' as 'live' | 'workshop' | 'masterclass' | 'event'),
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    duration: event?.duration || 60,
    speaker: event?.speaker || '',
    is_exclusive: event?.is_exclusive ?? false,
    registration_required: event?.registration_required ?? true,
    discord_invite_url: event?.discord_invite_url || '',
    is_active: event?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(event && { id: event.id }),
      ...formData,
      date: new Date(formData.date).toISOString(),
      speaker: formData.speaker || null,
      discord_invite_url: formData.discord_invite_url || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl border border-white/10 my-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          {event ? 'Modifier l\'événement' : 'Créer un événement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Ex: Session Live : Analyse du Marché"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Description de l'événement"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="live">Session Live</option>
                <option value="workshop">Atelier</option>
                <option value="masterclass">Masterclass</option>
                <option value="event">Événement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Durée (minutes) *</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                required
                min="1"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date et heure *</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Intervenant</label>
            <input
              type="text"
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Ex: Mentor Principal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL Discord (optionnel)</label>
            <input
              type="url"
              value={formData.discord_invite_url}
              onChange={(e) => setFormData({ ...formData, discord_invite_url: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="https://discord.gg/..."
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_exclusive"
                checked={formData.is_exclusive}
                onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-700 rounded"
              />
              <label htmlFor="is_exclusive" className="ml-2 block text-sm text-gray-300">
                Exclusif
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="registration_required"
                checked={formData.registration_required}
                onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-700 rounded"
              />
              <label htmlFor="registration_required" className="ml-2 block text-sm text-gray-300">
                Inscription requise
              </label>
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
          </div>
          <div className="flex justify-end gap-3 pt-4">
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

