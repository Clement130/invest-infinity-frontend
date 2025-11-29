import React from 'react';
import clsx from 'clsx';

export type SkeletonVariant =
  | 'text'
  | 'title'
  | 'avatar'
  | 'card'
  | 'button'
  | 'input'
  | 'image'
  | 'table-row'
  | 'user-card'
  | 'dashboard-card'
  | 'video-card'
  | 'comment';

export type SkeletonContext =
  | 'users'
  | 'posts'
  | 'videos'
  | 'dashboard'
  | 'settings'
  | 'training'
  | 'admin'
  | 'comments'
  | 'generic';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  context?: SkeletonContext;
  count?: number;
  className?: string;
  animate?: boolean;
}

interface SkeletonItemProps {
  className?: string;
  animate?: boolean;
}

const SkeletonItem: React.FC<SkeletonItemProps> = ({ className, animate = true }) => (
  <div
    className={clsx(
      'bg-gray-200 rounded',
      animate && 'animate-pulse',
      className
    )}
  />
);

// Skeleton pour une ligne de texte
const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className
}) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonItem
        key={i}
        className={clsx(
          'h-4',
          i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full' // Dernière ligne plus courte
        )}
      />
    ))}
  </div>
);

// Skeleton pour un titre
const TitleSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <SkeletonItem className={clsx('h-6 w-2/3', className)} />
);

// Skeleton pour un avatar
const AvatarSkeleton: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return <SkeletonItem className={clsx(sizeClasses[size], 'rounded-full', className)} />;
};

// Skeleton pour une carte
const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-white rounded-lg shadow p-4 space-y-3', className)}>
    <TitleSkeleton />
    <TextSkeleton lines={2} />
    <div className="flex space-x-2">
      <SkeletonItem className="h-8 w-16 rounded" />
      <SkeletonItem className="h-8 w-20 rounded" />
    </div>
  </div>
);

// Skeleton pour un utilisateur
const UserCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('flex items-center space-x-3 p-4 bg-white rounded-lg shadow', className)}>
    <AvatarSkeleton size="md" />
    <div className="flex-1 space-y-2">
      <SkeletonItem className="h-4 w-1/3" />
      <SkeletonItem className="h-3 w-1/2" />
    </div>
    <SkeletonItem className="h-8 w-16 rounded" />
  </div>
);

// Skeleton pour une vidéo
const VideoCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-white rounded-lg shadow overflow-hidden', className)}>
    <SkeletonItem className="w-full h-48" />
    <div className="p-4 space-y-3">
      <TitleSkeleton />
      <TextSkeleton lines={2} />
      <div className="flex items-center space-x-2">
        <AvatarSkeleton size="sm" />
        <SkeletonItem className="h-3 w-16" />
      </div>
    </div>
  </div>
);

// Skeleton pour le dashboard
const DashboardCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-white rounded-lg shadow p-6', className)}>
    <div className="flex items-center justify-between mb-4">
      <TitleSkeleton className="w-1/2" />
      <SkeletonItem className="w-6 h-6 rounded" />
    </div>
    <SkeletonItem className="h-12 w-16 mb-4" />
    <TextSkeleton lines={1} className="w-2/3" />
  </div>
);

// Skeleton pour une ligne de tableau
const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({
  columns = 4,
  className
}) => (
  <div className={clsx('flex space-x-4 p-4 border-b border-gray-100', className)}>
    {Array.from({ length: columns }).map((_, i) => (
      <SkeletonItem
        key={i}
        className={clsx(
          'h-4 flex-1',
          i === 0 ? 'w-1/4' : i === columns - 1 ? 'w-1/6' : 'w-1/3'
        )}
      />
    ))}
  </div>
);

// Skeleton pour un commentaire
const CommentSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('flex space-x-3', className)}>
    <AvatarSkeleton size="sm" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center space-x-2">
        <SkeletonItem className="h-3 w-20" />
        <SkeletonItem className="h-3 w-12" />
      </div>
      <TextSkeleton lines={2} />
    </div>
  </div>
);

// Skeleton contextuel intelligent
const ContextualSkeleton: React.FC<{ context: SkeletonContext; count?: number; className?: string }> = ({
  context,
  count = 1,
  className
}) => {
  const renderSkeleton = () => {
    switch (context) {
      case 'users':
        return <UserCardSkeleton />;
      case 'videos':
        return <VideoCardSkeleton />;
      case 'dashboard':
        return <DashboardCardSkeleton />;
      case 'posts':
      case 'comments':
        return <CommentSkeleton />;
      case 'admin':
        return <TableRowSkeleton columns={5} />;
      case 'training':
        return (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <TitleSkeleton />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonItem className="h-20 rounded" />
              <SkeletonItem className="h-20 rounded" />
            </div>
            <TextSkeleton lines={3} />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonItem className="h-4 w-1/3" />
              <SkeletonItem className="h-6 w-12 rounded" />
            </div>
            <SkeletonItem className="h-10 w-full rounded" />
          </div>
        );
      default:
        return <CardSkeleton />;
    }
  };

  if (count === 1) {
    return <div className={className}>{renderSkeleton()}</div>;
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default function SkeletonLoader({
  variant = 'card',
  context,
  count = 1,
  className,
  animate = true
}: SkeletonLoaderProps) {
  // Si un contexte est fourni, utiliser le skeleton contextuel
  if (context) {
    return (
      <ContextualSkeleton
        context={context}
        count={count}
        className={className}
      />
    );
  }

  // Sinon, utiliser les variants individuels
  const renderVariant = () => {
    switch (variant) {
      case 'text':
        return <TextSkeleton className={className} />;
      case 'title':
        return <TitleSkeleton className={className} />;
      case 'avatar':
        return <AvatarSkeleton className={className} />;
      case 'card':
        return <CardSkeleton className={className} />;
      case 'button':
        return <SkeletonItem className={clsx('h-10 w-24 rounded', className)} />;
      case 'input':
        return <SkeletonItem className={clsx('h-10 w-full rounded', className)} />;
      case 'image':
        return <SkeletonItem className={clsx('w-full h-48 rounded', className)} />;
      case 'table-row':
        return <TableRowSkeleton className={className} />;
      case 'user-card':
        return <UserCardSkeleton className={className} />;
      case 'dashboard-card':
        return <DashboardCardSkeleton className={className} />;
      case 'video-card':
        return <VideoCardSkeleton className={className} />;
      case 'comment':
        return <CommentSkeleton className={className} />;
      default:
        return <SkeletonItem className={className} />;
    }
  };

  if (count === 1) {
    return renderVariant();
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderVariant()}</div>
      ))}
    </div>
  );
}

// Hook pour détecter si le contenu met du temps à charger
export function useSkeletonDelay(delay: number = 100) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return showSkeleton;
}
