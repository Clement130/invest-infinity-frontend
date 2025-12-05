import { supabase } from '../lib/supabaseClient';

export interface LicenseStatus {
  id: string;
  is_active: boolean;
  last_payment_date: string;
  deactivated_at: string | null;
  admin_revocation_days: number;
  auto_renewal_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicenseStatusWithCalculations extends LicenseStatus {
  daysRemaining: number;
  nextPaymentDate: Date;
  isExpired: boolean;
  adminStatus: 'active' | 'revoked';
}

// Récupérer le statut de la licence
export async function getLicenseStatus(): Promise<LicenseStatus | null> {
  const { data, error } = await supabase
    .from('developer_license')
    .select('*')
    .maybeSingle();

  if (error) {
    // Si erreur d'autorisation (RLS), retourner null au lieu de throw
    // pour permettre au code de continuer sans bloquer l'application
    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
      console.warn('Accès à developer_license refusé (RLS):', error.message);
      return null;
    }
    // Pour les autres erreurs (réseau, etc.), loguer mais ne pas bloquer
    console.warn('Erreur lors de la récupération du statut de la licence:', error);
    return null;
  }

  return data;
}

// Valider le paiement (appelé par le bouton - UNE SEULE FOIS)
export async function validatePayment(): Promise<LicenseStatus> {
  const now = new Date().toISOString();

  // Mettre à jour la licence et activer le flag pour indiquer qu'on a déjà cliqué
  const { data: updatedLicense, error: updateError } = await supabase
    .from('developer_license')
    .update({
      is_active: true,
      last_payment_date: now,
      deactivated_at: null,
      auto_renewal_enabled: true, // Flag pour indiquer qu'on a déjà validé une fois
    })
    .select()
    .single();

  if (updateError) {
    console.error('Erreur lors de la validation du paiement:', updateError);
    throw updateError;
  }

  // Vérifier et réassigner le rôle admin si nécessaire
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', 'investinfinityfr@gmail.com')
    .maybeSingle();

  if (clientProfile && clientProfile.role !== 'admin') {
    // Réassigner le rôle admin
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'investinfinityfr@gmail.com');

    if (roleError) {
      console.error('Erreur lors de la réassignation du rôle admin:', roleError);
      // Ne pas faire échouer la validation si la réassignation échoue
    }
  }

  return updatedLicense;
}

// Vérifier si la licence est expirée
export function isLicenseExpired(lastPaymentDate: string, revocationDays: number): boolean {
  const lastPayment = new Date(lastPaymentDate);
  const expirationDate = new Date(lastPayment);
  expirationDate.setDate(expirationDate.getDate() + revocationDays);
  
  return new Date() > expirationDate;
}

// Calculer les jours restants
export function getDaysRemaining(lastPaymentDate: string, revocationDays: number): number {
  const lastPayment = new Date(lastPaymentDate);
  const expirationDate = new Date(lastPayment);
  expirationDate.setDate(expirationDate.getDate() + revocationDays);
  
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

// Calculer la date du prochain paiement
export function getNextPaymentDate(lastPaymentDate: string, revocationDays: number): Date {
  const lastPayment = new Date(lastPaymentDate);
  const nextPayment = new Date(lastPayment);
  nextPayment.setDate(nextPayment.getDate() + revocationDays);
  
  return nextPayment;
}

// Récupérer le statut complet avec calculs
export async function getLicenseStatusWithCalculations(): Promise<LicenseStatusWithCalculations | null> {
  const status = await getLicenseStatus();
  
  if (!status) {
    return null;
  }

  const daysRemaining = getDaysRemaining(status.last_payment_date, status.admin_revocation_days);
  const nextPaymentDate = getNextPaymentDate(status.last_payment_date, status.admin_revocation_days);
  const isExpired = isLicenseExpired(status.last_payment_date, status.admin_revocation_days);

  // Vérifier le statut admin du client
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', 'investinfinityfr@gmail.com')
    .maybeSingle();

  const adminStatus: 'active' | 'revoked' = clientProfile?.role === 'admin' ? 'active' : 'revoked';

  return {
    ...status,
    daysRemaining,
    nextPaymentDate,
    isExpired: !status.is_active || isExpired,
    adminStatus,
  };
}

