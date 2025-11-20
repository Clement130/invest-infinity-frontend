import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement depuis .env.local
// Solution simple sans dotenv : lire le fichier directement
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
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
    // Si .env.local n'existe pas, utiliser process.env
    return process.env;
  }
}

const env = loadEnv();

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini dans .env.local');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini dans .env.local');
  console.error('📝 Récupérez la clé depuis : Supabase Dashboard > Settings > API > service_role key');
  console.error('📝 Ajoutez-la dans .env.local : VITE_SUPABASE_SERVICE_ROLE_KEY=votre_cle_ici');
  process.exit(1);
}

// Créer le client Supabase avec service_role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Données à insérer (hardcodées depuis le SQL)
const seedData = {
  modules: [
    {
      title: 'Les Bases du Trading',
      description: 'Module d\'introduction au trading pour débutants. Apprenez les fondamentaux : analyse technique, gestion du risque, et psychologie du trader. Niveau : Débutant | Prix : Gratuit',
      position: 1,
      is_active: true,
      lessons: [
        {
          title: 'Introduction au Trading',
          description: 'Découvrez les concepts fondamentaux du trading : qu\'est-ce que le trading, les différents marchés financiers, et comment commencer votre parcours.',
          bunny_video_id: '9295490a-0072-4752-996d-6f573306318b',
          position: 1,
          is_preview: true,
        },
        {
          title: 'Analyse Technique de Base',
          description: 'Apprenez à lire les graphiques, identifier les tendances, et utiliser les indicateurs techniques essentiels pour prendre vos premières décisions.',
          bunny_video_id: 'test-video-2',
          position: 2,
          is_preview: false,
        },
      ],
    },
    {
      title: 'Stratégies Avancées',
      description: 'Approfondissez vos connaissances avec des stratégies de trading avancées : scalping, swing trading, et analyse fondamentale. Niveau : Intermédiaire | Prix : 297€',
      position: 2,
      is_active: true,
      lessons: [
        {
          title: 'Scalping et Trading Intraday',
          description: 'Maîtrisez les techniques de scalping et de trading intraday pour capturer les mouvements de prix à court terme avec précision.',
          bunny_video_id: 'test-video-3',
          position: 1,
          is_preview: false,
        },
        {
          title: 'Swing Trading et Analyse Fondamentale',
          description: 'Développez vos compétences en swing trading en combinant analyse technique et fondamentale pour des positions à moyen terme.',
          bunny_video_id: 'test-video-4',
          position: 2,
          is_preview: false,
        },
      ],
    },
    {
      title: 'Trading Algorithmique',
      description: 'Passez au niveau supérieur avec le trading algorithmique : création de bots, backtesting, et optimisation de stratégies automatisées. Niveau : Expert | Prix : 597€',
      position: 3,
      is_active: true,
      lessons: [
        {
          title: 'Introduction au Trading Algorithmique',
          description: 'Découvrez les concepts du trading algorithmique : APIs, connexions aux brokers, et architecture d\'un système de trading automatisé.',
          bunny_video_id: 'test-video-5',
          position: 1,
          is_preview: false,
        },
        {
          title: 'Création et Backtesting de Stratégies',
          description: 'Apprenez à développer vos propres stratégies automatisées, les tester sur des données historiques, et optimiser leurs paramètres.',
          bunny_video_id: 'test-video-6',
          position: 2,
          is_preview: false,
        },
      ],
    },
  ],
};

async function executeSeed() {
  try {
    console.log('🚀 Début de l\'insertion des données de test...\n');

    let totalModules = 0;
    let totalLessons = 0;

    for (const moduleData of seedData.modules) {
      const { lessons, ...moduleFields } = moduleData;
      
      console.log(`📦 Création du module: ${moduleFields.title}`);
      
      // Vérifier si le module existe déjà
      const { data: existingModule } = await supabase
        .from('training_modules')
        .select('id')
        .eq('title', moduleFields.title)
        .maybeSingle();

      let moduleId;
      
      if (existingModule) {
        console.log(`   ⚠️  Module déjà existant, mise à jour...`);
        const { data: updatedModule, error: updateError } = await supabase
          .from('training_modules')
          .update(moduleFields)
          .eq('id', existingModule.id)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour du module: ${updateError.message}`);
        }
        moduleId = updatedModule.id;
      } else {
        const { data: newModule, error: insertError } = await supabase
          .from('training_modules')
          .insert(moduleFields)
          .select()
          .single();

        if (insertError) {
          throw new Error(`Erreur lors de la création du module: ${insertError.message}`);
        }
        moduleId = newModule.id;
      }

      totalModules++;

      // Créer les leçons pour ce module
      for (const lessonData of lessons) {
        console.log(`   📚 Création de la leçon: ${lessonData.title}`);
        
        // Vérifier si la leçon existe déjà
        const { data: existingLesson } = await supabase
          .from('training_lessons')
          .select('id')
          .eq('module_id', moduleId)
          .eq('title', lessonData.title)
          .maybeSingle();

        if (existingLesson) {
          console.log(`      ⚠️  Leçon déjà existante, mise à jour...`);
          const { error: updateError } = await supabase
            .from('training_lessons')
            .update({
              ...lessonData,
              module_id: moduleId,
            })
            .eq('id', existingLesson.id);

          if (updateError) {
            throw new Error(`Erreur lors de la mise à jour de la leçon: ${updateError.message}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from('training_lessons')
            .insert({
              ...lessonData,
              module_id: moduleId,
            });

          if (insertError) {
            throw new Error(`Erreur lors de la création de la leçon: ${insertError.message}`);
          }
        }
        
        totalLessons++;
      }
      
      console.log('');
    }

    console.log('✅ Données de test créées avec succès !\n');
    console.log(`📊 Résumé:`);
    console.log(`   - ${totalModules} module(s) créé(s)`);
    console.log(`   - ${totalLessons} leçon(s) créée(s)\n`);

    // Vérifier que les données ont été créées
    console.log('🔍 Vérification des données...');
    await verifyData();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Vérifiez que:');
    console.error('   1. VITE_SUPABASE_URL est correct dans .env.local');
    console.error('   2. VITE_SUPABASE_SERVICE_ROLE_KEY est correct dans .env.local');
    console.error('   3. Les tables training_modules et training_lessons existent dans Supabase');
    process.exit(1);
  }
}

async function verifyData() {
  try {
    // Vérifier les modules
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, position')
      .order('position');

    if (modulesError) {
      console.error('⚠️  Erreur lors de la vérification des modules:', modulesError.message);
      return;
    }

    console.log(`✅ Modules dans la base : ${modules?.length || 0}`);
    modules?.forEach(module => {
      console.log(`   - ${module.title} (position: ${module.position})`);
    });

    // Vérifier les leçons
    const { data: lessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, module_id, position')
      .order('position');

    if (lessonsError) {
      console.error('⚠️  Erreur lors de la vérification des leçons:', lessonsError.message);
      return;
    }

    console.log(`✅ Leçons dans la base : ${lessons?.length || 0}`);
    
    // Grouper par module
    const lessonsByModule = {};
    lessons?.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = [];
      }
      lessonsByModule[lesson.module_id].push(lesson.title);
    });

    Object.values(lessonsByModule).forEach((moduleLessons, index) => {
      console.log(`   Module ${index + 1}: ${moduleLessons.length} leçon(s)`);
    });

    console.log('\n🎉 Vérification terminée !');

  } catch (error) {
    console.error('⚠️  Erreur lors de la vérification:', error.message);
  }
}

// Exécuter le script
executeSeed();
