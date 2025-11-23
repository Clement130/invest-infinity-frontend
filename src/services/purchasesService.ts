import { supabase } from '../lib/supabaseClient';
import type { Purchase } from '../types/training';

export async function getPurchasesForCurrentUser(): Promise<Purchase[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Ne pas logger les erreurs si la table n'existe pas (PGRST205) ou erreur RLS
      const isTableNotFound = error.code === 'PGRST205' || 
                             error.message?.includes('Could not find the table') ||
                             error.message?.includes('table') && error.message?.includes('not found');
      const isRLSError = error.code === '42501' || 
                        error.message?.includes('permission denied') || 
                        error.message?.includes('RLS');
      
      if (isTableNotFound || isRLSError) {
        // Table n'existe pas ou erreur RLS - retourner un tableau vide silencieusement
        return [];
      }
      
      // Pour les autres erreurs, throw
      throw error;
    }

    return data ?? [];
  } catch (err: any) {
    // Ne pas logger si c'est une erreur de table non trouvée
    const isTableNotFound = err?.code === 'PGRST205' || 
                           err?.message?.includes('Could not find the table') ||
                           err?.message?.includes('table') && err?.message?.includes('not found');
    
    if (!isTableNotFound) {
      console.error('[purchasesService] Exception dans getPurchasesForCurrentUser:', err);
    }
    // Retourner un tableau vide au lieu de throw pour éviter de bloquer l'interface
    return [];
  }
}

export async function getPurchasesForAdmin(): Promise<Purchase[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Ne pas logger les erreurs si la table n'existe pas (PGRST205) ou erreur RLS
      const isTableNotFound = error.code === 'PGRST205' || 
                             error.message?.includes('Could not find the table') ||
                             error.message?.includes('table') && error.message?.includes('not found');
      const isRLSError = error.code === '42501' || 
                        error.message?.includes('permission denied') || 
                        error.message?.includes('RLS');
      
      if (isTableNotFound) {
        // Table n'existe pas encore - retourner un tableau vide silencieusement
        return [];
      }
      
      if (isRLSError) {
        // Erreur RLS - retourner un tableau vide silencieusement
        return [];
      }
      
      // Pour les autres erreurs, logger mais ne pas throw
      console.error('[purchasesService] Erreur lors de la récupération des achats:', error);
      return [];
    }

    return data ?? [];
  } catch (err: any) {
    // Ne pas logger si c'est une erreur de table non trouvée
    const isTableNotFound = err?.code === 'PGRST205' || 
                           err?.message?.includes('Could not find the table') ||
                           err?.message?.includes('table') && err?.message?.includes('not found');
    
    if (!isTableNotFound) {
      console.error('[purchasesService] Exception dans getPurchasesForAdmin:', err);
    }
    // Retourner un tableau vide au lieu de throw pour éviter de bloquer l'interface
    return [];
  }
}
