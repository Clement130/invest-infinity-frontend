/**
 * Service de persistance des conversations du chatbot
 * 
 * Gère :
 * - Sauvegarde/chargement des conversations dans Supabase
 * - Gestion du session ID local
 * - Analytics et événements
 */

import { supabase } from '../lib/supabaseClient';
import type { Message } from '../components/chatbot/types';

// Types pour la persistance
export interface ChatConversation {
  id: string;
  user_id: string | null;
  session_id: string;
  user_role: 'prospect' | 'client' | 'admin';
  status: 'active' | 'closed' | 'archived';
  metadata: Record<string, unknown>;
  started_at: string;
  last_message_at: string;
  closed_at: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'bot' | 'system';
  content: string;
  message_type: 'text' | 'quick_reply' | 'attachment' | 'flow_step';
  intent_matched: string | null;
  ai_generated: boolean;
  attachments: Array<{ url: string; type: string; name: string }>;
  metadata: Record<string, unknown>;
  feedback: 'positive' | 'negative' | null;
  created_at: string;
}

export type AnalyticsEventType = 
  | 'chat_open' 
  | 'chat_close' 
  | 'message_sent' 
  | 'quick_reply_click'
  | 'action_executed' 
  | 'feedback_given' 
  | 'flow_started' 
  | 'flow_completed'
  | 'flow_abandoned' 
  | 'intent_matched' 
  | 'ai_fallback' 
  | 'error';

// Générer ou récupérer le session ID
export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'chatbot_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

// Réinitialiser le session ID (nouvelle conversation)
export function resetSessionId(): string {
  const STORAGE_KEY = 'chatbot_session_id';
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(STORAGE_KEY, sessionId);
  return sessionId;
}

// Créer une nouvelle conversation
export async function createConversation(
  sessionId: string,
  userId: string | null,
  userRole: 'prospect' | 'client' | 'admin'
): Promise<ChatConversation | null> {
  try {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_role: userRole,
        status: 'active',
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error creating conversation:', err);
    return null;
  }
}

// Récupérer la conversation active
export async function getActiveConversation(
  sessionId: string
): Promise<ChatConversation | null> {
  try {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('Error fetching conversation:', err);
    return null;
  }
}

// Récupérer les messages d'une conversation
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

// Sauvegarder un message
export async function saveMessage(
  conversationId: string,
  message: Partial<ChatMessage>
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        sender: message.sender,
        content: message.content,
        message_type: message.message_type || 'text',
        intent_matched: message.intent_matched || null,
        ai_generated: message.ai_generated || false,
        attachments: message.attachments || [],
        metadata: message.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }

    // Mettre à jour last_message_at de la conversation
    await supabase
      .from('chatbot_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (err) {
    console.error('Error saving message:', err);
    return null;
  }
}

// Mettre à jour le feedback d'un message
export async function updateMessageFeedback(
  messageId: string,
  feedback: 'positive' | 'negative'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chatbot_messages')
      .update({ feedback })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating feedback:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error updating feedback:', err);
    return false;
  }
}

// Fermer une conversation
export async function closeConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chatbot_conversations')
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error closing conversation:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error closing conversation:', err);
    return false;
  }
}

// Logger un événement analytics
export async function logAnalyticsEvent(
  eventType: AnalyticsEventType,
  eventData: Record<string, unknown> = {},
  options: {
    conversationId?: string;
    userId?: string | null;
    sessionId?: string;
    userRole?: string;
  } = {}
): Promise<void> {
  try {
    await supabase.from('chatbot_analytics').insert({
      conversation_id: options.conversationId || null,
      user_id: options.userId || null,
      session_id: options.sessionId || getOrCreateSessionId(),
      event_type: eventType,
      event_data: eventData,
      user_role: options.userRole || 'prospect',
    });
  } catch (err) {
    console.error('Error logging analytics:', err);
  }
}

// Convertir les messages DB en messages frontend
export function dbMessagesToFrontend(dbMessages: ChatMessage[]): Message[] {
  return dbMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender as 'user' | 'bot',
    timestamp: new Date(msg.created_at),
    quickReplies: undefined, // Les quick replies ne sont pas persistés
    showFeedback: msg.sender === 'bot',
    feedbackGiven: msg.feedback,
    attachments: msg.attachments?.length > 0 ? msg.attachments : undefined,
  }));
}

// Convertir un message frontend en message DB
export function frontendMessageToDb(
  message: Message,
  conversationId: string,
  options: {
    intentMatched?: string;
    aiGenerated?: boolean;
    messageType?: 'text' | 'quick_reply' | 'attachment' | 'flow_step';
  } = {}
): Partial<ChatMessage> {
  return {
    conversation_id: conversationId,
    sender: message.sender,
    content: message.content,
    message_type: options.messageType || 'text',
    intent_matched: options.intentMatched || null,
    ai_generated: options.aiGenerated || false,
    attachments: message.attachments || [],
    metadata: {},
  };
}

// Exporter la conversation en texte
export function exportConversationAsText(messages: Message[]): string {
  const header = `=== Conversation Invest Infinity ===\nExportée le ${new Date().toLocaleString('fr-FR')}\n\n`;
  
  const body = messages.map(msg => {
    const time = msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const sender = msg.sender === 'bot' ? '🤖 Assistant' : '👤 Vous';
    return `[${time}] ${sender}:\n${msg.content}\n`;
  }).join('\n');

  return header + body;
}

// Exporter la conversation en JSON
export function exportConversationAsJson(messages: Message[]): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    platform: 'Invest Infinity',
    messages: messages.map(msg => ({
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      feedback: msg.feedbackGiven,
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Copier du texte dans le presse-papiers
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    // Fallback pour les navigateurs plus anciens
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
      return false;
    }
  }
}

