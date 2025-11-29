import { Brain, Share2, Sparkles, Target } from 'lucide-react';
import type { XpTrackStats, TrackType } from '../../services/memberStatsService';
import clsx from 'clsx';

const TRACK_ICON: Record<TrackType, React.ComponentType<{ className?: string }>> = {
  foundation: Target,
  execution: Sparkles,
  mindset: Brain,
  community: Share2,
};

const TRACK_COLORS: Record<TrackType, string> = {
  foundation: 'from-sky-500 to-blue-500',
  execution: 'from-pink-500 to-purple-500',
  mindset: 'from-amber-400 to-orange-500',
  community: 'from-emerald-400 to-teal-500',
};

interface XpTrackMeterProps {
  tracks: XpTrackStats[];
  compact?: boolean;
}

export default function XpTrackMeter({ tracks, compact = false }: XpTrackMeterProps) {
  if (!tracks.length) {
    return (
      <div className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/5 bg-white/5 text-gray-400 text-xs sm:text-sm">
        Aucune donnée XP disponible pour l'instant.
      </div>
    );
  }

  return (
    // Grille: 1 colonne sur mobile, 2 colonnes sur sm+
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
      {tracks.map((track) => {
        const Icon = TRACK_ICON[track.track];

        return (
          <div
            key={track.track}
            className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-3 sm:p-4"
          >
            <div
              className={clsx(
                'absolute inset-0 opacity-10 blur-3xl bg-gradient-to-br',
                TRACK_COLORS[track.track],
              )}
            />
            <div className="relative space-y-2 sm:space-y-3">
              {/* Header avec icône et infos */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div
                    className={clsx(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-black/30 flex-shrink-0',
                      TRACK_COLORS[track.track],
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide truncate">{track.label}</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-white">Niv. {track.level}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{track.xp.toLocaleString()} XP</p>
              </div>

              {/* Barre de progression */}
              <div className="h-2 sm:h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500', TRACK_COLORS[track.track])}
                  style={{ width: `${track.progress.toFixed(1)}%` }}
                />
              </div>

              {/* Info progression */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
                <span>
                  {Math.round(track.progress)}%
                </span>
                <span className="truncate ml-2">
                  {track.nextLevelXp.toLocaleString()} XP niv. {track.level + 1}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
