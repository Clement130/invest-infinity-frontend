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

async function executeSQL(sql) {
  // Utiliser l'API Management de Supabase pour exécuter du SQL
  // L'endpoint est: /rest/v1/rpc/exec_sql (si la fonction existe)
  // Sinon, on doit créer une fonction temporaire
  
  // D'abord, créer une fonction qui peut exécuter du SQL
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.exec_sql_temp(sql_text text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_text;
    END;
    $$;
  `;

  try {
    // Essayer de créer la fonction via une requête HTTP directe
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_temp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({ sql_text: createFunctionSQL }),
    });

    // Maintenant exécuter le SQL
    const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql_temp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({ sql_text: sql }),
    });

    if (!execResponse.ok) {
      const errorText = await execResponse.text();
      throw new Error(`HTTP ${execResponse.status}: ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    // Si ça ne fonctionne pas, on doit utiliser une autre méthode
    throw error;
  }
}

async function applyRLSFix() {
  console.log('🔧 Correction de la récursion RLS dans profiles...\n');

  const migrationSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql'),
    'utf-8'
  );

  try {
    // Méthode : Créer une fonction RPC qui contient tout le SQL
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.fix_rls_recursion()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      BEGIN
        DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;
        
        DROP FUNCTION IF EXISTS public.is_admin(uuid);
        CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = uid
              AND p.role = 'admin'
          );
        $$;
        
        CREATE POLICY "admins can see all profiles"
          ON public.profiles
          FOR SELECT
          USING (public.is_admin(auth.uid()));
        
        DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
        CREATE POLICY "users can update their own profile"
          ON public.profiles
          FOR UPDATE
          USING (id = auth.uid())
          WITH CHECK (id = auth.uid());
        
        DROP POLICY IF EXISTS "users can insert their own profile" ON public.profiles;
        CREATE POLICY "users can insert their own profile"
          ON public.profiles
          FOR INSERT
          WITH CHECK (id = auth.uid());
      END;
      $func$;
    `;

    // Exécuter via l'API REST pour créer la fonction
    // On utilise l'endpoint SQL direct de Supabase (nécessite une connexion PostgreSQL directe)
    // Mais on peut utiliser l'API Management si disponible
    
    console.log('📝 Tentative d\'exécution via API REST...\n');
    
    // Utiliser fetch pour créer la fonction via une requête SQL directe
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API REST standard
    // On doit utiliser l'API Management ou une connexion PostgreSQL directe
    
    console.log('⚠️  Supabase ne permet pas d\'exécuter du SQL arbitraire via l\'API REST.');
    console.log('📝 Utilisation d\'une approche alternative...\n');

    // Alternative : Utiliser le client Supabase pour créer la fonction via RPC
    // Mais pour créer une fonction, on doit d'abord pouvoir exécuter du SQL...
    
    // La meilleure solution est d'utiliser psql ou le Dashboard
    console.log('💡 Solution recommandée :');
    console.log('   1. Va sur https://supabase.com/dashboard');
    console.log('   2. Sélectionne ton projet');
    console.log('   3. Va dans SQL Editor');
    console.log('   4. Copie-colle le contenu de: supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql');
    console.log('   5. Clique sur Run\n');
    
    console.log('📝 SQL à exécuter:\n');
    console.log(migrationSQL);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

applyRLSFix();

