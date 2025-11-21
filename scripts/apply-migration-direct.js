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
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

async function applyMigration() {
  console.log('🔧 Application de la migration is_admin pour developer...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250122000001_update_is_admin_for_developer.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Extraire juste le CREATE OR REPLACE FUNCTION
    const functionSQL = migrationSQL
      .split('CREATE OR REPLACE FUNCTION')[1]
      .split('commit;')[0]
      .trim();

    console.log('📝 Exécution de la migration SQL...\n');

    // Utiliser l'API REST Supabase pour exécuter le SQL
    // Note: L'API Supabase ne permet pas d'exécuter du SQL arbitraire directement
    // Il faut utiliser pg_rest ou l'API Management
    
    // Pour l'instant, on va utiliser une requête RPC si elle existe
    // Sinon, on va créer la fonction via une requête directe
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    });

    if (response.ok) {
      console.log('✅ Migration appliquée avec succès !\n');
    } else {
      // Si RPC n'existe pas, on affiche les instructions
      console.log('⚠️  L\'API RPC exec_sql n\'est pas disponible');
      console.log('   La migration doit être exécutée manuellement\n');
      console.log('📋 Instructions:');
      console.log('1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new');
      console.log('2. Copiez-collez ce SQL:');
      console.log('─'.repeat(60));
      console.log(migrationSQL);
      console.log('─'.repeat(60));
      console.log('3. Cliquez sur "Run"\n');
    }

  } catch (error) {
    console.log('⚠️  Impossible d\'appliquer la migration automatiquement');
    console.log('   La migration doit être exécutée manuellement\n');
    console.log('📋 Instructions:');
    console.log('1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new');
    console.log('2. Copiez-collez le contenu de: supabase/migrations/20250122000001_update_is_admin_for_developer.sql');
    console.log('3. Cliquez sur "Run"\n');
    console.log('✅ Les modifications frontend sont déjà appliquées');
    console.log('   Le rôle developer devrait fonctionner après l\'application de la migration SQL\n');
  }
}

applyMigration();

