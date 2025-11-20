import { ExternalLink, TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TrackRecordData {
  myfxbookUrl?: string;
  fxblueUrl?: string;
  totalReturn: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  lastUpdated: string;
  monthlyStats: MonthlyStat[];
}

interface MonthlyStat {
  month: string;
  return: number;
  trades: number;
  winRate: number;
}

// Mock data - À remplacer par de vraies données depuis Supabase ou API externe
const mockTrackRecord: TrackRecordData = {
  myfxbookUrl: 'https://www.myfxbook.com/members/example',
  fxblueUrl: 'https://www.fxblue.com/users/example',
  totalReturn: 45.8,
  winRate: 68.5,
  profitFactor: 2.3,
  sharpeRatio: 1.8,
  maxDrawdown: -12.4,
  totalTrades: 342,
  winningTrades: 234,
  losingTrades: 108,
  averageWin: 2.8,
  averageLoss: -1.2,
  lastUpdated: new Date().toISOString(),
  monthlyStats: [
    { month: 'Jan 2024', return: 8.2, trades: 28, winRate: 71.4 },
    { month: 'Fév 2024', return: 6.5, trades: 32, winRate: 68.8 },
    { month: 'Mar 2024', return: 9.1, trades: 35, winRate: 74.3 },
    { month: 'Avr 2024', return: 7.3, trades: 30, winRate: 70.0 },
    { month: 'Mai 2024', return: 5.9, trades: 27, winRate: 66.7 },
    { month: 'Juin 2024', return: 8.7, trades: 33, winRate: 72.7 },
  ],
};

export default function TrackRecord() {
  const { data: trackRecord = mockTrackRecord, isLoading } = useQuery({
    queryKey: ['track-record'],
    queryFn: async () => {
      // TODO: Récupérer depuis Supabase ou API
      return mockTrackRecord;
    },
  });

  return (
    <div className="space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Track Record Public</h1>
              <p className="text-gray-400 mt-2">
                Performance vérifiée et auditable - Transparence totale
              </p>
            </div>
            <div className="flex items-center gap-3">
              {trackRecord.myfxbookUrl && (
                <a
                  href={trackRecord.myfxbookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  MyFxBook
                </a>
              )}
              {trackRecord.fxblueUrl && (
                <a
                  href={trackRecord.fxblueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  FX Blue
                </a>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Dernière mise à jour : {new Date(trackRecord.lastUpdated).toLocaleDateString('fr-FR')}
          </div>
        </header>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Rendement Total"
                value={`${trackRecord.totalReturn > 0 ? '+' : ''}${trackRecord.totalReturn.toFixed(2)}%`}
                trend={trackRecord.totalReturn > 0 ? 'up' : 'down'}
                icon={BarChart3}
              />
              <MetricCard
                label="Taux de Réussite"
                value={`${trackRecord.winRate.toFixed(1)}%`}
                trend="up"
                icon={TrendingUp}
              />
              <MetricCard
                label="Profit Factor"
                value={trackRecord.profitFactor.toFixed(2)}
                trend="up"
                icon={TrendingUp}
              />
              <MetricCard
                label="Sharpe Ratio"
                value={trackRecord.sharpeRatio.toFixed(2)}
                trend="up"
                icon={TrendingUp}
              />
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Statistiques Générales</h3>
                <div className="space-y-3">
                  <StatRow label="Total Trades" value={trackRecord.totalTrades} />
                  <StatRow
                    label="Trades Gagnants"
                    value={trackRecord.winningTrades}
                    color="green"
                  />
                  <StatRow
                    label="Trades Perdants"
                    value={trackRecord.losingTrades}
                    color="red"
                  />
                  <StatRow
                    label="Gain Moyen"
                    value={`+${trackRecord.averageWin.toFixed(2)}%`}
                    color="green"
                  />
                  <StatRow
                    label="Perte Moyenne"
                    value={`${trackRecord.averageLoss.toFixed(2)}%`}
                    color="red"
                  />
                  <StatRow
                    label="Drawdown Max"
                    value={`${trackRecord.maxDrawdown.toFixed(2)}%`}
                    color="red"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Performance Mensuelle</h3>
                <div className="space-y-3">
                  {trackRecord.monthlyStats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{stat.month}</p>
                        <p className="text-xs text-gray-400">
                          {stat.trades} trades • {stat.winRate.toFixed(1)}% win rate
                        </p>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          stat.return > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {stat.return > 0 ? '+' : ''}
                        {stat.return.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-200">
                <strong>Disclaimer :</strong> Les performances passées ne préjugent pas des
                résultats futurs. Le trading comporte des risques de perte en capital. Ce track
                record est fourni à titre informatif uniquement.
              </p>
            </div>
          </>
        )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
      <div className="flex items-center gap-2">
        <Icon
          className={`w-5 h-5 ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}
        />
        <h3 className="text-sm font-medium text-gray-400">{label}</h3>
      </div>
      <p
        className={`text-2xl font-bold ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: 'green' | 'red';
}) {
  const colorClass =
    color === 'green'
      ? 'text-green-400'
      : color === 'red'
      ? 'text-red-400'
      : 'text-white';

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

