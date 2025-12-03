/**
 * Service de Parrainage
 * 
 * Gère toutes les opérations liées au système de parrainage :
 * - Génération et validation des codes
 * - Statistiques du parrain
 * - Demandes de retrait
 * - Historique des parrainages
 */

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export type ReferralStatus = 'pending' | 'converted' | 'validated' | 'cancelled';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type ReferralTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'black_diamond' | 'legend';

export interface ReferralStats {
  referralCode: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalReferrals: number;
  convertedReferrals: number;
  currentTier: ReferralTier;
  bonusRate: number;
  nextTier: ReferralTier | null;
  referralsToNextTier: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string | null;
  referredEmail: string | null;
  status: ReferralStatus;
  offerPurchased: string | null;
  originalAmount: number | null;
  discountAmount: number | null;
  commissionAmount: number | null;
  bonusAmount: number | null;
  totalCommission: number | null;
  convertedAt: string | null;
  validatedAt: string | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  iban: string;
  ibanHolderName: string;
  status: WithdrawalStatus;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
  // Enrichi pour l'admin
  userEmail?: string;
  userName?: string;
}

export interface TierInfo {
  tier: ReferralTier;
  label: string;
  requiredReferrals: number;
  reward: string;
  icon: string;
}

export interface CodeValidationResult {
  isValid: boolean;
  referrerId: string | null;
  referrerName: string | null;
  codeId: string | null;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const TIER_INFO: Record<ReferralTier, TierInfo> = {
  none: {
    tier: 'none',
    label: 'Débutant',
    requiredReferrals: 0,
    reward: '',
    icon: '👤',
  },
  bronze: {
    tier: 'bronze',
    label: 'Bronze',
    requiredReferrals: 3,
    reward: 'Badge "Ambassadeur" + rôle Discord',
    icon: '🥉',
  },
  silver: {
    tier: 'silver',
    label: 'Silver',
    requiredReferrals: 5,
    reward: '1 mois Zone Premium offert',
    icon: '🥈',
  },
  gold: {
    tier: 'gold',
    label: 'Gold',
    requiredReferrals: 10,
    reward: 'Coaching individuel 1h',
    icon: '🥇',
  },
  platinum: {
    tier: 'platinum',
    label: 'Platinum',
    requiredReferrals: 15,
    reward: 'Formation avancée offerte',
    icon: '💎',
  },
  diamond: {
    tier: 'diamond',
    label: 'Diamond',
    requiredReferrals: 20,
    reward: 'PropFirm Challenge offert',
    icon: '💠',
  },
  black_diamond: {
    tier: 'black_diamond',
    label: 'Black Diamond',
    requiredReferrals: 50,
    reward: 'Bootcamp Élite offert',
    icon: '🖤',
  },
  legend: {
    tier: 'legend',
    label: 'Legend',
    requiredReferrals: 100,
    reward: 'Accès à vie futures formations',
    icon: '👑',
  },
};

export const MINIMUM_WITHDRAWAL = 50;
export const BASE_COMMISSION_RATE = 10; // 10%
export const FILLEUL_DISCOUNT_RATE = 10; // 10%

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Récupère les statistiques de parrainage de l'utilisateur connecté
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_referral_stats', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[referralService] Erreur get_referral_stats:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      referralCode: row.referral_code,
      availableBalance: Number(row.available_balance) || 0,
      pendingBalance: Number(row.pending_balance) || 0,
      totalEarned: Number(row.total_earned) || 0,
      totalWithdrawn: Number(row.total_withdrawn) || 0,
      totalReferrals: row.total_referrals || 0,
      convertedReferrals: row.converted_referrals || 0,
      currentTier: row.current_tier || 'none',
      bonusRate: Number(row.bonus_rate) || 0,
      nextTier: row.next_tier || null,
      referralsToNextTier: row.referrals_to_next_tier || 0,
    };
  } catch (err) {
    console.error('[referralService] Exception get_referral_stats:', err);
    return null;
  }
}

