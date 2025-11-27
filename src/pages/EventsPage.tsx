import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { getUpcomingEvents } from '../services/memberStatsService';
import EventsCalendar from '../components/member/EventsCalendar';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import { Calendar, Clock, Users, Star, Video, Mic, GraduationCap } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function EventsPage() {
  const { user } = useSession();

  const eventsQuery = useQuery({
    queryKey: ['member-events', user?.id],
    queryFn: () => getUpcomingEvents(user?.id || ''),
    enabled: !!user?.id,
  });

  const events = eventsQuery.data || [];
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const registeredEvents = events.filter((e) => e.registered);

  const nextEvent = upcomingEvents[0];
  const getTimeUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
    return 'Bientôt';
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

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Événements</h1>
            <p className="text-gray-400">
              Sessions live, ateliers et masterclass exclusives pour les membres
            </p>
          </div>
        </div>
      </motion.header>

      {eventsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Next Event Banner */}
          {nextEvent && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="purple" className="overflow-hidden">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-500/10 to-transparent" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                  <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-2">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                        {(() => {
                          const Icon = getEventTypeIcon(nextEvent.type);
                          return <Icon className="w-10 h-10 text-white" />;
                        })()}
                      </div>
                      {nextEvent.isExclusive && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                        </div>
                      )}
                    </motion.div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                          Prochain événement
                        </span>
                        <span className="text-sm text-gray-400">
                          Dans {getTimeUntil(nextEvent.date)}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{nextEvent.title}</h2>
                      <p className="text-gray-400">{nextEvent.description}</p>

                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {nextEvent.duration} min
                        </div>
                        {nextEvent.speaker && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {nextEvent.speaker}
                          </div>
                        )}
                      </div>
                    </div>

                    {nextEvent.registrationRequired && !nextEvent.registered && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold shadow-lg shadow-purple-500/25"
                      >
                        S'inscrire
                      </motion.button>
                    )}

                    {nextEvent.registered && (
                      <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium">
                        ✓ Inscrit
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.section>
          )}

          {/* Stats */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={Calendar}
                label="Événements à Venir"
                value={upcomingEvents.length}
                color="purple"
                delay={0}
              />
              <StatCard
                icon={Users}
                label="Inscriptions"
                value={registeredEvents.length}
                color="pink"
                delay={0.1}
              />
              <StatCard
                icon={Clock}
                label="Heures de contenu"
                value={`${Math.round(events.reduce((sum, e) => sum + e.duration, 0) / 60)}h`}
                color="blue"
                delay={0.2}
              />
            </div>
          </motion.section>

          {/* Event Types */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Types d'événements</h3>
                  <p className="text-sm text-gray-400">Découvre les différents formats disponibles</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Sessions Live</h4>
                    <p className="text-sm text-gray-400">
                      Analyse en direct des marchés avec Q&A
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Ateliers</h4>
                    <p className="text-sm text-gray-400">
                      Sessions pratiques sur des thèmes spécifiques
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-300">Masterclass</h4>
                    <p className="text-sm text-yellow-400/70">
                      Contenu premium avec des experts invités
                    </p>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                    ⭐ Exclusif
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.section>

          {/* Events Calendar */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none">
              <EventsCalendar events={upcomingEvents} />
            </GlassCard>
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
