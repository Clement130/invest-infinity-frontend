import { supabase } from '../lib/supabaseClient';

export interface OpenAIResponse {
  message: string;
  usage?: {
    total_tokens: number;
  };
  rateLimit?: {
    remaining: number;
    resetIn: number;
  };
}

export interface ChatContext {
  userId?: string;
  userName?: string;
  progress?: {
    completedModules: number;
    totalModules: number;
    continueLearning?: {
      moduleTitle: string;
      lessonTitle: string;
    };
  };
  challenges?: Array<{
    title: string;
    progress: number;
    target: number;
  }>;
}

/**
 * Appelle l'API OpenAI via l'Edge Function Supabase
 * @param message Le message de l'utilisateur
 * @param context Le contexte utilisateur (optionnel)
 * @returns La réponse de l'IA ou null en cas d'erreur
 */
export async function callOpenAI(
  message: string,
  context?: ChatContext
): Promise<OpenAIResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('chatbot-ai', {
      body: {
        message,
        context,
      },
    });

    if (error) {
      console.error('[openaiService] Error calling OpenAI:', error);
      return null;
    }

    return data as OpenAIResponse;
  } catch (error) {
    console.error('[openaiService] Exception:', error);
    return null;
  }
}

/**
 * Vérifie si l'API OpenAI est disponible
 */
export async function checkOpenAIAvailability(): Promise<boolean> {
  try {
    const response = await callOpenAI('test');
    return response !== null;
  } catch {
    return false;
  }
}

