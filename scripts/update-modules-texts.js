import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement depuis .env.local
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

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini dans .env.local');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini dans .env.local');
  process.exit(1);
}

// Créer le client Supabase avec service_role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Nouveaux textes basés sur la deuxième image
const modulesToUpdate = [
  {
    title: 'Etape 1 - La Fondation',
    description: 'C\'est ici que tu vas apprendre les bases du trading',
    position: 0,
  },
  {
    title: 'Etape 2 - Les Bases en ICT',
    description: 'Ici, tu apprendras toutes les bases de l\'ICT : Order Block, FVG, et bien plus encore',
    position: 1,
  },
  {
    title: 'Etape 3 - La Stratégie ICT Mickael',
    description: 'Ici, tu apprendras la stratégie complète ICT de Mickael avec toutes les techniques avancées',
    position: 2,
  },
];

async function updateModules() {
  console.log('🔄 Mise à jour des textes des modules...\n');

  try {
    // Récupérer tous les modules existants
    const { data: existingModules, error: fetchError } = await supabase
      .from('training_modules')
      .select('*')
      .order('position', { ascending: true });

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des modules:', fetchError);
      process.exit(1);
    }

    console.log(`📋 Modules existants: ${existingModules?.length || 0}\n`);

    // Mettre à jour ou créer les modules
    for (let i = 0; i < modulesToUpdate.length; i++) {
      const moduleData = modulesToUpdate[i];
      const existingModule = existingModules?.[i];

      if (existingModule) {
        // Mettre à jour le module existant
        console.log(`📝 Mise à jour du module ${i + 1}: "${existingModule.title}"`);
        console.log(`   → Nouveau titre: "${moduleData.title}"`);
        console.log(`   → Nouvelle description: "${moduleData.description}"`);

        const { data: updatedModule, error: updateError } = await supabase
          .from('training_modules')
          .update({
            title: moduleData.title,
            description: moduleData.description,
            position: moduleData.position,
          })
          .eq('id', existingModule.id)
          .select()
          .single();

        if (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour:`, updateError);
        } else {
          console.log(`   ✅ Module mis à jour avec succès\n`);
        }
      } else {
        // Créer un nouveau module
        console.log(`➕ Création du module ${i + 1}: "${moduleData.title}"`);

        const { data: newModule, error: createError } = await supabase
          .from('training_modules')
          .insert({
            title: moduleData.title,
            description: moduleData.description,
            position: moduleData.position,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Erreur lors de la création:`, createError);
        } else {
          console.log(`   ✅ Module créé avec succès\n`);
        }
      }
    }

    console.log('✅ Mise à jour terminée !');
    console.log('\n📊 Résumé:');
    console.log('   - Les textes des modules ont été mis à jour');
    console.log('   - Le design des cartes reste inchangé (simple, sans header graphique)');
    console.log('   - Les modules sont maintenant:');
    modulesToUpdate.forEach((m, i) => {
      console.log(`     ${i + 1}. ${m.title}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateModules();

