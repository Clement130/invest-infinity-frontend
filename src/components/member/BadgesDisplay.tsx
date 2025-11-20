import { Award, Sparkles } from 'lucide-react';
import type { Badge } from '../../services/memberStatsService';

interface BadgesDisplayProps {
  badges: Badge[];
}

const rarityColors = {
  common: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function BadgesDisplay({ badges }: BadgesDisplayProps) {
  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const lockedBadges = badges.filter((b) => !b.unlockedAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Badges</h3>
        <span className="text-sm text-gray-400">
          {unlockedBadges.length} / {badges.length} débloqués
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {badges.map((badge) => {
          const isUnlocked = !!badge.unlockedAt;
          const rarityClass = rarityColors[badge.rarity];

          return (
            <div
              key={badge.id}
              className={`rounded-lg border p-4 text-center space-y-2 ${
                isUnlocked ? rarityClass : 'bg-gray-800/50 border-gray-700/50 opacity-50'
              }`}
            >
              <div className="text-3xl">{isUnlocked ? badge.icon : '🔒'}</div>
              <div>
                <h4 className="text-sm font-medium">{badge.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
              </div>
              {isUnlocked && badge.unlockedAt && (
                <p className="text-xs text-gray-500">
                  {new Date(badge.unlockedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


