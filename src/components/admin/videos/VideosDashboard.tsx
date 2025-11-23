import { BookOpen, Folder, Video, CheckCircle2, AlertCircle, XCircle, Plus, Upload, Target, HelpCircle } from 'lucide-react';
import { HealthScore } from './StatusIndicators';
import type { FormationHierarchy } from '../../hooks/admin/useFormationsHierarchy';

interface VideosDashboardProps {
  hierarchy: FormationHierarchy;
  orphanVideosCount: number;
  isLoading?: boolean;
  onNewFormation?: () => void;
  onUpload?: () => void;
  onAssignOrphans?: () => void;
  onShowTutorial?: () => void;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-white/10 rounded" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-20 mb-2" />
          <div className="h-8 bg-white/10 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-white/10 rounded w-24" />
    </div>
  );
}

export function VideosDashboard({
  hierarchy,
  orphanVideosCount,
  isLoading = false,
  onNewFormation,
  onUpload,
  onAssignOrphans,
  onShowTutorial,
}: VideosDashboardProps) {
  const { modules, totalLessons, totalVideos, completionRate } = hierarchy;
  const missingVideos = totalLessons - totalVideos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            📹 GESTION VIDÉOS - VUE D'ENSEMBLE
          </h1>
          <HealthScore score={completionRate} />
        </div>
        {onShowTutorial && (
          <button
            onClick={onShowTutorial}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition text-sm font-medium"
            title="Voir le tutoriel d'assignation de vidéos"
          >
            <HelpCircle className="w-4 h-4" />
            Tutoriel
          </button>
        )}
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-sm text-gray-400">Formations</div>
                  <div className="text-2xl font-bold text-white">{modules.length}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {modules.length} module{modules.length > 1 ? 's' : ''} actif{modules.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Folder className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="text-sm text-gray-400">Modules</div>
                  <div className="text-2xl font-bold text-white">{modules.length}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {totalLessons} leçon{totalLessons > 1 ? 's' : ''} au total
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-pink-400" />
                <div>
                  <div className="text-sm text-gray-400">Leçons</div>
                  <div className="text-2xl font-bold text-white">{totalLessons}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {totalVideos} vidéo{totalVideos > 1 ? 's' : ''} assignée{totalVideos > 1 ? 's' : ''}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Statistiques détaillées */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-green-300">
                {totalVideos} vidéos assignées
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {completionRate}% de complétion
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                {missingVideos} manquante{missingVideos > 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Leçons sans vidéo
            </div>
          </div>
        </div>
      )}

      {/* Alertes */}
      {orphanVideosCount > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-sm font-semibold text-red-300">
                  {orphanVideosCount} vidéo{orphanVideosCount > 1 ? 's' : ''} orpheline{orphanVideosCount > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-400">
                  Vidéos non assignées à une leçon
                </div>
              </div>
            </div>
            {onAssignOrphans && (
              <button
                onClick={onAssignOrphans}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition text-sm font-medium flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Assigner
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-3">
        {onNewFormation && (
          <button
            onClick={onNewFormation}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Formation
          </button>
        )}
        {onUpload && (
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>
        )}
        {onAssignOrphans && orphanVideosCount > 0 && (
          <button
            onClick={onAssignOrphans}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 font-semibold hover:bg-purple-500/20 transition"
          >
            <Target className="w-5 h-5" />
            Assigner orphelines
          </button>
        )}
      </div>
    </div>
  );
}

