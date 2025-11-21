import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">
        {Icon ? (
          <Icon className="w-16 h-16 text-gray-500" />
        ) : emoji ? (
          <span className="text-6xl">{emoji}</span>
        ) : null}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-xl bg-pink-500/80 hover:bg-pink-500 text-white font-medium transition"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}

