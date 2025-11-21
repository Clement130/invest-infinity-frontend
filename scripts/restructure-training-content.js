import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value;
        }
      }
    });

    return envVars;
  } catch (error) {
    return process.env;
  }
}

function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey =
  env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Impossible de charger les identifiants Supabase (VITE_SUPABASE_URL / SERVICE_ROLE).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const moduleStructures = [
  {
    title: 'Etape 1 - La Fondation',
    description: "C'est ici que tu vas apprendre les bases du trading",
    position: 0,
    lessons: [
      { title: 'La Base du Vocabulaire en Trading', sourceTitles: ['Introduction au Trading'] },
      { title: 'Les Différents Types de Marchés', sourceTitles: ['Analyse Technique de Base'] },
      { title: 'Les Différents Profils en Trading', sourceTitles: ['Breaker'] },
      { title: 'Les Différentes Stratégies En Trading', sourceTitles: ['Structure'] },
      { title: 'Avoir son Money Management', preferNew: true },
      { title: 'Avoir un Track Record & Data', sourceTitles: ['Track Record Data'] },
      { title: 'Faire des Trades Recaps', sourceTitles: ['Trade Recap'] },
      { title: 'La Clé de ton succès se joue ici.' },
    ],
  },
  {
    title: 'Etape 2 - Les Bases en ICT',
    description: "Ici, tu apprendras toutes les bases de l'ICT : Order Block, FVG, et bien plus encore",
    position: 1,
    lessons: [
      { title: 'La Structure de marché', sourceTitles: ['Scalping et Trading Intraday'] },
      { title: 'Le Breaker block & Mitigation block', sourceTitles: ['Swing Trading et Analyse Fondamentale'] },
      { title: 'La FVG', sourceTitles: ['Prendre position MT5'] },
      { title: "L'OB." },
      { title: 'La Liquidité' },
      { title: 'La SMT' },
      { title: 'BreakerAway Gap' },
      { title: 'La IFVG' },
      { title: 'OB sans Corps' },
    ],
  },
  {
    title: 'Etape 3 - La Stratégie ICT Mickael',
    description: 'Ici, tu apprendras la stratégie complète ICT de Mickael avec toutes les techniques avancées',
    position: 2,
    lessons: [
      { title: 'Introduction', sourceTitles: ['Introduction au Trading Algorithmique'] },
      { title: 'Définir mon biais', sourceTitles: ['Création et Backtesting de Stratégies'] },
      { title: 'Définir mes zones' },
      { title: 'Mes confirmations pour prendre position' },
      { title: 'Où TP, SL et BE ?' },
      { title: 'Displacement + création d’une FVG' },
      { title: 'Si Accumulation (je ne la trade que sous condition)' },
    ],
  },
  {
    title: 'MetaTrader & TopStepX',
    description: 'Tutoriels MetaTrader et TopStepX pour les membres ayant débloqué les deux offres',
    position: 3,
    lessons: [
      { title: 'Comment installer son compte MetaTrader ?' },
      { title: 'Comment prendre un Trade sur MetaTrader ?' },
      { title: 'TopStepX - Comment l’utiliser ?' },
    ],
  },
  {
    title: 'Trading View - Outils et Techniques',
    description: 'Module de formation sur Trading View - Outils et Techniques',
    position: 4,
    skipLessonSync: true,
  },
];

async function ensureModule(moduleConfig) {
  const { data: existing, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('title', moduleConfig.title)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('training_modules')
      .update({
        description: moduleConfig.description,
        position: moduleConfig.position,
        is_active: true,
      })
      .eq('id', existing.id);

    if (updateError) {
      throw updateError;
    }

    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from('training_modules')
    .insert({
      title: moduleConfig.title,
      description: moduleConfig.description,
      position: moduleConfig.position,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return created.id;
}

async function syncLessons(moduleId, lessonsConfig) {
  if (!lessonsConfig || lessonsConfig.length === 0) return;

  const { data: existingLessons, error } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  const usedLessons = new Set();
  const normalizedMap = new Map();

  (existingLessons || []).forEach((lesson) => {
    normalizedMap.set(normalize(lesson.title), lesson);
  });

  const findAvailableLesson = (...candidates) => {
    for (const lesson of candidates) {
      if (lesson && !usedLessons.has(lesson.id)) {
        return lesson;
      }
    }
    return undefined;
  };

  for (let i = 0; i < lessonsConfig.length; i++) {
    const config = lessonsConfig[i];
    const normalizedTitle = normalize(config.title);

    const directMatch = normalizedMap.get(normalizedTitle);
    const sourceMatch = (config.sourceTitles || [])
      .map((title) => normalize(title))
      .map((slug) => normalizedMap.get(slug))
      .find(Boolean);
    const fallback = config.preferNew
      ? undefined
      : (existingLessons || []).find((l) => !usedLessons.has(l.id));

    const lesson = findAvailableLesson(directMatch, sourceMatch, fallback);

    if (lesson) {
      const { error: updateError } = await supabase
        .from('training_lessons')
        .update({
          title: config.title,
          description: config.description ?? lesson.description ?? null,
          bunny_video_id:
            typeof config.bunnyVideoId !== 'undefined' ? config.bunnyVideoId : lesson.bunny_video_id,
          position: i,
          is_preview: lesson.is_preview ?? false,
        })
        .eq('id', lesson.id);

      if (updateError) {
        throw updateError;
      }

      usedLessons.add(lesson.id);
    } else {
      const { error: insertError, data: inserted } = await supabase
        .from('training_lessons')
        .insert({
          module_id: moduleId,
          title: config.title,
          description: config.description ?? null,
          bunny_video_id: config.bunnyVideoId ?? null,
          position: i,
          is_preview: false,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (inserted) {
        usedLessons.add(inserted.id);
      }
    }
  }

  const leftovers = (existingLessons || []).filter((lesson) => !usedLessons.has(lesson.id));

  if (leftovers.length > 0) {
    const { error: deleteError } = await supabase
      .from('training_lessons')
      .delete()
      .in(
        'id',
        leftovers.map((lesson) => lesson.id),
      );

    if (deleteError) {
      throw deleteError;
    }
  }
}

async function run() {
  console.log('🔄 Réorganisation des modules et leçons...');

  for (const moduleConfig of moduleStructures) {
    try {
      const moduleId = await ensureModule(moduleConfig);
      console.log(`✅ Module prêt: ${moduleConfig.title}`);

      if (!moduleConfig.skipLessonSync) {
        await syncLessons(moduleId, moduleConfig.lessons || []);
        console.log(`   → Leçons synchronisées (${moduleConfig.lessons.length})`);
      } else {
        console.log('   → Leçons laissées inchangées');
      }
    } catch (error) {
      console.error(`❌ Erreur sur le module "${moduleConfig.title}":`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 Réorganisation terminée avec succès !');
}

run();


