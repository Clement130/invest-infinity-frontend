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
  console.log('🚀 Exécution automatique de la migration des défis...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20241120120000_create_challenges_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Tentative d\'exécution via API Supabase Management...\n');

    // Utiliser l'API Management de Supabase
    // Endpoint: https://api.supabase.com/v1/projects/{project_ref}/sql
    // Cela nécessite un access token Supabase Management API
    
    // Pour l'instant, on va utiliser l'API REST avec une approche différente
    // On va exécuter le SQL via l'endpoint REST de Supabase avec la service_role key
    
    const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    // Essayer d'exécuter via une fonction RPC si elle existe
    // Sinon, on va utiliser l'API Management
    
    console.log('🔧 Tentative d\'exécution via API REST...\n');

    // Méthode alternative: Utiliser fetch pour exécuter le SQL
    // On va diviser le SQL en commandes et les exécuter via l'API REST
    
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API REST standard
    // Il faut utiliser l'API Management de Supabase ou une connexion PostgreSQL directe
    
    // Pour l'API Management, on a besoin d'un access token
    // On va essayer avec la service_role key d'abord
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey,
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration exécutée avec succès via API Management !\n');
      console.log('📊 Résultat:', result);
      return;
    }

    // Si l'API Management ne fonctionne pas, essayer une autre méthode
    console.log('⚠️  L\'API Management nécessite un access token spécial.');
    console.log('📝 Utilisation d\'une méthode alternative...\n');

    // Essayer d'exécuter via l'API REST standard avec des requêtes individuelles
    // Mais cela ne fonctionnera pas pour CREATE TABLE, etc.
    
    console.log('💡 Pour exécuter la migration automatiquement, vous avez besoin de:');
    console.log('   1. Un access token Supabase Management API');
    console.log('   2. Ou une connection string PostgreSQL\n');
    
    console.log('📋 Solution la plus simple: Via Supabase Dashboard');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans SQL Editor');
    console.log('   4. Copiez-colle le SQL ci-dessous');
    console.log('   5. Cliquez sur "Run"\n');

    // Afficher le SQL
    console.log('📝 SQL à exécuter:\n');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

  } catch (error) {
    if (error.message.includes('fetch')) {
      console.log('⚠️  Impossible de se connecter à l\'API Management.');
      console.log('📝 Utilisation de la méthode manuelle...\n');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    
    // Afficher les instructions
    console.log('💡 Pour exécuter la migration:');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans SQL Editor');
    console.log('   4. Copiez-colle le contenu de:');
    console.log('      supabase/migrations/20241120120000_create_challenges_tables.sql');
    console.log('   5. Cliquez sur "Run"\n');
  }
}

runMigration();

