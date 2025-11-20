import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
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
    return process.env;
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Organisation des vidéos par module/thème
const videoMapping = {
  // Module: Les Bases du Trading
  'Les Bases du Trading': [
    { title: 'Breaker', videoId: '8dcf803c-ccc6-4f6d-9d93-4f4ccdc0d908', description: 'Comprendre les breakers en trading', position: 3, isPreview: false },
    { title: 'Structure', videoId: 'a14be160-90fa-4ddd-a3ab-aad23a47f36b', description: 'Analyser la structure du marché', position: 4, isPreview: false },
    { title: 'Track Record Data', videoId: 'dbf2b57b-8b32-483f-89c4-ccd994e86e1d', description: 'Suivre et analyser les performances', position: 5, isPreview: false },
    { title: 'Trade Recap', videoId: 'd2ef6154-16ca-46f4-bf56-6f47c738d143', description: 'Récapitulatif de trade', position: 6, isPreview: false },
  ],
  
  // Module: Stratégies Avancées
  'Stratégies Avancées': [
    { title: 'Prendre position MT5', videoId: '8254f866-0ab0-498c-b1fe-5ef2b66a2ab8', description: 'Comment prendre une position sur MetaTrader 5', position: 3, isPreview: false },
  ],
  
  // Nouveau module: Trading View - Outils et Techniques
  'Trading View - Outils et Techniques': [
    { title: 'Actif - Trading View', videoId: '1b4b4891-d60c-4644-bfa3-7de80c950e8a', description: 'Sélectionner un actif sur Trading View', position: 1, isPreview: true },
    { title: 'Faire zoom - Trading View', videoId: '3b574bdc-4c55-414a-8028-a4733e13ebc9', description: 'Utiliser le zoom sur Trading View', position: 2, isPreview: false },
    { title: 'Fait 2 écran - Trading View', videoId: '03f94cf1-205a-41d5-81a6-cca3d6d76da2', description: 'Configurer deux écrans sur Trading View', position: 3, isPreview: false },
    { title: 'Fait Backtest - Trading View', videoId: '1c1129c4-df13-4973-8c4e-c7aa4c9d01b4', description: 'Effectuer un backtest sur Trading View', position: 4, isPreview: false },
    { title: 'Fait capture - Trading View', videoId: '86b787f6-7012-40cd-b98d-9bd2940b4165', description: 'Prendre des captures d\'écran sur Trading View', position: 5, isPreview: false },
    { title: 'Fait Fond - Trading View', videoId: '03d84e9e-f51a-45df-b2e0-96fe4107fd1c', description: 'Configurer le fond sur Trading View', position: 6, isPreview: false },
    { title: 'Fait indic - Trading View', videoId: '99bd5c2c-8c7c-4d9d-98ee-d3f40cf0e4cd', description: 'Ajouter des indicateurs sur Trading View', position: 7, isPreview: false },
    { title: 'Outil en fav - Trading View', videoId: '23fbc623-7626-4c1f-8c85-8b5c568cb7fa', description: 'Mettre des outils en favoris sur Trading View', position: 8, isPreview: false },
    { title: 'Plan future - Trading View', videoId: 'b1a00800-5650-4557-a3c6-31adcfc98a1e', description: 'Planifier des trades futurs sur Trading View', position: 9, isPreview: false },
    { title: 'Supprimer - Trading View', videoId: 'a65a03c6-eb43-43a4-9050-789a482ffb06', description: 'Supprimer des éléments sur Trading View', position: 10, isPreview: false },
    { title: 'Tracer ligne - Trading View', videoId: '0f4ec3c0-2437-4996-be13-81c72f528fc7', description: 'Tracer des lignes sur Trading View', position: 11, isPreview: false },
    { title: 'UT - Trading View', videoId: 'f24ac09e-5055-4d4a-ac8f-85e47a2f3b8b', description: 'Utiliser les outils UT sur Trading View', position: 12, isPreview: false },
  ],
};

async function addVideosToSite() {
  console.log('🎬 Ajout des vidéos Bunny Stream au site...\n');

  try {
    // Récupérer les modules existants
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title')
      .order('position');

    if (modulesError) {
      console.error('❌ Erreur lors de la récupération des modules:', modulesError);
      return;
    }

    console.log(`✅ ${modules.length} module(s) trouvé(s)\n`);

    // Récupérer les leçons existantes pour éviter les doublons
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('bunny_video_id');

    if (lessonsError) {
      console.error('❌ Erreur lors de la récupération des leçons:', lessonsError);
      return;
    }

    const existingVideoIds = new Set(
      (existingLessons || [])
        .map(l => l.bunny_video_id)
        .filter(Boolean)
    );

    console.log(`📋 ${existingVideoIds.size} vidéo(s) déjà présente(s) dans la base\n`);

    let totalAdded = 0;
    let totalSkipped = 0;

    // Parcourir chaque module et ajouter les vidéos
    for (const [moduleTitle, videos] of Object.entries(videoMapping)) {
      // Trouver ou créer le module
      let module = modules.find(m => m.title === moduleTitle);
      
      if (!module) {
        console.log(`📦 Création du module: ${moduleTitle}`);
        const { data: newModule, error: createError } = await supabase
          .from('training_modules')
          .insert({
            title: moduleTitle,
            description: `Module de formation sur ${moduleTitle}`,
            position: modules.length + 1,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ Erreur lors de la création du module ${moduleTitle}:`, createError);
          continue;
        }

        module = newModule;
        modules.push(module);
        console.log(`✅ Module créé: ${module.id}\n`);
      } else {
        console.log(`📂 Module existant: ${moduleTitle} (${module.id})\n`);
      }

      // Ajouter les vidéos au module
      for (const video of videos) {
        // Vérifier si la vidéo existe déjà
        if (existingVideoIds.has(video.videoId)) {
          console.log(`⏭️  Vidéo déjà présente: ${video.title} (${video.videoId})`);
          totalSkipped++;
          continue;
        }

        console.log(`➕ Ajout de la leçon: ${video.title}`);
        const { data: lesson, error: lessonError } = await supabase
          .from('training_lessons')
          .insert({
            module_id: module.id,
            title: video.title,
            description: video.description,
            bunny_video_id: video.videoId,
            position: video.position,
            is_preview: video.isPreview,
          })
          .select()
          .single();

        if (lessonError) {
          console.error(`❌ Erreur lors de l'ajout de ${video.title}:`, lessonError);
          continue;
        }

        console.log(`✅ Leçon ajoutée: ${lesson.id}\n`);
        totalAdded++;
        existingVideoIds.add(video.videoId);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`   ✅ ${totalAdded} leçon(s) ajoutée(s)`);
    console.log(`   ⏭️  ${totalSkipped} leçon(s) déjà présente(s)`);
    console.log('\n✨ Terminé !');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

addVideosToSite();

