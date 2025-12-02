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
    // Retourner un tableau vide au lieu de throw pour éviter de bloquer l'interface
    // Les erreurs sont déjà loggées pour le débogage
    return [];
  }
}

export type LicenseType = 'none' | 'entree' | 'transformation' | 'immersion';

export async function updateProfileLicense(userId: string, license: LicenseType): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ license })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[profilesService] Erreur lors de la mise à jour de la licence:', error);
    throw error;
  }

  return data;
}

export async function updateProfileRole(userId: string, role: 'client' | 'admin'): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[profilesService] Erreur lors de la mise à jour du rôle:', error);
    throw error;
  }

  return data;
}
