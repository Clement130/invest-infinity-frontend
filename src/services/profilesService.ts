import { supabase } from '../lib/supabaseClient';
import type { Tables } from '../types/supabase';

export type Profile = Tables<'profiles'>;

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data ?? null;
}

export async function listProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[profilesService] Erreur lors de la récupération des profils:', error);
      
      // Si c'est une erreur RLS, on retourne un tableau vide au lieu de throw
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.warn('[profilesService] Erreur RLS détectée, retour d\'un tableau vide');
        return [];
      }
      
      throw error;
    }

    return data ?? [];
  } catch (err: any) {
    console.error('[profilesService] Exception dans listProfiles:', err);
    throw err;
  }
}
