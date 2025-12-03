import { supabase } from '../lib/supabaseClient';
import type { Payment } from '../types/training';

// Libellés pour les types de licence
const LICENSE_LABELS: Record<string, string> = {
  starter: 'Starter (Entrée)',
  pro: 'Pro (Transformation)',
  elite: 'Elite (Immersion)',
};

export async function getPaymentsForCurrentUser(): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const isTableNotFound = error.code === 'PGRST205' || 
                             error.message?.includes('Could not find the table') ||
                             error.message?.includes('table') && error.message?.includes('not found');
      const isRLSError = error.code === '42501' || 
                        error.message?.includes('permission denied') || 
                        error.message?.includes('RLS');
      
      if (isTableNotFound || isRLSError) {
        return [];
      }
      
      throw error;
    }

    return data ?? [];
  } catch (err: any) {
    const isTableNotFound = err?.code === 'PGRST205' || 
                           err?.message?.includes('Could not find the table') ||
                           err?.message?.includes('table') && err?.message?.includes('not found');
    
    if (!isTableNotFound) {
      console.error('[purchasesService] Exception dans getPaymentsForCurrentUser:', err);
    }
    return [];
  }
}

export async function getPaymentsForAdmin(): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const isTableNotFound = error.code === 'PGRST205' || 
                             error.message?.includes('Could not find the table') ||
                             error.message?.includes('table') && error.message?.includes('not found');
      const isRLSError = error.code === '42501' || 
                        error.message?.includes('permission denied') || 
                        error.message?.includes('RLS');
      
      if (isTableNotFound) {
        return [];
      }
      
      if (isRLSError) {
        return [];
      }
      
      console.error('[purchasesService] Erreur lors de la récupération des paiements:', error);
      return [];
    }

    return data ?? [];
  } catch (err: any) {
    const isTableNotFound = err?.code === 'PGRST205' || 
                           err?.message?.includes('Could not find the table') ||
                           err?.message?.includes('table') && err?.message?.includes('not found');
    
    if (!isTableNotFound) {
      console.error('[purchasesService] Exception dans getPaymentsForAdmin:', err);
    }
    return [];
  }
}

// Fonction utilitaire pour obtenir le libellé d'une licence
export function getLicenseLabel(licenseType: string | null): string {
  if (!licenseType) return 'Inconnu';
  return LICENSE_LABELS[licenseType] || licenseType;
}

// Anciennes fonctions pour rétrocompatibilité (deprecated)
/** @deprecated Utiliser getPaymentsForCurrentUser à la place */
export const getPurchasesForCurrentUser = getPaymentsForCurrentUser;
/** @deprecated Utiliser getPaymentsForAdmin à la place */
export const getPurchasesForAdmin = getPaymentsForAdmin;
