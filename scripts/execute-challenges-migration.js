import { readFileSync } from 'fs';
import { join } from 'path';

// Import conditionnel de pg
let Client;
try {
  const pg = await import('pg');
  Client = pg.Client;
} catch (error) {
  // pg n'est pas disponible, on utilisera seulement l'API
  Client = null;
}

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
const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini dans .env.local');
  process.exit(1);
}

// Extraire le project ref depuis l'URL
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Impossible d\'extraire le project ref depuis VITE_SUPABASE_URL');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Exécution de la migration des défis...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20241120120000_create_challenges_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Méthode 1: Essayer avec l'API Management de Supabase
    if (supabaseServiceRoleKey) {
      console.log('📝 Tentative d\'exécution via API Management de Supabase...\n');
      
      try {
        const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;
        
        const response = await fetch(managementUrl, {
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
          console.log('📊 Résultat:', JSON.stringify(result, null, 2));
          return;
        }

        const errorText = await response.text();
        console.log('⚠️  L\'API Management nécessite un access token spécial.');
        console.log('📝 Erreur:', errorText.substring(0, 200));
        console.log('📝 Passage à la méthode alternative...\n');
      } catch (apiError) {
        console.log('⚠️  Erreur API Management:', apiError.message);
        console.log('📝 Passage à la méthode alternative...\n');
      }
    }

    // Méthode 2: Utiliser une connexion PostgreSQL directe
    if (databaseUrl && Client) {
      console.log('📝 Tentative d\'exécution via connexion PostgreSQL directe...\n');
      
      const client = new Client({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      try {
        await client.connect();
        console.log('✅ Connexion à la base de données établie\n');

        console.log('📝 Exécution de la migration...\n');
        await client.query(migrationSQL);

        console.log('✅ Migration exécutée avec succès !\n');

        // Vérifier que les tables ont été créées
        const tablesCheck = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('challenges', 'challenge_participations', 'challenge_submissions', 'badges', 'user_badges')
          ORDER BY table_name;
        `);

        console.log('📊 Tables créées:');
        tablesCheck.rows.forEach((row) => {
          console.log(`   ✅ ${row.table_name}`);
        });

        // Vérifier les badges
        const badgesCheck = await client.query('SELECT id, name FROM public.badges ORDER BY id;');
        console.log(`\n🏆 Badges créés: ${badgesCheck.rows.length}`);
        badgesCheck.rows.forEach((badge) => {
          console.log(`   - ${badge.id}: ${badge.name}`);
        });

        console.log('\n✨ Migration terminée avec succès !');
        console.log('🎯 Le système de défis est maintenant opérationnel.');
        
        await client.end();
        return;
      } catch (pgError) {
        await client.end();
        if (pgError.message.includes('already exists')) {
          console.log('⚠️  Certaines tables existent déjà.');
          console.log('💡 La migration a peut-être déjà été exécutée.');
          return;
        }
        throw pgError;
      }
    }

    // Si aucune méthode n'a fonctionné, afficher les instructions
    console.log('💡 Pour exécuter la migration, vous avez deux options:\n');
    
    console.log('📋 Option 1: Via Supabase Dashboard (Recommandé - Le plus simple)');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans SQL Editor (menu de gauche)');
    console.log('   4. Copiez-colle le contenu du fichier:');
    console.log('      supabase/migrations/20241120120000_create_challenges_tables.sql');
    console.log('   5. Cliquez sur "Run" (ou Ctrl+Enter)\n');
    
    if (!databaseUrl) {
      console.log('📋 Option 2: Via script Node.js avec connexion PostgreSQL directe');
      console.log('   1. Récupérez votre connection string depuis Supabase Dashboard > Settings > Database');
      console.log('   2. Copiez la "Connection string" (URI mode)');
      console.log('   3. Ajoutez-la dans .env.local comme: DATABASE_URL=postgresql://...');
      console.log('   4. Réexécutez ce script: node scripts/execute-challenges-migration.js\n');
    }

    // Afficher le SQL pour référence
    console.log('📝 SQL à exécuter:\n');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

runMigration();

