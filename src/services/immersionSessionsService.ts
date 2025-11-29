import { supabase } from '../lib/supabaseClient';

export interface ImmersionSession {
  id: string;
  session_date_start: string;
  session_date_end: string;
  max_places: number;
  reserved_places: number;
  status: 'open' | 'full' | 'closed';
  location: string;
  price_cents: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImmersionBooking {
  id: string;
  session_id: string;
  user_id: string | null;
  user_email: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère toutes les sessions actives
 */
export async function getActiveSessions(): Promise<ImmersionSession[]> {
  try {
    const { data, error } = await supabase
      .from('immersion_sessions')
      .select('*')
      .eq('is_active', true)
      .gte('session_date_end', new Date().toISOString().split('T')[0]) // Sessions futures ou en cours
      .order('session_date_start', { ascending: true });

    if (error) {
      console.error('Error fetching immersion sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveSessions:', error);
    return [];
  }
}

/**
 * Récupère une session spécifique par ID
 */
export async function getSessionById(sessionId: string): Promise<ImmersionSession | null> {
  try {
    const { data, error } = await supabase
      .from('immersion_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSessionById:', error);
    return null;
  }
}

/**
 * Vérifie si une session a encore des places disponibles
 */
export async function checkSessionAvailability(sessionId: string): Promise<boolean> {
  try {
    const session = await getSessionById(sessionId);
    if (!session) return false;

    return session.status === 'open' && session.reserved_places < session.max_places;
  } catch (error) {
    console.error('Error in checkSessionAvailability:', error);
    return false;
  }
}

/**
 * Réserve une place dans une session (appelé après paiement Stripe réussi)
 */
export async function reserveSessionPlace(
  sessionId: string,
  userEmail: string,
  stripeSessionId: string,
  userId?: string
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    // Vérifier la disponibilité
    const isAvailable = await checkSessionAvailability(sessionId);
    if (!isAvailable) {
      return { success: false, error: 'Session complète ou non disponible' };
    }

    // Créer la réservation
    const { data: booking, error: bookingError } = await supabase
      .from('immersion_bookings')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        user_email: userEmail,
        stripe_session_id: stripeSessionId,
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return { success: false, error: bookingError.message };
    }

    // Incrémenter le nombre de places réservées
    const { error: updateError } = await supabase.rpc('increment_session_places', {
      p_session_id: sessionId,
    });

    if (updateError) {
      console.error('Error updating session places:', updateError);
      // Annuler la réservation si l'incrémentation échoue
      await supabase.from('immersion_bookings').delete().eq('id', booking.id);
      return { success: false, error: 'Erreur lors de la réservation' };
    }

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error('Error in reserveSessionPlace:', error);
    return { success: false, error: 'Erreur inattendue' };
  }
}

/**
 * Annule une réservation
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer la réservation
    const { data: booking, error: fetchError } = await supabase
      .from('immersion_bookings')
      .select('*, session:immersion_sessions(*)')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return { success: false, error: 'Réservation introuvable' };
    }

    // Marquer la réservation comme annulée
    const { error: updateError } = await supabase
      .from('immersion_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Décrémenter le nombre de places réservées
    const { error: decrementError } = await supabase.rpc('decrement_session_places', {
      p_session_id: booking.session_id,
    });

    if (decrementError) {
      console.error('Error decrementing session places:', decrementError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return { success: false, error: 'Erreur inattendue' };
  }
}

/**
 * Récupère les réservations d'un utilisateur
 */
export async function getUserBookings(userId: string): Promise<ImmersionBooking[]> {
  try {
    const { data, error } = await supabase
      .from('immersion_bookings')
      .select('*, session:immersion_sessions(*)')
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return [];
  }
}

/**
 * Formate les dates de session pour l'affichage
 */
export function formatSessionDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const startFormatted = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const endFormatted = end.toLocaleDateString('fr-FR', options);

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Calcule le nombre de places restantes
 */
export function getAvailablePlaces(session: ImmersionSession): number {
  return session.max_places - session.reserved_places;
}

