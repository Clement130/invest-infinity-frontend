import { Target, Trophy, Users, TrendingUp } from 'lucide-react';
import type { Challenge } from '../../services/memberStatsService';

interface ChallengesListProps {
  challenges: Challenge[];
}

export default function ChallengesList({ challenges }: ChallengesListProps) {
  const getChallengeIcon = (type: Challenge['type']) => {
    switch (type) {
      case 'weekly':
        return '📅';
      case 'monthly':
        return '🗓️';
      case 'special':
        return '⭐';
      default:
        return '🎯';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-pink-400" />
        <h3 className="text-lg font-semibold text-white">Défis actifs</h3>
      </div>

      <div className="space-y-3">
        {challenges.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun défi actif pour le moment</p>
        ) : (
          challenges.map((challenge) => {
            const progressPercent = (challenge.progress / challenge.target) * 100;
            const isCompleted = challenge.progress >= challenge.target;

            return (
              <div
                key={challenge.id}
                className={`rounded-lg border p-4 space-y-3 ${
                  isCompleted
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getChallengeIcon(challenge.type)}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{challenge.title}</h4>
                        {isCompleted && (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{challenge.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Progression : {challenge.progress} / {challenge.target}
                    </span>
                    <span className="text-gray-400">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {challenge.participants} participants
                    </div>
                    {challenge.userRank && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Rang #{challenge.userRank}
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-purple-400 font-medium">Récompense : </span>
                    <span className="text-gray-300">{challenge.reward}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


