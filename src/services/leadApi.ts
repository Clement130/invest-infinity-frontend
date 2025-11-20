const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callFunction<TInput extends Record<string, unknown>, TOutput>(
  endpoint: string,
  payload: TInput,
): Promise<TOutput> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`,
    },
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
  registerLead: (payload: RegisterLeadPayload) =>
    callFunction<RegisterLeadPayload, { success: boolean }>(
      '/register-lead',
      payload,
    ),
  updateCapital: (payload: UpdateCapitalPayload) =>
    callFunction<UpdateCapitalPayload, { success: boolean }>(
      '/update-capital',
      payload,
    ),
};

