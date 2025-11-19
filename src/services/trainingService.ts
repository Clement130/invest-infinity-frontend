import { supabase } from '../lib/supabaseClient';
import type {
  TrainingModule,
  TrainingLesson,
  TrainingAccess,
  ModuleWithLessons,
} from '../types/training';

/**
 * Récupère tous les modules actifs, triés par position puis date de création
 */
export async function getActiveModules(): Promise<TrainingModule[]> {
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des modules actifs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getActiveModules:', error);
    throw error;
  }
}

/**
 * Récupère un module par son ID
 */
export async function getModuleById(id: string): Promise<TrainingModule | null> {
  try {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun résultat trouvé
        return null;
      }
      console.error('Erreur lors de la récupération du module:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erreur dans getModuleById:', error);
    throw error;
  }
}

/**
 * Récupère toutes les leçons d'un module, triées par position puis date de création
 */
export async function getLessonsForModule(moduleId: string): Promise<TrainingLesson[]> {
  try {
    const { data, error } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des leçons:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getLessonsForModule:', error);
    throw error;
  }
}

/**
 * Récupère une leçon par son ID
 */
export async function getLessonById(id: string): Promise<TrainingLesson | null> {
  try {
    const { data, error } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun résultat trouvé
        return null;
      }
      console.error('Erreur lors de la récupération de la leçon:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erreur dans getLessonById:', error);
    throw error;
  }
}

/**
 * Récupère un module avec toutes ses leçons
 */
export async function getModuleWithLessons(
  moduleId: string
): Promise<ModuleWithLessons | null> {
  try {
    const module = await getModuleById(moduleId);
    if (!module) {
      return null;
    }

    const lessons = await getLessonsForModule(moduleId);

    return {
      module,
      lessons,
    };
  } catch (error) {
    console.error('Erreur dans getModuleWithLessons:', error);
    throw error;
  }
}

/**
 * Récupère les modules auxquels un utilisateur a accès
 */
export async function getAccessibleModulesForUser(
  userId: string
): Promise<TrainingModule[]> {
  try {
    // Récupérer les accès de l'utilisateur
    const { data: accessList, error: accessError } = await supabase
      .from('training_access')
      .select('module_id')
      .eq('user_id', userId);

    if (accessError) {
      console.error('Erreur lors de la récupération des accès:', accessError);
      throw accessError;
    }

    if (!accessList || accessList.length === 0) {
      return [];
    }

    // Extraire les IDs des modules
    const moduleIds = accessList.map((access) => access.module_id);

    // Récupérer les modules correspondants
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('*')
      .in('id', moduleIds)
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (modulesError) {
      console.error('Erreur lors de la récupération des modules accessibles:', modulesError);
      throw modulesError;
    }

    return modules || [];
  } catch (error) {
    console.error('Erreur dans getAccessibleModulesForUser:', error);
    throw error;
  }
}

// ==================== FONCTIONS ADMIN ====================

/**
 * Crée ou met à jour un module
 */
export async function createOrUpdateModule(
  payload: Partial<TrainingModule> & { title: string }
): Promise<TrainingModule> {
  try {
    if (payload.id) {
      // Mise à jour
      const { data, error } = await supabase
        .from('training_modules')
        .update({
          title: payload.title,
          description: payload.description ?? null,
          position: payload.position ?? 0,
          is_active: payload.is_active ?? true,
        })
        .eq('id', payload.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du module:', error);
        throw error;
      }

      return data;
    } else {
      // Création
      const { data, error } = await supabase
        .from('training_modules')
        .insert({
          title: payload.title,
          description: payload.description ?? null,
          position: payload.position ?? 0,
          is_active: payload.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du module:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Erreur dans createOrUpdateModule:', error);
    throw error;
  }
}

/**
 * Supprime un module (cascade supprimera aussi les leçons)
 */
export async function deleteModule(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('training_modules').delete().eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du module:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans deleteModule:', error);
    throw error;
  }
}

/**
 * Crée ou met à jour une leçon
 */
export async function createOrUpdateLesson(
  payload: Partial<TrainingLesson> & { title: string; module_id: string }
): Promise<TrainingLesson> {
  try {
    if (payload.id) {
      // Mise à jour
      const { data, error } = await supabase
        .from('training_lessons')
        .update({
          title: payload.title,
          description: payload.description ?? null,
          bunny_video_id: payload.bunny_video_id ?? null,
          position: payload.position ?? 0,
          is_preview: payload.is_preview ?? false,
        })
        .eq('id', payload.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour de la leçon:', error);
        throw error;
      }

      return data;
    } else {
      // Création
      const { data, error } = await supabase
        .from('training_lessons')
        .insert({
          title: payload.title,
          module_id: payload.module_id,
          description: payload.description ?? null,
          bunny_video_id: payload.bunny_video_id ?? null,
          position: payload.position ?? 0,
          is_preview: payload.is_preview ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la leçon:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Erreur dans createOrUpdateLesson:', error);
    throw error;
  }
}

/**
 * Supprime une leçon
 */
export async function deleteLesson(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('training_lessons').delete().eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression de la leçon:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans deleteLesson:', error);
    throw error;
  }
}

/**
 * Récupère la liste complète des accès
 */
export async function getAccessList(): Promise<TrainingAccess[]> {
  try {
    const { data, error } = await supabase
      .from('training_access')
      .select('*')
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération de la liste des accès:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getAccessList:', error);
    throw error;
  }
}

/**
 * Accorde un accès à un utilisateur pour un module
 */
export async function grantAccess(
  userId: string,
  moduleId: string,
  accessType: string = 'full'
): Promise<TrainingAccess> {
  try {
    const { data, error } = await supabase
      .from('training_access')
      .insert({
        user_id: userId,
        module_id: moduleId,
        access_type: accessType,
      })
      .select()
      .single();

    if (error) {
      // Si l'erreur est due à une contrainte unique (accès déjà existant), on peut soit throw, soit retourner l'existant
      if (error.code === '23505') {
        // Contrainte unique violée - l'accès existe déjà
        const { data: existing } = await supabase
          .from('training_access')
          .select('*')
          .eq('user_id', userId)
          .eq('module_id', moduleId)
          .single();

        if (existing) {
          return existing;
        }
      }
      console.error('Erreur lors de l\'attribution de l\'accès:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erreur dans grantAccess:', error);
    throw error;
  }
}

/**
 * Révoque un accès
 */
export async function revokeAccess(accessId: string): Promise<void> {
  try {
    const { error } = await supabase.from('training_access').delete().eq('id', accessId);

    if (error) {
      console.error('Erreur lors de la révocation de l\'accès:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans revokeAccess:', error);
    throw error;
  }
}