/**
 * Obtient ou crée le code de parrainage de l'utilisateur
 */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_referral_code', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[referralService] Erreur get_or_create_referral_code:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[referralService] Exception get_or_create_referral_code:', err);
    return null;
  }
}

/**
 * Valide un code de parrainage
 */
export async function validateReferralCode(code: string): Promise<CodeValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_referral_code', {
      p_code: code.toUpperCase().trim(),
    });

    if (error) {
      console.error('[referralService] Erreur validate_referral_code:', error);
      return { isValid: false, referrerId: null, referrerName: null, codeId: null };
    }

    if (!data || data.length === 0 || !data[0].is_valid) {
      return { isValid: false, referrerId: null, referrerName: null, codeId: null };
    }

    const row = data[0];
    return {
      isValid: true,
      referrerId: row.referrer_id,
      referrerName: row.referrer_name,
      codeId: row.code_id,
    };
  } catch (err) {
    console.error('[referralService] Exception validate_referral_code:', err);
    return { isValid: false, referrerId: null, referrerName: null, codeId: null };
  }
}

/**
 * Récupère l'historique des parrainages de l'utilisateur
 */
export async function getReferralHistory(userId: string): Promise<Referral[]> {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[referralService] Erreur getReferralHistory:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      referrerId: row.referrer_id,
      referredId: row.referred_id,
      referredEmail: row.referred_email,
      status: row.status as ReferralStatus,
      offerPurchased: row.offer_purchased,
      originalAmount: row.original_amount ? Number(row.original_amount) : null,
      discountAmount: row.discount_amount ? Number(row.discount_amount) : null,
      commissionAmount: row.commission_amount ? Number(row.commission_amount) : null,
      bonusAmount: row.bonus_amount ? Number(row.bonus_amount) : null,
      totalCommission: row.total_commission ? Number(row.total_commission) : null,
      convertedAt: row.converted_at,
      validatedAt: row.validated_at,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('[referralService] Exception getReferralHistory:', err);
    return [];
  }
}

/**
 * Récupère l'historique des demandes de retrait de l'utilisateur
 */
export async function getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('[referralService] Erreur getWithdrawalHistory:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      iban: row.iban,
      ibanHolderName: row.iban_holder_name,
      status: row.status as WithdrawalStatus,
      adminNote: row.admin_note,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
    }));
  } catch (err) {
    console.error('[referralService] Exception getWithdrawalHistory:', err);
    return [];
  }
}

/**
 * Demande un retrait
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  iban: string,
  ibanHolderName: string
): Promise<{ success: boolean; error?: string; withdrawalId?: string }> {
  try {
    // Validation côté client
    if (amount < MINIMUM_WITHDRAWAL) {
      return { success: false, error: `Montant minimum : ${MINIMUM_WITHDRAWAL}€` };
    }

    if (!validateIbanFormat(iban)) {
      return { success: false, error: 'Format IBAN invalide' };
    }

    if (!ibanHolderName || ibanHolderName.trim().length < 2) {
      return { success: false, error: 'Nom du titulaire requis' };
    }

    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_iban: iban.replace(/\s/g, '').toUpperCase(),
      p_iban_holder_name: ibanHolderName.trim(),
    });

    if (error) {
      console.error('[referralService] Erreur request_withdrawal:', error);
      return { success: false, error: error.message || 'Erreur lors de la demande' };
    }

    return { success: true, withdrawalId: data };
  } catch (err: any) {
    console.error('[referralService] Exception request_withdrawal:', err);
    return { success: false, error: err.message || 'Erreur inattendue' };
  }
}

/**
 * Récupère l'IBAN sauvegardé de l'utilisateur
 */
