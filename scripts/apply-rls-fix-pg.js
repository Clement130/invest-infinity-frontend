import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

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

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL doit être défini');
  process.exit(1);
}

// Extraire les informations de connexion depuis l'URL Supabase
// Format: https://vveswlmcgmizmjsriezw.supabase.co
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Impossible d\'extraire le project ref depuis VITE_SUPABASE_URL');
  process.exit(1);
}

async function applyRLSFix() {
  console.log('🔧 Correction de la récursion RLS dans profiles...\n');
  console.log('⚠️  Cette méthode nécessite une connexion PostgreSQL directe.');
  console.log('📝 Pour utiliser cette méthode, tu dois :');
  console.log('   1. Récupérer ta connection string depuis Supabase Dashboard > Settings > Database');
  console.log('   2. L\'ajouter dans .env.local comme: DATABASE_URL=postgresql://...');
  console.log('   3. Installer pg: npm install pg\n');
  
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('💡 Solution alternative : Exécute le SQL manuellement dans Supabase Dashboard > SQL Editor\n');
    console.log('📝 SQL à exécuter:\n');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql'),
      'utf-8'
    );
    console.log(migrationSQL);
    process.exit(0);
  }

  const migrationSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql'),
    'utf-8'
  );

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');
    
    console.log('📝 Exécution de la migration...\n');
    await client.query(migrationSQL);
    
    console.log('✅ Migration appliquée avec succès !');
    console.log('🔄 La récursion RLS a été corrigée.');
    console.log('📝 La fonction is_admin() utilise maintenant SECURITY DEFINER.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyRLSFix();

