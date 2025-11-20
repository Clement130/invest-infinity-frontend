import { createClient } from '@supabase/supabase-js';
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
  console.error('📝 Récupérez la clé depuis : Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Créer le client Supabase avec service_role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function grantAccess() {
  try {
    console.log('🔍 Recherche du module "Les Bases du Trading"...\n');

    // Trouver le module gratuit
    const { data: module, error: moduleError } = await supabase
      .from('training_modules')
      .select('id, title')
      .eq('title', 'Les Bases du Trading')
      .maybeSingle();

    if (moduleError) {
      throw new Error(`Erreur lors de la recherche du module: ${moduleError.message}`);
    }

    if (!module) {
      console.error('❌ Module "Les Bases du Trading" introuvable.');
      console.error('💡 Assure-toi d\'avoir exécuté le script seed-test-data.sql d\'abord.');
      process.exit(1);
    }

    console.log(`✅ Module trouvé: ${module.title} (ID: ${module.id})\n`);

    // Récupérer tous les profils utilisateurs
    // Note: profiles.id = auth.users.id selon le schéma
    console.log('👥 Récupération de tous les utilisateurs...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email');

    if (profilesError) {
      throw new Error(`Erreur lors de la récupération des profils: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé dans la base de données.');
      console.log('💡 Crée un utilisateur via Supabase Dashboard > Authentication > Users');
      process.exit(0);
    }

    console.log(`✅ ${profiles.length} utilisateur(s) trouvé(s)\n`);

    // Vérifier les accès existants
    console.log('🔍 Vérification des accès existants...');
    const { data: existingAccess, error: accessError } = await supabase
      .from('training_access')
      .select('user_id')
      .eq('module_id', module.id);

    if (accessError) {
      throw new Error(`Erreur lors de la vérification des accès: ${accessError.message}`);
    }

    const existingUserIds = new Set(existingAccess?.map(a => a.user_id) || []);

    // Filtrer les utilisateurs qui n'ont pas encore accès
    // Utiliser directement l'ID du profil (qui est aussi l'ID de auth.users)
    const usersWithoutAccess = profiles.filter(p => !existingUserIds.has(p.id));
    
    if (usersWithoutAccess.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà accès au module "Les Bases du Trading".\n');
      await displayAccessSummary(module.id);
      process.exit(0);
    }

    console.log(`📝 ${usersWithoutAccess.length} utilisateur(s) sans accès trouvé(s)\n`);
    
    // Afficher les utilisateurs qui vont recevoir l'accès
    usersWithoutAccess.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    console.log('');

    if (usersWithoutAccess.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà accès au module "Les Bases du Trading".\n');
      await displayAccessSummary(module.id);
      process.exit(0);
    }

    console.log(`📝 ${usersWithoutAccess.length} utilisateur(s) sans accès trouvé(s)\n`);

    // Vérifier l'existence dans auth.users via l'API REST
    console.log('🔍 Vérification de l\'existence des utilisateurs dans auth.users...\n');
    
    const validUsers = [];
    for (const user of usersWithoutAccess) {
      // Vérifier via l'API REST Admin
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey,
          },
        });

        if (response.ok) {
          validUsers.push(user);
          console.log(`   ✅ ${user.email}: Utilisateur valide dans auth.users`);
        } else {
          console.log(`   ⚠️  ${user.email}: Non trouvé dans auth.users (${response.status})`);
          console.log(`      Le profil existe mais pas l'utilisateur auth.`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${user.email}: Erreur de vérification - ${error.message}`);
        // On essaie quand même de créer l'accès
        validUsers.push(user);
      }
    }
    
    if (validUsers.length === 0) {
      console.log('\n❌ Aucun utilisateur valide trouvé pour attribuer l\'accès.');
      console.log('\n📋 SOLUTION :');
      console.log('   1. Va sur https://supabase.com/dashboard');
      console.log('   2. Sélectionne ton projet');
      console.log('   3. Va dans Authentication > Users');
      console.log('   4. Clique sur "Add user"');
      console.log('   5. Crée l\'utilisateur avec le même email que dans profiles');
      console.log('   6. OU supprime le profil orphelin et crée un nouvel utilisateur via l\'app');
      console.log('\n💡 Le profil existe dans "profiles" mais pas l\'utilisateur dans "auth.users"');
      console.log('💡 Les deux doivent être synchronisés pour que les accès fonctionnent.');
      process.exit(1);
    }
    
    console.log(`\n🔓 Attribution des accès à ${validUsers.length} utilisateur(s)...\n`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of validUsers) {
      try {
        const { data: newAccess, error: insertError } = await supabase
          .from('training_access')
          .insert({
            user_id: user.id,
            module_id: module.id,
            access_type: 'full',
          })
          .select()
          .single();

        if (insertError) {
          // Si c'est une erreur de doublon, on ignore
          if (insertError.code === '23505') {
            console.log(`   ⚠️  ${user.email}: Accès déjà existant (ignoré)`);
            successCount++; // On compte comme succès car l'accès existe déjà
          } else if (insertError.code === '23503') {
            // Foreign key violation - l'utilisateur n'existe pas dans auth.users
            console.error(`   ❌ ${user.email}: L'utilisateur n'existe pas dans auth.users`);
            console.error(`      Crée l'utilisateur via Supabase Dashboard > Authentication > Users`);
            errorCount++;
          } else {
            console.error(`   ❌ ${user.email}: ${insertError.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ ${user.email}: Accès créé`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ ${user.email}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Résultat: ${successCount} créé(s), ${errorCount} erreur(s)\n`);

    if (successCount === 0 && errorCount > 0) {
      throw new Error('Aucun accès n\'a pu être créé. Vérifiez les erreurs ci-dessus.');
    }

    // Afficher le résumé
    await displayAccessSummary(module.id);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Vérifiez que:');
    console.error('   1. VITE_SUPABASE_URL est correct dans .env.local');
    console.error('   2. VITE_SUPABASE_SERVICE_ROLE_KEY est correct dans .env.local');
    console.error('   3. Les tables profiles et training_access existent dans Supabase');
    console.error('   4. Le module "Les Bases du Trading" existe (exécute seed-test-data.sql d\'abord)');
    process.exit(1);
  }
}

async function displayAccessSummary(moduleId) {
  try {
    console.log('📊 Résumé des accès:\n');

    // Récupérer les accès avec les informations des profils et modules
    const { data: allAccess, error } = await supabase
      .from('training_access')
      .select('user_id, access_type, granted_at, module_id')
      .eq('module_id', moduleId)
      .order('granted_at', { ascending: false });

    // Récupérer les profils séparément
    const userIds = allAccess?.map(a => a.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    // Récupérer le module
    const { data: module } = await supabase
      .from('training_modules')
      .select('id, title')
      .eq('id', moduleId)
      .single();

    if (error) {
      console.error('⚠️  Erreur lors de la récupération du résumé:', error.message);
      return;
    }

    if (!allAccess || allAccess.length === 0) {
      console.log('   Aucun accès trouvé.');
      return;
    }

    console.log(`   Total d'accès: ${allAccess.length}\n`);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    allAccess.forEach((access, index) => {
      const profile = profilesMap.get(access.user_id);
      const email = profile?.email || 'N/A';
      const accessType = access.access_type || 'full';
      const grantedAt = access.granted_at 
        ? new Date(access.granted_at).toLocaleString('fr-FR')
        : 'N/A';

      console.log(`   ${index + 1}. ${email}`);
      console.log(`      Module: ${module?.title || 'N/A'}`);
      console.log(`      Type d'accès: ${accessType}`);
      console.log(`      Attribué le: ${grantedAt}`);
      console.log('');
    });

    console.log('✅ Attribution des accès terminée !');

  } catch (error) {
    console.error('⚠️  Erreur lors de l\'affichage du résumé:', error.message);
  }
}

// Exécuter le script
grantAccess();

