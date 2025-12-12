/**
 * Page Parrainage - Dashboard complet pour les parrains
 * 
 * Affiche :
 * - Code de parrainage + boutons de partage
 * - Solde disponible et en attente
 * - Progression des paliers
 * - Historique des parrainages
 * - Bouton de retrait
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  getReferralStats,
  getReferralHistory,
  getWithdrawalHistory,
  TIER_INFO,
  MINIMUM_WITHDRAWAL,
  type ReferralStats,
  type Referral,
  type WithdrawalRequest,
  type ReferralTier,
} from '../services/referralService';
import GlassCard from '../components/ui/GlassCard';
import ReferralShareCard from '../components/referral/ReferralShareCard';
import ReferralTiers from '../components/referral/ReferralTiers';
import WithdrawalModal from '../components/referral/WithdrawalModal';
import {
  Users,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  ArrowRight,
  RefreshCw,
  Euro,
  History,
  Award,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function ReferralPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { shouldReduceMotion } = useReducedMotion();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'withdrawals'>('overview');

  // Récupérer les stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['referralStats', user?.id],
    queryFn: () => getReferralStats(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Récupérer l'historique des parrainages
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['referralHistory', user?.id],
    queryFn: () => getReferralHistory(user!.id),
    enabled: !!user?.id && activeTab === 'history',
  });

  // Récupérer l'historique des retraits
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawalHistory', user?.id],
    queryFn: () => getWithdrawalHistory(user!.id),
    enabled: !!user?.id && activeTab === 'withdrawals',
  });

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    refetchStats();
    queryClient.invalidateQueries({ queryKey: ['withdrawalHistory'] });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connexion requise</h2>
          <p className="text-gray-400 mb-4">
            Connectez-vous pour accéder à votre espace parrainage.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-medium"
          >
            Se connecter
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-pink-400" />
            Programme de Parrainage
          </h1>
          <p className="text-gray-400 mt-1">
            Parrainez vos amis et gagnez jusqu'à 24% de commission
          </p>
        </div>
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats principales */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Euro className="w-5 h-5" />}
            label="Disponible"
            value={`${stats.availableBalance.toFixed(2)}€`}
            color="green"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="En attente"
            value={`${stats.pendingBalance.toFixed(2)}€`}
            color="yellow"
            tooltip="Validé après 14 jours"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Filleuls"
            value={stats.convertedReferrals.toString()}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total gagné"
            value={`${stats.totalEarned.toFixed(2)}€`}
            color="purple"
          />
        </div>
      ) : null}

      {/* Code de parrainage + Bouton retrait */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Carte de partage */}
        {stats && (
          <ReferralShareCard
            code={stats.referralCode}
            referrerName={profile?.full_name || undefined}
          />
        )}

        {/* Carte retrait */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Retirer mes gains</h3>
              <p className="text-sm text-gray-400">Minimum {MINIMUM_WITHDRAWAL}€</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Solde disponible</span>
              <span className="text-xl font-bold text-green-400">
                {stats?.availableBalance.toFixed(2) || '0.00'}€
              </span>
            </div>

            <button
              onClick={() => setShowWithdrawalModal(true)}
              disabled={!stats || stats.availableBalance < MINIMUM_WITHDRAWAL}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                stats && stats.availableBalance >= MINIMUM_WITHDRAWAL
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/25'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Euro className="w-5 h-5" />
              Demander un retrait
            </button>

            {stats && stats.availableBalance < MINIMUM_WITHDRAWAL && (
              <p className="text-xs text-gray-500 text-center">
                Encore {(MINIMUM_WITHDRAWAL - stats.availableBalance).toFixed(2)}€ avant de pouvoir retirer
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Paliers */}
      {stats && (
        <ReferralTiers
          currentTier={stats.currentTier}
          convertedReferrals={stats.convertedReferrals}
          bonusRate={stats.bonusRate}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Award },
          { id: 'history', label: 'Mes parrainages', icon: Users },
          { id: 'withdrawals', label: 'Mes retraits', icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-pink-500/20 text-pink-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      {shouldReduceMotion ? (
        // Sur mobile, pas d'animation pour éviter les saccades
        <>
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <OverviewContent stats={stats} />
            </div>
          )}
          {activeTab === 'history' && (
            <ReferralHistoryList referrals={referrals || []} isLoading={referralsLoading} />
          )}
          {activeTab === 'withdrawals' && (
            <WithdrawalHistoryList withdrawals={withdrawals || []} isLoading={withdrawalsLoading} />
          )}
        </>
      ) : (
        // Sur desktop, on garde les animations mais simplifiées
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <OverviewContent stats={stats} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ReferralHistoryList referrals={referrals || []} isLoading={referralsLoading} />
            </motion.div>
          )}

          {activeTab === 'withdrawals' && (
            <motion.div
              key="withdrawals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <WithdrawalHistoryList withdrawals={withdrawals || []} isLoading={withdrawalsLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modal de retrait */}
      {showWithdrawalModal && stats && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          availableBalance={stats.availableBalance}
          onSuccess={handleWithdrawalSuccess}
        />
      )}
    </div>
  );
}

// ============================================================================
// Composants internes
// ============================================================================

function OverviewContent({ stats }: { stats?: ReferralStats }) {
  return (
    <>
      {/* Comment ça marche */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-400" />
          Comment ça marche ?
        </h3>
        <div className="space-y-4">
          {[
            { step: 1, text: 'Partagez votre code unique à vos amis' },
            { step: 2, text: 'Ils obtiennent -10% sur leur achat' },
            { step: 3, text: 'Vous gagnez 10% + bonus de commission' },
            { step: 4, text: 'Retirez vos gains dès 50€' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-pink-400">
                {step}
              </div>
              <p className="text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Avantages */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Vos avantages
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-gray-400">Commission de base</span>
            <span className="font-bold text-white">10%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-gray-400">Votre bonus actuel</span>
            <span className="font-bold text-green-400">+{stats?.bonusRate || 0}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg border border-pink-500/30">
            <span className="text-white font-medium">Commission totale</span>
            <span className="font-bold text-pink-400">{10 + (stats?.bonusRate || 0)}%</span>
          </div>
        </div>
      </GlassCard>
    </>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'blue' | 'purple';
  tooltip?: string;
}

function StatCard({ icon, label, value, color, tooltip }: StatCardProps) {
  const colorClasses = {
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  };

  const iconColorClasses = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div
      className={`relative p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm`}
      title={tooltip}
    >
      <div className={`${iconColorClasses[color]} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {tooltip && (
        <div className="absolute top-2 right-2">
          <AlertCircle className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </div>
  );
}

function ReferralHistoryList({
  referrals,
  isLoading,
}: {
  referrals: Referral[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucun parrainage</h3>
        <p className="text-gray-400">
          Partagez votre code pour commencer à parrainer !
        </p>
      </GlassCard>
    );
  }

  const statusConfig = {
    pending: { label: 'En attente', color: 'text-yellow-400', icon: Clock },
    converted: { label: 'Converti', color: 'text-blue-400', icon: CheckCircle },
    validated: { label: 'Validé', color: 'text-green-400', icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'text-red-400', icon: XCircle },
  };

  return (
    <div className="space-y-3">
      {referrals.map((referral) => {
        const config = statusConfig[referral.status];
        const StatusIcon = config.icon;

        return (
          <GlassCard key={referral.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {referral.referredEmail || 'Utilisateur'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {referral.offerPurchased || 'En attente d\'achat'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 ${config.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm">{config.label}</span>
                </div>
                {referral.totalCommission && (
                  <p className="text-lg font-bold text-green-400">
                    +{referral.totalCommission.toFixed(2)}€
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function WithdrawalHistoryList({
  withdrawals,
  isLoading,
}: {
  withdrawals: WithdrawalRequest[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucun retrait</h3>
        <p className="text-gray-400">
          Vos demandes de retrait apparaîtront ici.
        </p>
      </GlassCard>
    );
  }

  const statusConfig = {
    pending: { label: 'En attente', color: 'text-yellow-400 bg-yellow-500/20' },
    processing: { label: 'En cours', color: 'text-blue-400 bg-blue-500/20' },
    completed: { label: 'Payé', color: 'text-green-400 bg-green-500/20' },
    rejected: { label: 'Refusé', color: 'text-red-400 bg-red-500/20' },
  };

  return (
    <div className="space-y-3">
      {withdrawals.map((withdrawal) => {
        const config = statusConfig[withdrawal.status];

        return (
          <GlassCard key={withdrawal.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-lg">
                  {withdrawal.amount.toFixed(2)}€
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(withdrawal.requestedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
                  {config.label}
                </span>
                {withdrawal.processedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Traité le{' '}
                    {new Date(withdrawal.processedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            {withdrawal.adminNote && (
              <p className="mt-2 text-sm text-gray-400 bg-white/5 p-2 rounded">
                Note : {withdrawal.adminNote}
              </p>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

