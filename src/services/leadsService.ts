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
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  return data || [];
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

