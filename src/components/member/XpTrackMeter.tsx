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
      <div className="text-center p-6 rounded-2xl border border-white/5 bg-white/5 text-gray-400 text-sm">
        Aucune donnée XP disponible pour l’instant.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'grid gap-4',
        compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2',
      )}
    >
      {tracks.map((track) => {
        const Icon = TRACK_ICON[track.track];

        return (
          <div
            key={track.track}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-4"
          >
            <div
              className={clsx(
                'absolute inset-0 opacity-10 blur-3xl bg-gradient-to-br',
                TRACK_COLORS[track.track],
              )}
            />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-black/30',
                      TRACK_COLORS[track.track],
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">{track.label}</p>
                    <p className="text-lg font-semibold text-white">Niveau {track.level}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">{track.xp.toLocaleString()} XP</p>
              </div>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={clsx('h-full rounded-full bg-gradient-to-r', TRACK_COLORS[track.track])}
                  style={{ width: `${track.progress.toFixed(1)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {Math.round(track.progress)}% – {track.nextLevelXp.toLocaleString()} XP niveau
                  {` ${track.level + 1}`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

