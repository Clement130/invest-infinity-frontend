/**
 * Composants Skeleton Loaders
 * 
 * Fournit des composants de chargement élégants qui reflètent
 * la structure du contenu à venir, améliorant la perception de performance.
 */
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton de base réutilisable
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-white/10 rounded';
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className,
      )}
      style={style}
    />
  );
}

/**
 * Skeleton pour une carte de module
 */
export function ModuleCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 animate-pulse">
      <div className="space-y-2">
        <Skeleton variant="rectangular" height={24} width="70%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="rectangular" height={8} width="100%" />
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={60} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={40} width="100%" />
    </div>
  );
}

/**
 * Skeleton pour le lecteur vidéo
 */
export function VideoPlayerSkeleton() {
  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/50">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <Skeleton variant="text" width={200} className="mx-auto" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour les statistiques
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton variant="rectangular" height={20} width={120} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="rectangular" height={32} width={80} />
      <Skeleton variant="text" width={100} />
    </div>
  );
}

/**
 * Skeleton pour une liste de leçons
 */
export function LessonListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={24} height={24} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="rectangular" height={20} width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
            <Skeleton variant="rectangular" height={24} width={60} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour le dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="rectangular" height={40} width={300} />
        <Skeleton variant="text" width={400} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton variant="rectangular" height={400} />
        </div>
        <div className="space-y-4">
          <Skeleton variant="rectangular" height={400} />
        </div>
      </div>
    </div>
  );
}

