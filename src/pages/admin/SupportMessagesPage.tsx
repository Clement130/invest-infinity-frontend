/**
 * SupportMessagesPage - Gestion des messages de contact et support client
 * 
 * Permet aux admins de :
 * - Voir tous les messages de contact/support
 * - Filtrer par statut (new, read, replied, archived)
 * - Marquer comme lu/répondu
 * - Ajouter des notes internes
 * - Archiver les messages traités
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  MessageSquare,
  Mail,
  Phone,
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  CheckCircle,
  Archive,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Inbox,
  Clock,
  MessageCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  notes: string | null;
  replied_at: string | null;
  replied_by: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

type StatusFilter = 'all' | 'new' | 'read' | 'replied' | 'archived';

// Configuration des statuts
const STATUS_CONFIG: Record<ContactMessage['status'], { label: string; color: string; icon: typeof Inbox }> = {
  new: { label: 'Nouveau', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Inbox },
  read: { label: 'Lu', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Eye },
  replied: { label: 'Répondu', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  archived: { label: 'Archivé', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Archive },
};

// Configuration des sources
const SOURCE_LABELS: Record<string, string> = {
  contact_page: 'Page Contact',
  chatbot_contact: 'Chatbot - Contact',
  chatbot_support: 'Chatbot - Support',
};

export default function SupportMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [stats, setStats] = useState({ new: 0, read: 0, replied: 0, archived: 0, total: 0 });

  // Charger les messages
  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);

      // Calculer les stats
      const allMessages = await supabase.from('contact_messages').select('status');
      if (allMessages.data) {
        const newStats = { new: 0, read: 0, replied: 0, archived: 0, total: allMessages.data.length };
        allMessages.data.forEach((m) => {
          if (m.status in newStats) {
            newStats[m.status as keyof typeof newStats]++;
          }
        });
        setStats(newStats);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Mettre à jour le statut d'un message
  const updateStatus = async (id: string, newStatus: ContactMessage['status']) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'replied') {
        updateData.replied_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contact_messages')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour localement
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: newStatus, ...(newStatus === 'replied' ? { replied_at: new Date().toISOString() } : {}) } : m
        )
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => prev ? { ...prev, status: newStatus } : null);
      }

      // Recharger les stats
      loadMessages();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  // Ajouter une note
  const updateNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, notes } : m))
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => prev ? { ...prev, notes } : null);
      }
    } catch (error) {
      console.error('Erreur mise à jour notes:', error);
    }
  };

  // Filtrer les messages par recherche
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query) ||
      (m.subject && m.subject.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-pink-400" />
            Messages & Support
          </h1>
          <p className="text-gray-400 mt-1">
            Gérer les demandes de contact et tickets de support
          </p>
        </div>
        <button
          onClick={loadMessages}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-gray-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { key: 'total', label: 'Total', icon: MessageCircle, color: 'text-purple-400' },
          { key: 'new', label: 'Nouveaux', icon: Inbox, color: 'text-blue-400' },
          { key: 'read', label: 'Lus', icon: Eye, color: 'text-yellow-400' },
          { key: 'replied', label: 'Répondus', icon: CheckCircle, color: 'text-green-400' },
          { key: 'archived', label: 'Archivés', icon: Archive, color: 'text-gray-400' },
        ].map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3"
          >
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-2xl font-bold text-white">{stats[key as keyof typeof stats]}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
        </div>

        {/* Filtre par statut */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveaux</option>
            <option value="read">Lus</option>
            <option value="replied">Répondus</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Liste */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-3" />
              <p className="text-gray-400">Chargement...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Inbox className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Aucun message trouvé</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const statusConfig = STATUS_CONFIG[msg.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    // Marquer comme lu si nouveau
                    if (msg.status === 'new') {
                      updateStatus(msg.id, 'read');
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedMessage?.id === msg.id
                      ? 'bg-pink-500/10 border-pink-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate">{msg.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{msg.email}</p>
                      {msg.subject && (
                        <p className="text-sm text-pink-400 mt-1 truncate">{msg.subject}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color.split(' ')[1]}`} />
                      <span className="text-xs text-gray-500">
                        {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                      {SOURCE_LABELS[msg.source] || msg.source}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Détail du message sélectionné */}
        <div className="lg:sticky lg:top-6">
          {selectedMessage ? (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white">Détail du message</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-4 space-y-4">
                {/* Infos contact */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedMessage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-pink-400 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Votre message'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto px-3 py-1 bg-pink-500/20 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Répondre
                    </a>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${selectedMessage.phone}`}
                        className="text-gray-300 hover:text-white"
                      >
                        {selectedMessage.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedMessage.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </div>
                </div>

                {/* Sujet */}
                {selectedMessage.subject && (
                  <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                    <p className="text-xs text-pink-400 mb-1">Sujet</p>
                    <p className="text-white font-medium">{selectedMessage.subject}</p>
                  </div>
                )}

                {/* Message */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Message</p>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-gray-300 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Source */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Source:</span>
                  <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                    {SOURCE_LABELS[selectedMessage.source] || selectedMessage.source}
                  </span>
                </div>

                {/* Notes internes */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Notes internes</p>
                  <textarea
                    value={selectedMessage.notes || ''}
                    onChange={(e) => {
                      setSelectedMessage((prev) => prev ? { ...prev, notes: e.target.value } : null);
                    }}
                    onBlur={(e) => updateNotes(selectedMessage.id, e.target.value)}
                    placeholder="Ajouter des notes..."
                    rows={3}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {selectedMessage.status !== 'read' && selectedMessage.status !== 'new' ? null : (
                    <button
                      onClick={() => updateStatus(selectedMessage.id, 'replied')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer répondu
                    </button>
                  )}
                  {selectedMessage.status !== 'archived' && (
                    <button
                      onClick={() => updateStatus(selectedMessage.id, 'archived')}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors text-sm"
                    >
                      <Archive className="w-4 h-4" />
                      Archiver
                    </button>
                  )}
                  {selectedMessage.status === 'archived' && (
                    <button
                      onClick={() => updateStatus(selectedMessage.id, 'new')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      <Inbox className="w-4 h-4" />
                      Restaurer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Sélectionne un message pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

