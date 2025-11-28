import { Calendar, Clock, Users, Star, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Event } from '../../services/memberStatsService';

interface EventsCalendarProps {
  events: Event[];
}

export default function EventsCalendar({ events }: EventsCalendarProps) {
  const queryClient = useQueryClient();
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      // Simuler l'inscription (à remplacer par un vrai appel API)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, eventId };
    },
    onSuccess: (data) => {
      // Mettre à jour le cache pour marquer l'événement comme inscrit
      queryClient.setQueryData(['member-events'], (oldEvents: Event[] | undefined) => {
        if (!oldEvents) return oldEvents;
        return oldEvents.map((event) =>
          event.id === data.eventId ? { ...event, registered: true } : event
        );
      });
      setRegisteringEventId(null);
    },
    onError: () => {
      setRegisteringEventId(null);
    },
  });

  const handleRegister = async (eventId: string) => {
    setRegisteringEventId(eventId);
    registerMutation.mutate(eventId);
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'live':
        return '🔴';
      case 'workshop':
        return '🛠️';
      case 'masterclass':
        return '🎓';
      case 'event':
        return '🎉';
      default:
        return '📅';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Calendrier des événements</h3>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun événement à venir</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`rounded-lg border p-4 space-y-3 ${
                event.isExclusive
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{event.title}</h4>
                      {event.isExclusive && (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.duration} min
                      </div>
                      {event.speaker && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.speaker}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {event.registrationRequired && (
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  {event.registered ? (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Inscrit</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringEventId === event.id}
                      className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed transition text-sm font-medium flex items-center gap-2"
                    >
                      {registeringEventId === event.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Rejoindre...
                        </>
                      ) : (
                        'Rejoindre'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


