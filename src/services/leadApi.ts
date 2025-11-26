import { supabase } from '../lib/supabaseClient';

const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Appelle une Edge Function Supabase
 * @param endpoint - L'endpoint de la fonction (ex: '/register-lead')
 * @param payload - Les données à envoyer
 * @param requiresAuth - Si true, utilise le token de l'utilisateur connecté
 */
async function callFunction<TInput extends Record<string, unknown>, TOutput>(
  endpoint: string,
  payload: TInput,
  requiresAuth: boolean = false,
): Promise<TOutput> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY || '',
  };

  // Si auth requise, utiliser le token de session de l'utilisateur
  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Fallback sur ANON_KEY si pas de session (pour les fonctions publiques)
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY || ''}`;
    }
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY || ''}`;
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erreur serveur');
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return (await response.json()) as TOutput;
  }

  return {} as TOutput;
}

type RegisterLeadPayload = {
  prenom: string;
  email: string;
  telephone: string;
  capital: number;
  statut?: string;
  boardId?: number;
  newsLetter?: boolean;
};

type UpdateCapitalPayload = {
  email: string;
  capital: number;
};

export const leadApi = {
  // registerLead n'a pas besoin d'auth (inscription publique)
  registerLead: (payload: RegisterLeadPayload) =>
    callFunction<RegisterLeadPayload, { success: boolean }>(
      '/register-lead',
      payload,
      false, // Pas d'auth requise pour l'inscription
    ),
  // updateCapital nécessite une authentification
  updateCapital: (payload: UpdateCapitalPayload) =>
    callFunction<UpdateCapitalPayload, { success: boolean }>(
      '/update-capital',
      payload,
      true, // Auth requise - l'utilisateur doit être connecté
    ),
};