export async function getSavedIban(userId: string): Promise<{ iban: string | null; holderName: string | null }> {
  try {
    const { data, error } = await supabase
      .from('referral_wallets')
      .select('iban, iban_holder_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return { iban: null, holderName: null };
    }

    return {
      iban: data.iban,
      holderName: data.iban_holder_name,
    };
  } catch (err) {
    console.error('[referralService] Exception getSavedIban:', err);
    return { iban: null, holderName: null };
  }
}

// ============================================================================
// FONCTIONS ADMIN
// ============================================================================

/**
 * Récupère toutes les demandes de retrait en attente (admin)
 */
export async function getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .in('status', ['pending', 'processing'])
      .order('requested_at', { ascending: true });

    if (error) {
      console.error('[referralService] Erreur getPendingWithdrawals:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      iban: row.iban,
      ibanHolderName: row.iban_holder_name,
      status: row.status as WithdrawalStatus,
      adminNote: row.admin_note,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      userEmail: row.profiles?.email,
      userName: row.profiles?.full_name,
    }));
  } catch (err) {
    console.error('[referralService] Exception getPendingWithdrawals:', err);
    return [];
  }
}

/**
 * Récupère toutes les demandes de retrait (admin)
 */
export async function getAllWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order('requested_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[referralService] Erreur getAllWithdrawals:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      iban: row.iban,
      ibanHolderName: row.iban_holder_name,
      status: row.status as WithdrawalStatus,
      adminNote: row.admin_note,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      userEmail: row.profiles?.email,
      userName: row.profiles?.full_name,
    }));
  } catch (err) {
    console.error('[referralService] Exception getAllWithdrawals:', err);
    return [];
  }
}

/**
 * Traite une demande de retrait (admin)
 */
export async function processWithdrawal(
  withdrawalId: string,
  adminId: string,
  status: 'completed' | 'rejected',
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('process_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: adminId,
      p_status: status,
      p_note: note || null,
    });

    if (error) {
      console.error('[referralService] Erreur process_withdrawal:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[referralService] Exception process_withdrawal:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Récupère les statistiques globales de parrainage (admin)
 */
export async function getGlobalReferralStats(): Promise<{
  totalReferrals: number;
  totalConverted: number;
  totalCommissions: number;
  totalPaid: number;
  pendingWithdrawals: number;
}> {
  try {
    // Total des parrainages
    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true });

    // Total des convertis
    const { count: totalConverted } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .in('status', ['converted', 'validated']);

    // Total des commissions
    const { data: commissionsData } = await supabase
      .from('referral_wallets')
      .select('total_earned');
    
    const totalCommissions = (commissionsData || []).reduce(
      (sum, row) => sum + (Number(row.total_earned) || 0),
      0
    );

    // Total payé
    const { data: paidData } = await supabase
      .from('referral_wallets')
      .select('total_withdrawn');
    
    const totalPaid = (paidData || []).reduce(
      (sum, row) => sum + (Number(row.total_withdrawn) || 0),
      0
    );

    // Demandes en attente
    const { count: pendingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      totalReferrals: totalReferrals || 0,
      totalConverted: totalConverted || 0,
      totalCommissions,
      totalPaid,
      pendingWithdrawals: pendingWithdrawals || 0,
    };
  } catch (err) {
    console.error('[referralService] Exception getGlobalReferralStats:', err);
    return {
      totalReferrals: 0,
      totalConverted: 0,
      totalCommissions: 0,
      totalPaid: 0,
      pendingWithdrawals: 0,
    };
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Valide le format d'un IBAN (validation basique)
 */
export function validateIbanFormat(iban: string): boolean {
  // Nettoyer l'IBAN
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Vérifier la longueur (15-34 caractères)
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return false;
  }
  
  // Vérifier le format (2 lettres + 2 chiffres + reste alphanumérique)
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleanIban)) {
    return false;
  }
  
  // Validation IBAN complète (algorithme mod 97)
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    })
    .join('');
  
  // Calculer mod 97 par morceaux (pour éviter les overflow)
  let remainder = '';
  for (const digit of numericIban) {
    remainder += digit;
    if (remainder.length > 7) {
      remainder = (parseInt(remainder, 10) % 97).toString();
    }
  }
  
  return parseInt(remainder, 10) % 97 === 1;
}

