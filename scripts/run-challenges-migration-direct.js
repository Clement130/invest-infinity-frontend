import { Client } from 'pg';
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

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erreur : DATABASE_URL n\'est pas défini dans .env.local');
  console.error('📝 Pour obtenir votre DATABASE_URL:');
  console.error('   1. Allez sur Supabase Dashboard > Settings > Database');
  console.error('   2. Copiez la "Connection string" (URI mode)');
  console.error('   3. Ajoutez-la dans .env.local comme: DATABASE_URL=postgresql://...\n');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Exécution de la migration des défis via PostgreSQL direct...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connexion à la base de données établie\n');

    // Lire le fichier de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20241120120000_create_challenges_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Exécution de la migration...\n');
    console.log('   - Création des tables: challenges, challenge_participations, challenge_submissions');
    console.log('   - Création des tables: badges, user_badges');
    console.log('   - Configuration RLS');
    console.log('   - Insertion des badges par défaut\n');

    // Exécuter le SQL
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

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Certaines tables existent déjà.');
      console.log('💡 La migration a peut-être déjà été exécutée partiellement.');
      console.log('📝 Vous pouvez ignorer cette erreur si les tables sont déjà créées.');
    } else {
      console.log('\n📝 Détails de l\'erreur:');
      console.error(error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

// Vérifier si pg est installé
try {
  await import('pg');
} catch (error) {
  console.error('❌ Le package "pg" n\'est pas installé.');
  console.error('📝 Installez-le avec: npm install pg\n');
  process.exit(1);
}

runMigration();

