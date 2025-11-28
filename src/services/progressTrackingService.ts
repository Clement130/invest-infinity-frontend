/**
 * Service de suivi automatique de progression vidéo
 * 
 * Gère le marquage automatique des leçons comme "vues" et "complétées"
 * basé sur le temps de visionnage et la progression de la vidéo.
 */
import { supabase } from '../lib/supabaseClient';

export interface VideoProgressEvent {
  currentTime: number;
  duration: number;
  percentage: number;
}

export interface LessonProgressState {
  isViewed: boolean;
  isCompleted: boolean;
  lastViewedAt: string | null;
}

const VIEWED_THRESHOLD_SECONDS = 30; // Marquer comme "vue" après 30 secondes
const COMPLETED_THRESHOLD_PERCENTAGE = 90; // Marquer comme "complétée" à 90%

/**
 * Marque une leçon comme "vue" si le seuil est atteint
 * Met également à jour last_viewed pour actualiser la date d'activité
 */
export async function markLessonAsViewed(
  userId: string,
  lessonId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si une entrée existe déjà
    const { data: existing } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      // Mettre à jour last_viewed pour actualiser la date d'activité (même si déjà vue)
      const { error } = await supabase
        .from('training_progress')
        .update({
          last_viewed: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Créer une nouvelle entrée
      const { error } = await supabase.from('training_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        done: false,
        last_viewed: now,
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('[progressTrackingService] Erreur lors du marquage comme vue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marque une leçon comme "complétée"
 */
export async function markLessonAsCompleted(
  userId: string,
  lessonId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    // Vérifier si une entrée existe déjà
    const { data: existing } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existing) {
      // Mettre à jour
      const { error } = await supabase
        .from('training_progress')
        .update({
          done: true,
          last_viewed: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Créer une nouvelle entrée
      const { error } = await supabase.from('training_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        done: true,
        last_viewed: now,
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('[progressTrackingService] Erreur lors du marquage comme complétée:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Gère le suivi de progression basé sur les événements vidéo
 */
export class VideoProgressTracker {
  private userId: string;
  private lessonId: string;
  private hasBeenViewed: boolean = false;
  private hasBeenCompleted: boolean = false;
  private lastUpdateTime: number = 0;
  private lastViewedUpdateTime: number = 0;
  private updateThrottle: number = 2000; // Mettre à jour max toutes les 2 secondes
  private lastViewedUpdateInterval: number = 30000; // Mettre à jour last_viewed toutes les 30 secondes

  constructor(userId: string, lessonId: string) {
    this.userId = userId;
    this.lessonId = lessonId;
    console.log('[VideoProgressTracker] Initialisé pour:', { userId, lessonId });
  }

  /**
   * Traite un événement de progression vidéo
   */
  async handleProgress(event: VideoProgressEvent): Promise<void> {
    const now = Date.now();

    // Vérifier les seuils AVANT le throttle pour ne pas rater les événements importants
    const shouldMarkViewed = !this.hasBeenViewed && event.currentTime >= VIEWED_THRESHOLD_SECONDS;
    const shouldMarkCompleted = !this.hasBeenCompleted && event.percentage >= COMPLETED_THRESHOLD_PERCENTAGE;

    // Si on doit marquer un seuil important, ignorer le throttle
    if (shouldMarkViewed || shouldMarkCompleted) {
      if (shouldMarkViewed) {
        console.log('[VideoProgressTracker] 🎯 Seuil "vue" atteint:', event.currentTime, 'secondes');
        this.hasBeenViewed = true;
        const result = await markLessonAsViewed(this.userId, this.lessonId);
        console.log('[VideoProgressTracker] Résultat markLessonAsViewed:', result);
      }

      if (shouldMarkCompleted) {
        console.log('[VideoProgressTracker] 🏆 Seuil "complétée" atteint:', event.percentage, '%');
        this.hasBeenCompleted = true;
        const result = await markLessonAsCompleted(this.userId, this.lessonId);
        console.log('[VideoProgressTracker] Résultat markLessonAsCompleted:', result);
      }

      this.lastUpdateTime = now;
      return;
    }

    // Throttle pour les mises à jour régulières
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }

    this.lastUpdateTime = now;

    // Mettre à jour last_viewed périodiquement pendant la lecture
    if (now - this.lastViewedUpdateTime >= this.lastViewedUpdateInterval) {
      this.lastViewedUpdateTime = now;
      await markLessonAsViewed(this.userId, this.lessonId);
    }
  }

  /**
   * Met à jour last_viewed manuellement (pour les mises à jour périodiques)
   */
  async updateLastViewed(): Promise<void> {
    await markLessonAsViewed(this.userId, this.lessonId);
  }

  /**
   * Réinitialise le tracker (utile si l'utilisateur recharge la page)
   */
  reset(): void {
    this.hasBeenViewed = false;
    this.hasBeenCompleted = false;
    this.lastUpdateTime = 0;
    this.lastViewedUpdateTime = 0;
  }
}

