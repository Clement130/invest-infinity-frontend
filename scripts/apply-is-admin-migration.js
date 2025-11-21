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
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

// Créer le client Supabase avec le service role key (admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🔧 Application de la migration is_admin pour developer...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250122000001_update_is_admin_for_developer.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Exécuter la migration via RPC (si disponible) ou via requête directe
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API client
    // Il faut utiliser le Dashboard ou l'API REST directement
    
    // Pour l'instant, on va juste créer la fonction via une requête SQL directe
    // En utilisant rpc si disponible, sinon on affiche les instructions
    
    console.log('📝 Migration SQL à exécuter:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n⚠️  Cette migration doit être exécutée manuellement dans Supabase Dashboard');
    console.log('\n📋 Instructions:');
    console.log('1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new');
    console.log('2. Copiez-collez le SQL ci-dessus');
    console.log('3. Cliquez sur "Run"\n');

    // Essayer d'exécuter via une requête SQL directe si possible
    // Note: L'API Supabase JS ne permet pas d'exécuter du SQL arbitraire
    // Il faut utiliser l'API REST ou le Dashboard
    
    console.log('✅ Les modifications frontend sont déjà appliquées');
    console.log('   Le rôle developer devrait maintenant fonctionner après l\'application de la migration SQL\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

applyMigration();

