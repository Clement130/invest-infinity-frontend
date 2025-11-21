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
      // Mettre à jour last_viewed si pas déjà marqué comme vue
      if (!existing.last_viewed) {
        const { error } = await supabase
          .from('training_progress')
          .update({
            last_viewed: now,
          })
          .eq('id', existing.id);

        if (error) throw error;
      }
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
  private updateThrottle: number = 5000; // Mettre à jour max toutes les 5 secondes

  constructor(userId: string, lessonId: string) {
    this.userId = userId;
    this.lessonId = lessonId;
  }

  /**
   * Traite un événement de progression vidéo
   */
  async handleProgress(event: VideoProgressEvent): Promise<void> {
    const now = Date.now();

    // Throttle : ne pas mettre à jour trop souvent
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }

    this.lastUpdateTime = now;

    // Marquer comme "vue" si le seuil est atteint
    if (!this.hasBeenViewed && event.currentTime >= VIEWED_THRESHOLD_SECONDS) {
      this.hasBeenViewed = true;
      await markLessonAsViewed(this.userId, this.lessonId);
    }

    // Marquer comme "complétée" si le seuil est atteint
    if (!this.hasBeenCompleted && event.percentage >= COMPLETED_THRESHOLD_PERCENTAGE) {
      this.hasBeenCompleted = true;
      await markLessonAsCompleted(this.userId, this.lessonId);
    }
  }

  /**
   * Réinitialise le tracker (utile si l'utilisateur recharge la page)
   */
  reset(): void {
    this.hasBeenViewed = false;
    this.hasBeenCompleted = false;
    this.lastUpdateTime = 0;
  }
}

