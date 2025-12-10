import { supabase } from '../lib/supabaseClient';

export type Lead = {
  id: string;
  email: string;
  prenom: string | null;
  telephone: string | null;
  capital: number | null;
  statut: string;
  board_id: number | null;
  newsletter: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function listLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[leadsService] Erreur lors de la récupération des leads:', error);
      
      // Si c'est une erreur RLS, on retourne un tableau vide au lieu de throw
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.warn('[leadsService] Erreur RLS détectée, retour d\'un tableau vide');
        return [];
      }
      
      throw error;
    }

    return data || [];
  } catch (err: any) {
    console.error('[leadsService] Exception dans listLeads:', err);
    // Retourner un tableau vide au lieu de throw pour éviter de bloquer l'interface
    // Les erreurs sont déjà loggées pour le débogage
    return [];
  }
}

export async function getLeadByEmail(email: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching lead:', error);
    throw error;
  }

  return data;
}

export async function updateLeadStatus(
  email: string,
  statut: string,
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ statut })
    .eq('email', email.toLowerCase());

  if (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
}

export type ConvertLeadResponse = {
  success: boolean;
  userId: string;
  email: string;
  isNewUser: boolean;
  message: string;
};

export async function convertLeadToUser(email: string): Promise<ConvertLeadResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Vous devez être connecté pour convertir un lead');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/convert-lead-to-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

