// Service de logging pour le chatbot InvestInfinity
import type { ChatbotLogEvent, UserType } from './types';

// Générer un ID de session unique
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('chatbot_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('chatbot_session_id', newId);
  return newId;
};

// Stockage local des logs (pour analyse ultérieure)
const LOGS_STORAGE_KEY = 'chatbot_logs';
const MAX_LOGS = 100; // Garder les 100 derniers logs

// Récupérer les logs existants
const getLogs = (): ChatbotLogEvent[] => {
  try {
    const stored = localStorage.getItem(LOGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Sauvegarder les logs
const saveLogs = (logs: ChatbotLogEvent[]): void => {
  try {
    // Garder seulement les MAX_LOGS derniers
    const trimmedLogs = logs.slice(-MAX_LOGS);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch {
    // Ignorer les erreurs de stockage
  }
};

// Logger un événement
export const logChatbotEvent = (
  eventType: ChatbotLogEvent['eventType'],
  userType: UserType,
  options: {
    userId?: string;
    action?: string;
    content?: string;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void => {
  const event: ChatbotLogEvent = {
    timestamp: new Date(),
    sessionId: generateSessionId(),
    userType,
    userId: options.userId,
    eventType,
    action: options.action,
    content: options.content,
    success: options.success ?? true,
    errorMessage: options.errorMessage,
    metadata: options.metadata,
  };

  // Ajouter au stockage local
  const logs = getLogs();
  logs.push(event);
  saveLogs(logs);

  // Log en console en développement
  if (import.meta.env.DEV) {
    console.log('[Chatbot]', eventType, {
      userType,
      action: options.action,
      success: options.success ?? true,
      ...(options.errorMessage && { error: options.errorMessage }),
    });
  }

  // TODO: Envoyer à un service d'analytics (Supabase, Mixpanel, etc.)
  // sendToAnalytics(event);
};

// Logger l'ouverture du chat
export const logChatOpen = (userType: UserType, userId?: string): void => {
  logChatbotEvent('open', userType, { userId });
};

// Logger la fermeture du chat
export const logChatClose = (userType: UserType, userId?: string): void => {
  logChatbotEvent('close', userType, { userId });
};

// Logger un message envoyé par l'utilisateur
export const logMessageSent = (
  userType: UserType,
  content: string,
  userId?: string
): void => {
  logChatbotEvent('message_sent', userType, {
    userId,
    content: content.substring(0, 100), // Limiter la longueur
  });
};

// Logger une réponse du bot
export const logMessageReceived = (
  userType: UserType,
  content: string,
  userId?: string
): void => {
  logChatbotEvent('message_received', userType, {
    userId,
    content: content.substring(0, 100),
  });
};

// Logger un clic sur quick-reply
export const logQuickReplyClick = (
  userType: UserType,
  action: string,
  userId?: string
): void => {
  logChatbotEvent('quick_reply_click', userType, {
    userId,
    action,
  });
};

// Logger une action exécutée
export const logActionExecuted = (
  userType: UserType,
  action: string,
  success: boolean,
  userId?: string,
  errorMessage?: string
): void => {
  logChatbotEvent('action_executed', userType, {
    userId,
    action,
    success,
    errorMessage,
  });
};

// Logger un feedback
export const logFeedback = (
  userType: UserType,
  messageId: string,
  isPositive: boolean,
  userId?: string
): void => {
  logChatbotEvent('feedback', userType, {
    userId,
    action: isPositive ? 'positive' : 'negative',
    metadata: { messageId },
  });
};

// Logger une erreur
export const logError = (
  userType: UserType,
  errorMessage: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logChatbotEvent('error', userType, {
    userId,
    success: false,
    errorMessage,
    metadata,
  });
};

// Exporter les logs (pour admin)
export const exportLogs = (): ChatbotLogEvent[] => {
  return getLogs();
};

// Effacer les logs
export const clearLogs = (): void => {
  localStorage.removeItem(LOGS_STORAGE_KEY);
};

// Obtenir des statistiques simples
export const getLogStats = (): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  feedbackStats: { positive: number; negative: number };
  errorCount: number;
} => {
  const logs = getLogs();
  
  const eventsByType: Record<string, number> = {};
  let positiveCount = 0;
  let negativeCount = 0;
  let errorCount = 0;

  logs.forEach(log => {
    eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
    
    if (log.eventType === 'feedback') {
      if (log.action === 'positive') positiveCount++;
      else negativeCount++;
    }
    
    if (log.eventType === 'error' || !log.success) {
      errorCount++;
    }
  });

  return {
    totalEvents: logs.length,
    eventsByType,
    feedbackStats: { positive: positiveCount, negative: negativeCount },
    errorCount,
  };
};

