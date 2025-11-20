import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession';
import { getUpcomingEvents } from '../services/memberStatsService';
import EventsCalendar from '../components/member/EventsCalendar';
import { Calendar, Clock, Users } from 'lucide-react';

export default function EventsPage() {
  const { user } = useSession();

  const eventsQuery = useQuery({
    queryKey: ['member-events', user?.id],
    queryFn: () => getUpcomingEvents(user?.id || ''),
    enabled: !!user?.id,
  });

  const events = eventsQuery.data || [];

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date()
  );
  const pastEvents = events.filter((e) => new Date(e.date) < new Date());

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Événements</h1>
        <p className="text-gray-400">
          Sessions live, ateliers et masterclass exclusives pour les membres
        </p>
      </header>

      {eventsQuery.isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-medium text-gray-400">Événements à Venir</h3>
              </div>
              <p className="text-2xl font-bold text-purple-400">{upcomingEvents.length}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-medium text-gray-400">Inscrit</h3>
              </div>
              <p className="text-2xl font-bold text-pink-400">
                {events.filter((e) => e.registered).length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-medium text-gray-400">Total Participations</h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">{pastEvents.length}</p>
            </div>
          </div>

          <EventsCalendar events={upcomingEvents} />
        </>
      )}
    </div>
  );
}


