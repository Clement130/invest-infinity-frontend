import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const statusStyles = {
    success: 'bg-green-500/20 text-green-400 border-green-500/40',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    error: 'bg-red-500/20 text-red-400 border-red-500/40',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  };

  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
    info: Info,
    neutral: Info,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses[size]} ${statusStyles[status]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

interface StatusIndicatorProps {
  hasVideo: boolean;
  isPublished: boolean;
  isComplete?: boolean;
}

export function LessonStatusIndicator({
  hasVideo,
  isPublished,
  isComplete = false,
}: StatusIndicatorProps) {
  if (!hasVideo) {
    return <StatusBadge status="warning" label="Vidéo manquante" size="sm" />;
  }

  if (isPublished && isComplete) {
    return <StatusBadge status="success" label="Complet" size="sm" />;
  }

  if (isPublished) {
    return <StatusBadge status="info" label="Publié" size="sm" />;
  }

  return <StatusBadge status="neutral" label="Brouillon" size="sm" />;
}

interface HealthScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthScore({ score, size = 'md' }: HealthScoreProps) {
  const getStatus = (s: number): StatusType => {
    if (s >= 90) return 'success';
    if (s >= 70) return 'info';
    if (s >= 50) return 'warning';
    return 'error';
  };

  const getEmoji = (s: number) => {
    if (s >= 90) return '🟢';
    if (s >= 70) return '🟡';
    if (s >= 50) return '🟠';
    return '🔴';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{getEmoji(score)}</span>
      <div>
        <div className="text-sm text-gray-400">Santé du contenu</div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">{score}%</span>
          <StatusBadge status={getStatus(score)} label={getStatus(score) === 'success' ? 'Excellent' : getStatus(score) === 'info' ? 'Bon' : getStatus(score) === 'warning' ? 'Moyen' : 'Faible'} size="sm" />
        </div>
      </div>
    </div>
  );
}

