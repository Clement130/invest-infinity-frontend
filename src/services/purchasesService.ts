import { supabase } from '../lib/supabaseClient';
import type { Purchase } from '../types/training';

export async function getPurchasesForCurrentUser(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getPurchasesForAdmin(): Promise<Purchase[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[purchasesService] Erreur lors de la récupération des achats:', error);
      
      // Si c'est une erreur RLS, on retourne un tableau vide au lieu de throw
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.warn('[purchasesService] Erreur RLS détectée, retour d\'un tableau vide');
        return [];
      }
      
      throw error;
    }

    return data ?? [];
  } catch (err: any) {
    console.error('[purchasesService] Exception dans getPurchasesForAdmin:', err);
    // Retourner un tableau vide au lieu de throw pour éviter de bloquer l'interface
    // Les erreurs sont déjà loggées pour le débogage
    return [];
  }
}
