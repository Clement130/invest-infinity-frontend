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

async function applyRLSFix() {
  console.log('🔧 Correction de la récursion RLS dans profiles...\n');

  const migrationSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql'),
    'utf-8'
  );

  try {
    // Créer une fonction RPC qui exécute le SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.apply_rls_fix()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      BEGIN
        -- Supprimer la politique problématique
        DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;

        -- Recréer la fonction is_admin avec SECURITY DEFINER
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

        -- Recréer la politique admin
        CREATE POLICY "admins can see all profiles"
          ON public.profiles
          FOR SELECT
          USING (public.is_admin(auth.uid()));

        -- Politique UPDATE
        DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
        CREATE POLICY "users can update their own profile"
          ON public.profiles
          FOR UPDATE
          USING (id = auth.uid())
          WITH CHECK (id = auth.uid());

        -- Politique INSERT
        DROP POLICY IF EXISTS "users can insert their own profile" ON public.profiles;
        CREATE POLICY "users can insert their own profile"
          ON public.profiles
          FOR INSERT
          WITH CHECK (id = auth.uid());
      END;
      $func$;
    `;

    // Exécuter via l'API REST directement
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/apply_rls_fix`, {
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
      console.log('🔄 La récursion RLS a été corrigée.');
      console.log('📝 La fonction is_admin() utilise maintenant SECURITY DEFINER.');
      return;
    }

    // Si la fonction n'existe pas, on doit la créer d'abord
    console.log('📝 Création de la fonction RPC...');
    
    // Utiliser le client Supabase pour créer la fonction
    // On doit utiliser une requête SQL directe, mais Supabase ne le permet pas via l'API REST
    // On va donc utiliser une approche différente : exécuter chaque commande individuellement

    console.log('⚠️  Impossible d\'exécuter automatiquement via l\'API REST.');
    console.log('📝 Utilisation du navigateur pour exécuter le SQL...\n');

    // Utiliser le navigateur MCP pour ouvrir Supabase Dashboard
    throw new Error('Utilisation du navigateur nécessaire');

  } catch (error) {
    if (error.message === 'Utilisation du navigateur nécessaire') {
      // On va utiliser le navigateur MCP
      return { useBrowser: true, sql: migrationSQL };
    }
    throw error;
  }
}

// Exporter pour utilisation
export { applyRLSFix };

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  applyRLSFix().catch(console.error);
}

