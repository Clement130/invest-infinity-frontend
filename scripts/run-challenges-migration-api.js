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

// Extraire le project ref depuis l'URL
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Impossible d\'extraire le project ref depuis VITE_SUPABASE_URL');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Exécution de la migration des défis via API Supabase...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20241120120000_create_challenges_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Tentative d\'exécution via API Supabase Management...\n');

    // Utiliser l'API Management de Supabase pour exécuter le SQL
    // Note: Cela nécessite un access token Supabase Management API
    // Pour l'instant, on va utiliser l'API REST standard avec une approche différente
    
    // Méthode: Exécuter le SQL via l'endpoint SQL Editor de Supabase
    // L'endpoint est: https://api.supabase.com/v1/projects/{project_ref}/sql
    
    // Mais cela nécessite un access token Supabase Management API
    // On va plutôt utiliser une approche avec des requêtes REST individuelles
    
    console.log('⚠️  L\'API REST standard de Supabase ne permet pas d\'exécuter du SQL arbitraire.');
    console.log('📝 Utilisation d\'une méthode alternative...\n');

    // Créer le client Supabase avec service_role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Vérifier si les tables existent déjà
    console.log('🔍 Vérification de l\'existence des tables...\n');
    
    const { data: challengesCheck, error: challengesError } = await supabase
      .from('challenges')
      .select('id')
      .limit(1);

    if (!challengesError) {
      console.log('✅ La table "challenges" existe déjà.');
      console.log('⚠️  La migration a peut-être déjà été exécutée.\n');
      console.log('💡 Si vous voulez réexécuter la migration, supprimez d\'abord les tables existantes.\n');
      return;
    }

    // Les tables n'existent pas, on doit exécuter la migration
    console.log('❌ Les tables n\'existent pas encore.');
    console.log('📝 Exécution de la migration...\n');

    // Essayer d'exécuter le SQL via l'API REST
    // On va diviser le SQL en commandes individuelles et les exécuter
    
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API REST
    // Il faut utiliser soit:
    // 1. Le Dashboard SQL Editor (manuel)
    // 2. Une connexion PostgreSQL directe (psql ou pg)
    // 3. L'API Management de Supabase (nécessite un access token)
    
    console.log('💡 Pour exécuter la migration, vous avez deux options:\n');
    console.log('📋 Option 1: Via Supabase Dashboard (Recommandé - Le plus simple)');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans SQL Editor (menu de gauche)');
    console.log('   4. Copiez-colle le contenu du fichier:');
    console.log('      supabase/migrations/20241120120000_create_challenges_tables.sql');
    console.log('   5. Cliquez sur "Run" (ou Ctrl+Enter)\n');
    
    console.log('📋 Option 2: Via script Node.js avec connexion PostgreSQL directe');
    console.log('   1. Récupérez votre connection string depuis Supabase Dashboard > Settings > Database');
    console.log('   2. Copiez la "Connection string" (URI mode)');
    console.log('   3. Ajoutez-la dans .env.local comme: DATABASE_URL=postgresql://...');
    console.log('   4. Exécutez: node scripts/run-challenges-migration-direct.js\n');

    // Afficher le SQL pour référence
    console.log('📝 SQL à exécuter:\n');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n✅ Instructions affichées ci-dessus.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

runMigration();

