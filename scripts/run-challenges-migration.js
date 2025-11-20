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

async function runMigration() {
  console.log('🚀 Exécution de la migration des défis...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20241120120000_create_challenges_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Contenu de la migration:');
    console.log('   - Création des tables: challenges, challenge_participations, challenge_submissions');
    console.log('   - Création des tables: badges, user_badges');
    console.log('   - Configuration RLS');
    console.log('   - Insertion des badges par défaut\n');

    // Exécuter le SQL via l'API REST de Supabase
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API REST standard
    // On doit utiliser l'endpoint SQL Editor ou une connexion PostgreSQL directe
    
    // Méthode 1: Utiliser l'API REST avec rpc (si une fonction exec_sql existe)
    // Méthode 2: Utiliser fetch vers l'endpoint SQL Editor (nécessite un token spécial)
    // Méthode 3: Utiliser une connexion PostgreSQL directe
    
    // Pour l'instant, on va utiliser l'API REST pour exécuter chaque commande séparément
    // Mais Supabase ne permet pas cela directement...
    
    // La meilleure solution est d'utiliser l'API Management de Supabase
    // ou d'exécuter via psql
    
    console.log('⚠️  Supabase ne permet pas d\'exécuter du SQL arbitraire via l\'API REST standard.');
    console.log('📝 Utilisation de l\'API Management de Supabase...\n');

    // Extraire le project ref depuis l'URL
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      console.error('❌ Impossible d\'extraire le project ref depuis VITE_SUPABASE_URL');
      process.exit(1);
    }

    // Utiliser l'API Management de Supabase pour exécuter le SQL
    // Note: Cela nécessite un access token Supabase Management API
    // Pour l'instant, on va afficher les instructions
    
    console.log('💡 Pour exécuter la migration automatiquement, vous avez deux options:\n');
    console.log('📋 Option 1: Via Supabase Dashboard (Recommandé)');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans SQL Editor');
    console.log('   4. Copiez-colle le contenu du fichier:');
    console.log('      supabase/migrations/20241120120000_create_challenges_tables.sql');
    console.log('   5. Cliquez sur "Run"\n');
    
    console.log('📋 Option 2: Via script Node.js avec connexion PostgreSQL directe');
    console.log('   1. Récupérez votre connection string depuis Supabase Dashboard > Settings > Database');
    console.log('   2. Ajoutez-la dans .env.local comme: DATABASE_URL=postgresql://...');
    console.log('   3. Exécutez: node scripts/run-challenges-migration-direct.js\n');

    // Afficher le SQL pour référence
    console.log('📝 SQL à exécuter:\n');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

    // Vérifier si les tables existent déjà
    console.log('\n🔍 Vérification de l\'existence des tables...\n');
    
    const { data: challengesCheck, error: challengesError } = await supabase
      .from('challenges')
      .select('id')
      .limit(1);

    if (!challengesError) {
      console.log('✅ La table "challenges" existe déjà.');
      console.log('⚠️  La migration a peut-être déjà été exécutée.\n');
    } else {
      console.log('❌ La table "challenges" n\'existe pas encore.');
      console.log('📝 Vous devez exécuter la migration SQL.\n');
    }

    console.log('✅ Instructions affichées. Veuillez suivre l\'une des options ci-dessus.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

runMigration();

