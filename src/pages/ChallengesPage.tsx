import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession';
import { getActiveChallenges } from '../services/memberStatsService';
import ChallengesList from '../components/member/ChallengesList';
import { Target, Trophy, TrendingUp } from 'lucide-react';

export default function ChallengesPage() {
  const { user } = useSession();

  const challengesQuery = useQuery({
    queryKey: ['member-challenges', user?.id],
    queryFn: () => getActiveChallenges(user?.id || ''),
    enabled: !!user?.id,
  });

  const challenges = challengesQuery.data || [];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Défis</h1>
        <p className="text-gray-400">
          Relevez des défis et montez dans le classement pour gagner des récompenses
        </p>
      </header>

      {challengesQuery.isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-medium text-gray-400">Défis Actifs</h3>
              </div>
              <p className="text-2xl font-bold text-pink-400">{challenges.length}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-medium text-gray-400">Défis Complétés</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {challenges.filter((c) => c.progress >= c.target).length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-medium text-gray-400">Meilleur Rang</h3>
              </div>
              <p className="text-2xl font-bold text-green-400">
                #
                {Math.min(
                  ...challenges
                    .filter((c) => c.userRank)
                    .map((c) => c.userRank || 999)
                ) || '-'}
              </p>
            </div>
          </div>

          <ChallengesList challenges={challenges} />
        </>
      )}
    </div>
  );
}


