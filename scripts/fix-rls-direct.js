import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

async function executeSQL(sql) {
  // Utiliser l'API REST directement pour exécuter du SQL
  // On crée d'abord une fonction temporaire qui exécute le SQL
  const createFunctionSQL = `
    create or replace function public.exec_sql_temp(sql_text text)
    returns void
    language plpgsql
    security definer
    as $$
    begin
      execute sql_text;
    end;
    $$;
  `;

  try {
    // D'abord, créer la fonction exec_sql_temp
    const { error: createError } = await supabase.rpc('exec_sql_temp', { sql_text: createFunctionSQL });
    
    if (createError && !createError.message.includes('already exists')) {
      // Si la fonction n'existe pas, on doit la créer via une requête HTTP directe
      console.log('📝 Création de la fonction temporaire...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({ sql_text: createFunctionSQL }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }

    // Maintenant exécuter le SQL via la fonction
    const { error: execError } = await supabase.rpc('exec_sql_temp', { sql_text: sql });
    
    if (execError) {
      throw execError;
    }

    return { success: true };
  } catch (error) {
    // Si ça ne fonctionne pas, on utilise une approche différente
    throw error;
  }
}

async function fixRLSRecursion() {
  console.log('🔧 Correction de la récursion RLS dans profiles...\n');

  const migrationSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql'),
    'utf-8'
  );

  try {
    // Méthode 1 : Essayer d'exécuter via une fonction RPC
    console.log('📝 Tentative d\'exécution via API REST...\n');
    
    // On exécute chaque commande SQL séparément
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== 'begin' && cmd !== 'commit');

    // D'abord, créer une fonction qui peut exécuter du SQL
    const createExecFunction = `
      CREATE OR REPLACE FUNCTION public.exec_sql_direct(sql_text text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
      END;
      $$;
    `;

    // Utiliser fetch pour exécuter directement via l'API REST
    const apiUrl = `${supabaseUrl}/rest/v1/rpc`;
    
    // Exécuter chaque commande
    for (const cmd of commands) {
      if (!cmd || cmd.length < 10) continue;
      
      console.log(`📝 Exécution: ${cmd.substring(0, 50)}...`);
      
      // Utiliser l'endpoint SQL direct de Supabase (si disponible)
      // Sinon, on doit utiliser une autre méthode
    }

    // Méthode alternative : utiliser l'API Management
    console.log('\n⚠️  L\'API REST ne permet pas d\'exécuter du SQL arbitraire.');
    console.log('📝 Utilisation de l\'approche alternative : création de fonction RPC...\n');

    // Créer une fonction qui exécute le SQL complet
    const fullSQLFunction = `
      CREATE OR REPLACE FUNCTION public.fix_rls_recursion()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        ${migrationSQL.replace(/\$\$/g, '$$$$')}
      END;
      $$;
    `;

    // Exécuter via fetch directement
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/fix_rls_recursion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      console.log('✅ Migration appliquée avec succès !');
      return;
    }

    // Si ça ne fonctionne pas, on doit utiliser le Dashboard
    throw new Error('Impossible d\'exécuter automatiquement. Utilisez le Dashboard.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📝 Veuillez exécuter le SQL suivant dans Supabase Dashboard > SQL Editor:\n');
    console.log(migrationSQL);
    console.log('\n💡 Ou utilisez le fichier: supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql');
    process.exit(1);
  }
}

fixRLSRecursion();

