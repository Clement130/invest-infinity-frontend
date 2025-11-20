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

const migrationSQL = readFileSync(
  join(process.cwd(), 'supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql'),
  'utf-8'
);

async function applyRLSFix() {
  console.log('🔧 Correction de la récursion RLS dans profiles...\n');

  // Extraire le project ref depuis l'URL
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Impossible d\'extraire le project ref');
    process.exit(1);
  }

  try {
    // Utiliser l'API Management de Supabase pour exécuter du SQL
    // Endpoint: https://api.supabase.com/v1/projects/{project_ref}/sql
    const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;
    
    console.log('📝 Tentative d\'exécution via API Management...\n');
    
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration appliquée avec succès !');
      console.log('🔄 La récursion RLS a été corrigée.');
      return;
    }

    const errorText = await response.text();
    console.error('❌ Erreur API Management:', errorText);
    
    // Si l'API Management ne fonctionne pas, utiliser l'approche alternative
    console.log('\n⚠️  L\'API Management nécessite un access token spécial.');
    console.log('📝 Utilisation de l\'approche alternative...\n');
    
    throw new Error('API Management non disponible');

  } catch (error) {
    if (error.message === 'API Management non disponible') {
      // Utiliser une fonction RPC créée dynamiquement
      console.log('📝 Création d\'une fonction RPC temporaire...\n');
      
      // Le SQL de la fonction
      const functionSQL = `
        CREATE OR REPLACE FUNCTION public.fix_rls_recursion_temp()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
          ${migrationSQL.replace(/begin;|commit;/gi, '').replace(/\$\$/g, '$$$$')}
        END;
        $func$;
      `;

      // Essayer d'exécuter via l'API REST
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/fix_rls_recursion_temp`;
      
      // Mais on ne peut pas créer une fonction via l'API REST non plus...
      console.log('⚠️  Supabase ne permet pas d\'exécuter du SQL arbitraire via l\'API REST.');
      console.log('💡 Solution : Exécute le SQL manuellement dans Supabase Dashboard\n');
      console.log('📝 SQL à exécuter:\n');
      console.log(migrationSQL);
      console.log('\n🔗 Lien direct: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    } else {
      console.error('❌ Erreur:', error.message);
    }
  }
}

applyRLSFix();

