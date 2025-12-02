/**
 * Service de gestion du chatbot
 * - Persistance des conversations
 * - Analytics
 * - Gestion des attachements
 */

import { supabase } from '../lib/supabaseClient';
import type { Message, UserType } from '../components/chatbot/types';

// ============================================
// Types
// ============================================

export interface ConversationRecord {
  id: string;
  session_id: string;
  user_id: string | null;
  user_type: UserType;
  started_at: string;
  last_message_at: string;
  message_count: number;
  is_resolved: boolean;
  metadata: Record<string, unknown>;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender: 'user' | 'bot';
  content: string;
  message_type: 'text' | 'quick-reply' | 'card' | 'image' | 'file';
  quick_replies: unknown[] | null;
  feedback: 'positive' | 'negative' | null;
  attachment_url: string | null;
  attachment_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsEvent {
  session_id: string;
  user_id?: string;
  user_type: UserType;
  event_type: 'open' | 'close' | 'message_sent' | 'message_received' | 'quick_reply_click' | 'action_executed' | 'feedback' | 'error' | 'intent_matched' | 'ai_fallback' | 'conversion';
  action?: string;
  intent_id?: string;
  content?: string;
  success?: boolean;
  error_message?: string;
  response_time_ms?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatbotDailyStats {
  date: string;
  total_conversations: number;
  total_messages: number;
  unique_users: number;
  avg_messages_per_conversation: number;
  intent_match_rate: number;
  ai_fallback_rate: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  satisfaction_rate: number;
  error_count: number;
  conversion_count: number;
}

// ============================================
// Session Management
// ============================================

const SESSION_KEY = 'chatbot_session_id';
const CONVERSATION_KEY = 'chatbot_conversation_id';

export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getConversationId(): string | null {
  return sessionStorage.getItem(CONVERSATION_KEY);
}

export function setConversationId(id: string): void {
  sessionStorage.setItem(CONVERSATION_KEY, id);
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(CONVERSATION_KEY);
}

// ============================================
// Conversation Management
// ============================================

/**
 * Crée ou récupère une conversation existante
 */
export async function getOrCreateConversation(
  userId: string | null,
  userType: UserType
): Promise<ConversationRecord | null> {
  const sessionId = getOrCreateSessionId();
  const existingConversationId = getConversationId();

  // Si on a déjà une conversation en session, la récupérer
  if (existingConversationId) {
    const { data: existing } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', existingConversationId)
      .single();

    if (existing) {
      return existing as ConversationRecord;
    }
  }

  // Sinon, créer une nouvelle conversation
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .insert({
      session_id: sessionId,
      user_id: userId,
      user_type: userType,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  setConversationId(data.id);
  return data as ConversationRecord;
}

/**
 * Récupère les messages d'une conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<MessageRecord[]> {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as MessageRecord[];
}

/**
 * Sauvegarde un message
 */
export async function saveMessage(
  conversationId: string,
  message: Message,
  attachmentUrl?: string,
  attachmentType?: string
): Promise<MessageRecord | null> {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .insert({
      conversation_id: conversationId,
      sender: message.sender,
      content: message.content,
      message_type: message.type || 'text',
      quick_replies: message.quickReplies || null,
      feedback: message.feedbackGiven || null,
      attachment_url: attachmentUrl || null,
      attachment_type: attachmentType || null,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return null;
  }

  return data as MessageRecord;
}

/**
 * Met à jour le feedback d'un message
 */
export async function updateMessageFeedback(
  messageId: string,
  feedback: 'positive' | 'negative'
): Promise<boolean> {
  const { error } = await supabase
    .from('chatbot_messages')
    .update({ feedback })
    .eq('id', messageId);

  if (error) {
    console.error('Error updating feedback:', error);
    return false;
  }

  return true;
}

/**
 * Marque une conversation comme résolue
 */
export async function markConversationResolved(
  conversationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('chatbot_conversations')
    .update({ is_resolved: true })
    .eq('id', conversationId);

  if (error) {
    console.error('Error marking conversation resolved:', error);
    return false;
  }

  return true;
}

/**
 * Récupère les conversations d'un utilisateur
 */
export async function getUserConversations(
  userId: string,
  limit = 10
): Promise<ConversationRecord[]> {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user conversations:', error);
    return [];
  }

  return data as ConversationRecord[];
}

// ============================================
// Analytics
// ============================================

/**
 * Enregistre un événement analytics
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await supabase.from('chatbot_analytics').insert({
      session_id: event.session_id,
      user_id: event.user_id || null,
      user_type: event.user_type,
      event_type: event.event_type,
      action: event.action || null,
      intent_id: event.intent_id || null,
      content: event.content?.substring(0, 500) || null,
      success: event.success ?? true,
      error_message: event.error_message || null,
      response_time_ms: event.response_time_ms || null,
      metadata: event.metadata || {},
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
}

/**
 * Récupère les stats quotidiennes (admin)
 */
export async function getDailyStats(
  startDate: string,
  endDate: string
): Promise<ChatbotDailyStats[]> {
  const { data, error } = await supabase
    .from('chatbot_daily_stats')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily stats:', error);
    return [];
  }

  return data as ChatbotDailyStats[];
}

/**
 * Récupère les stats en temps réel (admin)
 */
export async function getRealTimeStats(): Promise<{
  todayConversations: number;
  todayMessages: number;
  activeConversations: number;
  satisfactionRate: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Conversations aujourd'hui
  const { count: todayConversations } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', today);

  // Messages aujourd'hui
  const { count: todayMessages } = await supabase
    .from('chatbot_messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);

  // Conversations actives (dernière heure)
  const { count: activeConversations } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })
    .gte('last_message_at', oneHourAgo)
    .eq('is_resolved', false);

  // Taux de satisfaction
  const { data: feedbackData } = await supabase
    .from('chatbot_messages')
    .select('feedback')
    .gte('created_at', today)
    .not('feedback', 'is', null);

  const positive = feedbackData?.filter(f => f.feedback === 'positive').length || 0;
  const total = feedbackData?.length || 0;
  const satisfactionRate = total > 0 ? (positive / total) * 100 : 0;

  return {
    todayConversations: todayConversations || 0,
    todayMessages: todayMessages || 0,
    activeConversations: activeConversations || 0,
    satisfactionRate: Math.round(satisfactionRate),
  };
}

/**
 * Récupère les top intents (admin)
 */
export async function getTopIntents(
  days = 7,
  limit = 10
): Promise<{ intent_id: string; count: number }[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('chatbot_analytics')
    .select('intent_id')
    .eq('event_type', 'intent_matched')
    .gte('created_at', startDate)
    .not('intent_id', 'is', null);

  if (error || !data) {
    return [];
  }

  // Compter les occurrences
  const counts: Record<string, number> = {};
  data.forEach(row => {
    if (row.intent_id) {
      counts[row.intent_id] = (counts[row.intent_id] || 0) + 1;
    }
  });

  // Trier et limiter
  return Object.entries(counts)
    .map(([intent_id, count]) => ({ intent_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================
// Attachments
// ============================================

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload un fichier attaché
 */
export async function uploadAttachment(
  file: File,
  conversationId: string
): Promise<{ url: string; type: string } | null> {
  // Validation
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP, PDF');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux. Taille max : 5 Mo');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${conversationId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('chatbot-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading attachment:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }

  const { data: urlData } = supabase.storage
    .from('chatbot-attachments')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    type: file.type,
  };
}

// ============================================
// Export Conversation
// ============================================

/**
 * Exporte une conversation en format texte
 */
export function exportConversationAsText(messages: Message[]): string {
  const lines: string[] = [
    '='.repeat(50),
    'Conversation Invest Infinity',
    `Exportée le ${new Date().toLocaleString('fr-FR')}`,
    '='.repeat(50),
    '',
  ];

  messages.forEach(msg => {
    const sender = msg.sender === 'bot' ? '🤖 Assistant' : '👤 Vous';
    const time = msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    lines.push(`[${time}] ${sender}:`);
    lines.push(msg.content);
    lines.push('');
  });

  lines.push('='.repeat(50));
  lines.push('Merci d\'avoir utilisé notre assistant !');
  lines.push('https://www.investinfinity.fr');

  return lines.join('\n');
}

/**
 * Exporte une conversation en JSON
 */
export function exportConversationAsJSON(
  conversation: ConversationRecord,
  messages: Message[]
): string {
  return JSON.stringify({
    conversation: {
      id: conversation.id,
      started_at: conversation.started_at,
      message_count: conversation.message_count,
    },
    messages: messages.map(msg => ({
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      feedback: msg.feedbackGiven,
    })),
    exported_at: new Date().toISOString(),
  }, null, 2);
}

/**
 * Télécharge un fichier texte
 */
export function downloadAsFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

