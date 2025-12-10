const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  pdf_sent?: boolean;
}

export interface NewsletterError {
  error: string;
  details?: unknown;
}

/**
 * S'abonner à la newsletter et recevoir le PDF gratuit
 */
export async function subscribeToNewsletter(
  email: string
): Promise<NewsletterSubscriptionResponse> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration error');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/subscribe-newsletter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error: NewsletterError = data;
    throw new Error(error.error || 'Failed to subscribe to newsletter');
  }

  return data as NewsletterSubscriptionResponse;
}
