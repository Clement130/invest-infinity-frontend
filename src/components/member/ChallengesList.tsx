import { useState } from 'react';
import { Target, Trophy, Users, TrendingUp, Plus, CheckCircle, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useSession';
import {
  joinChallenge,
  submitChallengeEntry,
  getUserChallengeSubmissions,
  type ChallengeWithParticipation,
} from '../../services/challengesService';
import type { Challenge } from '../../services/memberStatsService';

interface ChallengesListProps {
  challenges: Challenge[];
}

export default function ChallengesList({ challenges }: ChallengesListProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');

  const joinMutation = useMutation({
    mutationFn: (challengeId: string) => joinChallenge(challengeId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-challenges', user?.id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ challengeId, type, content }: { challengeId: string; type: string; content: string }) => {
      return submitChallengeEntry(challengeId, user?.id || '', type, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-challenges', user?.id] });
      setShowSubmissionModal(false);
      setSubmissionContent('');
      setSelectedChallenge(null);
    },
  });

  const handleJoinChallenge = (challengeId: string) => {
    if (!user?.id) return;
    joinMutation.mutate(challengeId);
  };

  const handleSubmitEntry = (challengeId: string, submissionType: string) => {
    if (!user?.id || !submissionContent.trim()) return;
    submitMutation.mutate({ challengeId, type: submissionType, content: submissionContent });
  };

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

  const getSubmissionType = (challenge: Challenge): string => {
    // Déterminer le type de soumission basé sur le titre/description
    if (challenge.title.toLowerCase().includes('analyse')) {
      return 'analysis';
    }
    if (challenge.title.toLowerCase().includes('risk') || challenge.title.toLowerCase().includes('gestion')) {
      return 'risk_management';
    }
    return 'general';
  };

  return (
    <>
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
              const hasParticipation = challenge.progress > 0;
              const challengeWithParticipation = challenge as ChallengeWithParticipation;

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
                          {isCompleted && <Trophy className="w-4 h-4 text-yellow-400" />}
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    {!hasParticipation && !isCompleted ? (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        disabled={joinMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed transition text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        {joinMutation.isPending ? 'Rejoindre...' : 'Rejoindre le défi'}
                      </button>
                    ) : !isCompleted ? (
                      <button
                        onClick={() => {
                          setSelectedChallenge(challenge.id);
                          setShowSubmissionModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 transition text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Ajouter une contribution
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Défi complété !</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de soumission */}
      {showSubmissionModal && selectedChallenge && (
        <SubmissionModal
          challenge={challenges.find((c) => c.id === selectedChallenge)!}
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedChallenge(null);
            setSubmissionContent('');
          }}
          onSubmit={(content) => {
            const challenge = challenges.find((c) => c.id === selectedChallenge)!;
            handleSubmitEntry(selectedChallenge, getSubmissionType(challenge));
          }}
          content={submissionContent}
          onContentChange={setSubmissionContent}
          isSubmitting={submitMutation.isPending}
        />
      )}
    </>
  );
}

function SubmissionModal({
  challenge,
  onClose,
  onSubmit,
  content,
  onContentChange,
  isSubmitting,
}: {
  challenge: Challenge;
  onClose: () => void;
  onSubmit: (content: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
        <p className="text-gray-400 text-sm mb-6">{challenge.description}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {challenge.title.toLowerCase().includes('analyse')
                ? 'Partage ton analyse de trading'
                : 'Décris ta contribution'}
            </label>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={
                challenge.title.toLowerCase().includes('analyse')
                  ? 'Décris ton analyse, les points clés, les niveaux à surveiller...'
                  : 'Décris comment tu as appliqué cette règle...'
              }
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-gray-300 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onSubmit(content)}
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:bg-pink-500/50 disabled:cursor-not-allowed transition text-white font-medium"
            >
              {isSubmitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
