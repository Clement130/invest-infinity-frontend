import { supabase } from '../lib/supabaseClient';
import type {
  TrainingModule,
  TrainingLesson,
  TrainingAccess,
  ModuleWithLessons,
  LessonWithModule,
  AccessType,
} from '../types/training';
import type { Tables } from '../types/supabase';

type TrainingAccessRow = Tables<'training_access'>;

const ACCESS_TYPES: AccessType[] = ['full', 'trial', 'preview'];

const normalizeAccessType = (value: string | null | undefined): AccessType => {
  if (value && ACCESS_TYPES.includes(value as AccessType)) {
    return value as AccessType;
  }
  return 'full';
};

const mapTrainingAccess = (row: TrainingAccessRow): TrainingAccess => ({
  ...row,
  access_type: normalizeAccessType(row.access_type),
});

export async function getModules(options?: {
  includeInactive?: boolean;
}): Promise<TrainingModule[]> {
  try {
    console.log('[trainingService] getModules appelé, options:', options);
    
    // Timeout de 10 secondes pour éviter l'attente infinie
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: récupération des modules trop longue')), 10000);
    });

    let query = supabase
      .from('training_modules')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
    }

    const queryPromise = query;
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('[trainingService] Erreur lors de la récupération des modules:', error);
      console.error('[trainingService] Code erreur:', error.code);
      console.error('[trainingService] Message:', error.message);
      console.error('[trainingService] Détails:', error.details);
      console.error('[trainingService] Hint:', error.hint);
      
      // Si c'est une erreur RLS, on retourne un tableau vide au lieu de throw
      // pour éviter de bloquer l'interface
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.warn('[trainingService] Erreur RLS détectée, retour d\'un tableau vide');
        return [];
      }
      
      throw error;
    }

    console.log('[trainingService] Modules récupérés:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('[trainingService] Modules:', data.map(m => ({ id: m.id, title: m.title, is_active: m.is_active })));
    }
    
    return data ?? [];
  } catch (err: any) {
    console.error('[trainingService] Exception dans getModules:', err);
    
    // Retourner un tableau vide pour toutes les erreurs pour éviter de bloquer l'interface
    // Les erreurs sont déjà loggées pour le débogage
    if (err.message?.includes('Timeout')) {
      console.error('[trainingService] Timeout: la récupération des modules a pris plus de 10 secondes');
    }
    
    return [];
  }
}

export async function getActiveModules(): Promise<TrainingModule[]> {
  return getModules();
}

export async function getModuleById(id: string): Promise<TrainingModule | null> {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur lors de la récupération du module:', error);
    throw error;
  }

  return data ?? null;
}

export async function getLessonsForModule(moduleId: string): Promise<TrainingLesson[]> {
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

  return data ?? [];
}

export async function getLessonsWithModules(): Promise<LessonWithModule[]> {
  const { data, error } = await supabase
    .from('training_lessons')
    .select('*, module:module_id(*)')
    .order('module_id', { ascending: true })
    .order('position', { ascending: true });

  if (error) {
    console.error('[trainingService] Erreur lors de la récupération des leçons avec modules:', error);
    throw error;
  }

  return (
    data?.map((lesson: any) => ({
      ...lesson,
      module: lesson.module,
    })) ?? []
  ) as LessonWithModule[];
}

export async function getLessonById(id: string): Promise<TrainingLesson | null> {
  const { data, error } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur lors de la récupération de la leçon:', error);
    throw error;
  }

  return data ?? null;
}

export async function getModuleWithLessons(
  moduleId: string
): Promise<ModuleWithLessons | null> {
  const [module, lessons] = await Promise.all([
    getModuleById(moduleId),
    getLessonsForModule(moduleId),
  ]);

  if (!module) {
    return null;
  }

  return {
    module,
    lessons,
  };
}

export async function getAccessibleModulesForUser(
  userId: string
): Promise<TrainingModule[]> {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*, training_access!inner(user_id)')
    .eq('training_access.user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des modules accessibles:', error);
    throw error;
  }

  type ModuleWithJoin = TrainingModule & { training_access: { user_id: string }[] };

  return ((data as ModuleWithJoin[] | null) ?? []).map(({ training_access, ...module }) => module);
}

export async function createOrUpdateModule(
  payload: Partial<TrainingModule> & { title: string }
): Promise<TrainingModule> {
  const base = {
    title: payload.title,
    description: payload.description ?? null,
    position: payload.position ?? 0,
    is_active: payload.is_active ?? true,
    required_license: payload.required_license ?? 'starter',
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from('training_modules')
      .update(base)
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du module:', error);
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from('training_modules')
    .insert(base)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du module:', error);
    throw error;
  }

  return data;
}

export async function deleteModule(id: string): Promise<void> {
  // Supprimer d'abord les leçons associées
  const { error: lessonsError } = await supabase
    .from('training_lessons')
    .delete()
    .eq('module_id', id);

  if (lessonsError) {
    console.error('Erreur lors de la suppression des leçons:', lessonsError);
    throw lessonsError;
  }

  // Ensuite supprimer le module
  const { error: moduleError } = await supabase
    .from('training_modules')
    .delete()
    .eq('id', id);

  if (moduleError) {
    console.error('Erreur lors de la suppression du module:', moduleError);
    throw moduleError;
  }
}

export async function createOrUpdateLesson(
  payload: Partial<TrainingLesson> & { title: string; module_id: string }
): Promise<TrainingLesson> {
  const base = {
    title: payload.title,
    module_id: payload.module_id,
    description: payload.description ?? null,
    bunny_video_id: payload.bunny_video_id ?? null,
    position: payload.position ?? 0,
    is_preview: payload.is_preview ?? false,
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from('training_lessons')
      .update(base)
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la leçon:', error);
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from('training_lessons')
    .insert(base)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la leçon:', error);
    throw error;
  }

  return data;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from('training_lessons').delete().eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression de la leçon:', error);
    throw error;
  }
}

export async function getAccessList(): Promise<TrainingAccess[]> {
  const { data, error } = await supabase
    .from('training_access')
    .select('*')
    .order('granted_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des accès:', error);
    throw error;
  }

  return (data ?? []).map(mapTrainingAccess);
}

export async function grantAccess(
  userId: string,
  moduleId: string,
  accessType: AccessType = 'full'
): Promise<TrainingAccess> {
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
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('training_access')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existing) {
        return mapTrainingAccess(existing);
      }
    }

    console.error('Erreur lors de l\'attribution de l\'accès:', error);
    throw error;
  }

  return mapTrainingAccess(data);
}

export async function revokeAccess(accessId: string): Promise<void> {
  const { error } = await supabase.from('training_access').delete().eq('id', accessId);

  if (error) {
    console.error('Erreur lors de la révocation de l\'accès:', error);
    throw error;
  }
}

