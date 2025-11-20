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

const migrationSQL = `
begin;

-- Supprimer la politique problématique
drop policy if exists "admins can see all profiles" on public.profiles;

-- Recréer la fonction is_admin avec SECURITY DEFINER pour contourner RLS
-- Cela permet à la fonction de lire profiles sans déclencher les politiques RLS
drop function if exists public.is_admin(uuid);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

-- Recréer la politique admin pour profiles
-- Maintenant que is_admin utilise SECURITY DEFINER, il n'y aura plus de récursion
create policy "admins can see all profiles"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));

-- Permettre aussi aux utilisateurs de mettre à jour leur propre profil
drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Permettre aux utilisateurs d'insérer leur propre profil (pour la création automatique)
drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles
  for insert
  with check (id = auth.uid());

commit;
`;

async function fixRLSRecursion() {
  console.log('🔧 Correction de la récursion RLS dans profiles...\n');

  try {
    // Exécuter la migration via rpc ou directement
    // On utilise une fonction SQL pour exécuter le SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Si exec_sql n'existe pas, on essaie une autre méthode
      console.log('⚠️  Méthode RPC non disponible, utilisation de la méthode alternative...\n');
      
      // On doit exécuter chaque commande séparément via l'API REST
      // Mais Supabase ne permet pas d'exécuter du SQL arbitraire via l'API REST
      // Il faut utiliser le Dashboard SQL Editor ou psql
      
      console.log('❌ Impossible d\'exécuter automatiquement via l\'API.');
      console.log('📝 Veuillez exécuter le SQL suivant dans Supabase Dashboard > SQL Editor:\n');
      console.log(migrationSQL);
      console.log('\n💡 Ou utilisez le fichier: supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql');
      process.exit(1);
    }

    console.log('✅ Migration appliquée avec succès !');
    console.log('🔄 La récursion RLS a été corrigée.');
    console.log('📝 La fonction is_admin() utilise maintenant SECURITY DEFINER pour éviter la récursion.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📝 Veuillez exécuter le SQL suivant dans Supabase Dashboard > SQL Editor:\n');
    console.log(migrationSQL);
    process.exit(1);
  }
}

fixRLSRecursion();

