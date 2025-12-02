/**
 * Service pour gérer les demandes de rendez-vous Bootcamp Élite
 */

import { supabase } from '../lib/supabaseClient';
import type { 
  AppointmentRequest, 
  CreateAppointmentPayload, 
  AppointmentStatus 
} from '../types/appointment';

// URL de l'endpoint pour soumettre un RDV
const SUBMIT_RDV_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-rdv`;

/**
 * Soumet une nouvelle demande de rendez-vous via l'Edge Function
 */
export async function submitAppointmentRequest(
  payload: CreateAppointmentPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Récupérer le token si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(SUBMIT_RDV_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        // Mapper les champs pour l'endpoint existant
        name: `${payload.firstName} ${payload.lastName}`,
        email: payload.email,
        phone: payload.phone,
        preferences: formatPreferences(payload),
        sessionId: payload.sessionId || null,
        userId: payload.userId || null,
        // Nouveaux champs
        offerId: payload.offerId,
        offerName: payload.offerName,
        location: payload.location,
        type: payload.type,
        availability: payload.availability,
        goals: payload.goals,
        source: payload.source,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      return { success: false, error: errorData.error || 'Erreur lors de l\'envoi' };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Erreur submitAppointmentRequest:', error);
    return { success: false, error: 'Erreur de connexion au serveur' };
  }
}

/**
 * Formate les préférences en texte lisible pour l'email admin
 */
function formatPreferences(payload: CreateAppointmentPayload): string {
  const parts: string[] = [];
  
  if (payload.location) {
    parts.push(`📍 Localisation: ${payload.location}`);
  }
  if (payload.type) {
    parts.push(`📞 Type de RDV: ${payload.type}`);
  }
  if (payload.availability) {
    parts.push(`📅 Disponibilités: ${payload.availability}`);
  }
  if (payload.goals) {
    parts.push(`🎯 Objectifs: ${payload.goals}`);
  }
  if (payload.source) {
    parts.push(`🔗 Source: ${payload.source}`);
  }
  
  return parts.join('\n') || 'Aucune préférence spécifiée';
}

/**
 * Récupère toutes les demandes de RDV (admin uniquement)
 */
export async function getAppointmentRequests(): Promise<AppointmentRequest[]> {
  const { data, error } = await supabase
    .from('rdv_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur getAppointmentRequests:', error);
    return [];
  }

  return (data || []).map(mapDbToAppointment);
}

/**
 * Met à jour le statut d'une demande de RDV
 */
export async function updateAppointmentStatus(
  id: string, 
  status: AppointmentStatus,
  adminNotes?: string
): Promise<boolean> {
  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  const { error } = await supabase
    .from('rdv_requests')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Erreur updateAppointmentStatus:', error);
    return false;
  }

  return true;
}

/**
 * Supprime une demande de RDV
 */
export async function deleteAppointmentRequest(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('rdv_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur deleteAppointmentRequest:', error);
    return false;
  }

  return true;
}

/**
 * Compte les demandes par statut
 */
export async function getAppointmentStats(): Promise<Record<AppointmentStatus, number>> {
  const { data, error } = await supabase
    .from('rdv_requests')
    .select('status');

  if (error) {
    console.error('Erreur getAppointmentStats:', error);
    return { pending: 0, contacted: 0, confirmed: 0, cancelled: 0 };
  }

  const stats: Record<AppointmentStatus, number> = {
    pending: 0,
    contacted: 0,
    confirmed: 0,
    cancelled: 0,
  };

  (data || []).forEach((row) => {
    const status = row.status as AppointmentStatus;
    if (stats[status] !== undefined) {
      stats[status]++;
    }
  });

  return stats;
}

/**
 * Mappe les données de la DB vers l'interface TypeScript
 */
function mapDbToAppointment(row: Record<string, unknown>): AppointmentRequest {
  // Parser le nom complet en prénom/nom
  const nameParts = (row.name as string || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Parser les préférences pour extraire les champs
  const preferences = row.preferences as string || '';
  const locationMatch = preferences.match(/📍 Localisation: (.+)/);
  const typeMatch = preferences.match(/📞 Type de RDV: (.+)/);
  const availabilityMatch = preferences.match(/📅 Disponibilités: (.+)/);
  const goalsMatch = preferences.match(/🎯 Objectifs: (.+)/);
  const sourceMatch = preferences.match(/🔗 Source: (.+)/);

  return {
    id: row.id as string,
    offerId: (row.offer_id as string) || 'immersion_elite',
    offerName: (row.offer_name as string) || 'Bootcamp Élite',
    firstName,
    lastName,
    email: row.email as string,
    phone: row.phone as string,
    location: locationMatch?.[1],
    type: (typeMatch?.[1] || 'appel_decouverte') as AppointmentRequest['type'],
    availability: availabilityMatch?.[1] || preferences,
    goals: goalsMatch?.[1],
    source: (sourceMatch?.[1] || 'chatbot_direct') as AppointmentRequest['source'],
    status: row.status as AppointmentStatus,
    adminNotes: row.admin_notes as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
    sessionId: row.session_id as string | undefined,
    userId: row.user_id as string | undefined,
  };
}

/**
 * Validation de l'email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validation du numéro de téléphone
 */
export function validatePhone(phone: string): boolean {
  // Accepte les formats internationaux et français
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  const phoneRegex = /^(\+?\d{1,4})?\d{8,12}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Formate le numéro de téléphone
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Si c'est un numéro français sans indicatif
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return `+33 ${cleanPhone.slice(1, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4, 6)} ${cleanPhone.slice(6, 8)} ${cleanPhone.slice(8, 10)}`;
  }
  
  return phone;
}







