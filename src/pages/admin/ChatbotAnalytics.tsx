/**
 * Dashboard Analytics du Chatbot
 * 
 * Affiche les statistiques et métriques du chatbot :
 * - Nombre de conversations
 * - Messages envoyés
 * - Taux de satisfaction
 * - Intents les plus utilisés
 * - Conversations récentes
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Clock,
  Bot,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Types
interface DailyStats {
  date: string;
  total_sessions: number;
  total_messages: number;
  quick_reply_clicks: number;
  positive_feedbacks: number;
  negative_feedbacks: number;
  flows_completed: number;
  ai_fallbacks: number;
  unique_users: number;
}

interface TopIntent {
  intent: string;
  count: number;
  positive_feedback: number;
  negative_feedback: number;
}

interface RecentConversation {
  id: string;
  session_id: string;
  user_role: string;
  status: string;
  started_at: string;
  last_message_at: string;
  message_count?: number;
}

export default function ChatbotAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  
  // Stats
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topIntents, setTopIntents] = useState<TopIntent[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, any[]>>({});

  // Calculs agrégés
  const aggregatedStats = dailyStats.reduce(
    (acc, day) => ({
      totalSessions: acc.totalSessions + day.total_sessions,
      totalMessages: acc.totalMessages + day.total_messages,
      positiveFeedbacks: acc.positiveFeedbacks + day.positive_feedbacks,
      negativeFeedbacks: acc.negativeFeedbacks + day.negative_feedbacks,
      flowsCompleted: acc.flowsCompleted + day.flows_completed,
      aiFallbacks: acc.aiFallbacks + day.ai_fallbacks,
      uniqueUsers: acc.uniqueUsers + day.unique_users,
    }),
    {
      totalSessions: 0,
      totalMessages: 0,
      positiveFeedbacks: 0,
      negativeFeedbacks: 0,
      flowsCompleted: 0,
      aiFallbacks: 0,
      uniqueUsers: 0,
    }
  );

  const satisfactionRate = aggregatedStats.positiveFeedbacks + aggregatedStats.negativeFeedbacks > 0
    ? Math.round((aggregatedStats.positiveFeedbacks / (aggregatedStats.positiveFeedbacks + aggregatedStats.negativeFeedbacks)) * 100)
    : 0;

  const fetchData = async () => {
    try {
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch daily stats
      const { data: statsData, error: statsError } = await supabase
        .from('chatbot_daily_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else {
        setDailyStats(statsData || []);
      }

      // Fetch top intents
      const { data: intentsData, error: intentsError } = await supabase
        .from('chatbot_top_intents')
        .select('*')
        .limit(10);

      if (intentsError) {
        console.error('Error fetching intents:', intentsError);
      } else {
        setTopIntents(intentsData || []);
      }

      // Fetch recent conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
      } else {
        setRecentConversations(conversationsData || []);
      }

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleConversation = async (conversationId: string) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
      return;
    }

    setExpandedConversation(conversationId);

    // Charger les messages si pas déjà fait
    if (!conversationMessages[conversationId]) {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setConversationMessages(prev => ({
          ...prev,
          [conversationId]: data,
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bot className="text-pink-500" />
            Analytics Chatbot
          </h1>
          <p className="text-gray-400 mt-1">Statistiques et performances du chatbot</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="flex bg-[#1a1a1f] rounded-lg border border-pink-500/20 overflow-hidden">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm transition-colors ${
                  dateRange === range
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-[#1a1a1f] border border-pink-500/20 rounded-lg text-gray-400 hover:text-pink-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Conversations"
          value={aggregatedStats.totalSessions}
          color="pink"
        />
        <StatCard
          icon={Users}
          label="Messages"
          value={aggregatedStats.totalMessages}
          color="violet"
        />
        <StatCard
          icon={ThumbsUp}
          label="Satisfaction"
          value={`${satisfactionRate}%`}
          color="green"
          subValue={`${aggregatedStats.positiveFeedbacks} 👍 / ${aggregatedStats.negativeFeedbacks} 👎`}
        />
        <StatCard
          icon={Zap}
          label="Flows complétés"
          value={aggregatedStats.flowsCompleted}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1f] border border-pink-500/20 rounded-xl p-6"
        >
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-pink-400" />
            Activité journalière
          </h3>
          
          <div className="space-y-3">
            {dailyStats.slice(0, 7).map((day, index) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20">
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 h-6 bg-[#2a2a30] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((day.total_messages / Math.max(...dailyStats.map(d => d.total_messages), 1)) * 100, 100)}%` }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">{day.total_messages}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Intents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a1f] border border-pink-500/20 rounded-xl p-6"
        >
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Target size={18} className="text-violet-400" />
            Questions fréquentes
          </h3>
          
          <div className="space-y-3">
            {topIntents.slice(0, 6).map((intent, index) => (
              <div key={intent.intent} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-300">{formatIntentName(intent.intent)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{intent.count} fois</span>
                  {(intent.positive_feedback > 0 || intent.negative_feedback > 0) && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-green-400">{intent.positive_feedback}👍</span>
                      <span className="text-red-400">{intent.negative_feedback}👎</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Conversations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1a1a1f] border border-pink-500/20 rounded-xl p-6"
      >
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Clock size={18} className="text-amber-400" />
          Conversations récentes
        </h3>
        
        <div className="space-y-2">
          {recentConversations.map((conv) => (
            <div key={conv.id} className="border border-pink-500/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleConversation(conv.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-pink-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    conv.user_role === 'admin' ? 'bg-violet-500/20 text-violet-400' :
                    conv.user_role === 'client' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {conv.user_role}
                  </span>
                  <span className="text-sm text-gray-300">
                    {conv.session_id.slice(0, 20)}...
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    conv.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    conv.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {conv.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {new Date(conv.last_message_at).toLocaleString('fr-FR')}
                  </span>
                  {expandedConversation === conv.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* Messages de la conversation */}
              {expandedConversation === conv.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-pink-500/10 p-4 bg-[#0f0f13] max-h-64 overflow-y-auto"
                >
                  {conversationMessages[conv.id] ? (
                    <div className="space-y-2">
                      {conversationMessages[conv.id].map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                            msg.sender === 'user'
                              ? 'bg-pink-500/20 text-pink-100'
                              : 'bg-[#2a2a30] text-gray-300'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}</p>
                            <span className="text-[10px] text-gray-500 mt-1 block">
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Composant StatCard
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'pink' | 'violet' | 'green' | 'amber';
  subValue?: string;
}) {
  const colorClasses = {
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </motion.div>
  );
}

// Helper pour formater les noms d'intents
function formatIntentName(intent: string): string {
  const names: Record<string, string> = {
    offers_overview: 'Tarifs & offres',
    offer_entree_details: 'Détails Starter',
    offer_transformation_details: 'Détails Premium',
    offer_immersion_details: 'Détails Bootcamp',
    guarantee_14_days: 'Garantie 14 jours',
    change_offer: 'Changer d\'offre',
    minimum_capital: 'Capital minimum',
    hardware_requirements: 'Prérequis matériels',
    cancel_subscription: 'Annulation',
    payment_installments: 'Paiement 3x',
    discord_access: 'Accès Discord',
    login_help: 'Aide connexion',
    forgot_password: 'Mot de passe oublié',
    support_contact: 'Contact support',
  };
  return names[intent] || intent.replace(/_/g, ' ');
}