/**
 * Formate un IBAN pour l'affichage (groupes de 4)
 */
export function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

/**
 * Masque un IBAN pour l'affichage sécurisé
 */
export function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 10) return clean;
  return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
}

/**
 * Calcule la réduction pour un filleul
 */
export function calculateFilleulDiscount(originalPrice: number): {
  discount: number;
  finalPrice: number;
} {
  const discount = Math.round(originalPrice * (FILLEUL_DISCOUNT_RATE / 100) * 100) / 100;
  return {
    discount,
    finalPrice: originalPrice - discount,
  };
}

/**
 * Calcule la commission pour un parrain
 */
export function calculateCommission(
  originalPrice: number,
  bonusRate: number = 0
): {
  baseCommission: number;
  bonus: number;
  total: number;
} {
  const baseCommission = Math.round(originalPrice * (BASE_COMMISSION_RATE / 100) * 100) / 100;
  const bonus = Math.round(originalPrice * (bonusRate / 100) * 100) / 100;
  return {
    baseCommission,
    bonus,
    total: baseCommission + bonus,
  };
}

/**
 * Génère le lien de parrainage
 */
export function generateReferralLink(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/pricing?ref=${code}`;
}

/**
 * Génère le message de partage WhatsApp
 */
export function generateWhatsAppMessage(code: string, referrerName?: string): string {
  const link = generateReferralLink(code);
  const name = referrerName || 'un ami';
  return encodeURIComponent(
    `🎯 ${name} te recommande Invest Infinity !\n\n` +
    `Utilise mon code parrain "${code}" et obtiens -10% sur ta formation.\n\n` +
    `👉 ${link}`
  );
}

/**
 * Génère le lien WhatsApp
 */
export function generateWhatsAppLink(code: string, referrerName?: string): string {
  return `https://wa.me/?text=${generateWhatsAppMessage(code, referrerName)}`;
}

/**
 * Génère le lien mailto
 */
export function generateEmailLink(code: string, referrerName?: string): string {
  const link = generateReferralLink(code);
  const name = referrerName || 'Un ami';
  const subject = encodeURIComponent('Découvre Invest Infinity avec -10% !');
  const body = encodeURIComponent(
    `Salut,\n\n` +
    `${name} te recommande la formation trading Invest Infinity.\n\n` +
    `Utilise le code parrain "${code}" pour obtenir -10% sur ton inscription.\n\n` +
    `Clique ici : ${link}\n\n` +
    `À bientôt !`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Stocke le code parrain dans le localStorage
 */
export function storeReferralCode(code: string): void {
  try {
    localStorage.setItem('referral_code', code.toUpperCase().trim());
    localStorage.setItem('referral_code_timestamp', Date.now().toString());
  } catch (err) {
    console.error('[referralService] Erreur stockage code parrain:', err);
  }
}

/**
 * Récupère le code parrain stocké (valide 30 jours)
 */
export function getStoredReferralCode(): string | null {
  try {
    const code = localStorage.getItem('referral_code');
    const timestamp = localStorage.getItem('referral_code_timestamp');
    
    if (!code || !timestamp) return null;
    
    // Vérifier si le code n'a pas expiré (30 jours)
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(timestamp, 10) > thirtyDays) {
      clearStoredReferralCode();
      return null;
    }
    
    return code;
  } catch (err) {
    console.error('[referralService] Erreur lecture code parrain:', err);
    return null;
  }
}

/**
 * Efface le code parrain stocké
 */
export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem('referral_code');
    localStorage.removeItem('referral_code_timestamp');
  } catch (err) {
    console.error('[referralService] Erreur suppression code parrain:', err);
  }
}

