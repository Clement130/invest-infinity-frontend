import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini dans .env.local');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini dans .env.local');
  console.error('📝 Récupérez la clé depuis : Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Utilitaires de licence (copiés depuis subscriptionUtils.ts)
const SUBSCRIPTION_WEIGHT = {
  elite: 3,
  immersion: 3,
  pro: 2,
  transformation: 2,
  starter: 1,
  entree: 1,
  none: 0,
};

function getSubscriptionWeight(value) {
  if (!value) return 0;
  return SUBSCRIPTION_WEIGHT[value] ?? 0;
}

function profileToSystemLicense(profileLicense) {
  const mapping = {
    entree: 'starter',
    transformation: 'pro',
    immersion: 'elite',
    none: 'none',
    starter: 'starter',
    pro: 'pro',
    elite: 'elite',
  };
  if (!profileLicense) return 'none';
  return mapping[profileLicense] || 'none';
}

function hasLicenseAccess(userLicense, requiredLicense) {
  const userWeight = getSubscriptionWeight(userLicense);
  const requiredWeight = getSubscriptionWeight(requiredLicense);
  if (requiredWeight === 0) return true;
  if (userWeight === 0) return false;
  return userWeight >= requiredWeight;
}

/**
 * Diagnostique les problèmes d'accès pour un utilisateur spécifique
 */
async function diagnoseUser(userEmail) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 DIAGNOSTIC POUR: ${userEmail}`);
  console.log('='.repeat(80));

  // 1. Récupérer le profil utilisateur
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, license, role, created_at')
    .or(`email.ilike.%${userEmail}%,full_name.ilike.%${userEmail}%`);

  if (profileError) {
    console.error('❌ Erreur lors de la récupération du profil:', profileError);
    return null;
  }

  if (!profiles || profiles.length === 0) {
    console.error(`❌ Utilisateur non trouvé: ${userEmail}`);
    return null;
  }

  if (profiles.length > 1) {
    console.log(`\n⚠️  Plusieurs utilisateurs trouvés (${profiles.length}):`);
    profiles.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.email} (${p.full_name || 'N/A'}) - Licence: ${p.license || 'none'}`);
    });
    console.log('\n💡 Utilisez l\'email exact pour un diagnostic précis.\n');
    // Utiliser le premier par défaut
    console.log(`📋 Utilisation du premier résultat: ${profiles[0].email}\n`);
  }

  const profile = profiles[0];

  console.log('\n📋 PROFIL UTILISATEUR:');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Nom: ${profile.full_name || 'N/A'}`);
  console.log(`   Licence: ${profile.license || 'none'} (${getSubscriptionWeight(profile.license)})`);
  console.log(`   Rôle: ${profile.role}`);
  console.log(`   Créé le: ${profile.created_at}`);

  // 2. Récupérer tous les modules actifs
  const { data: modules, error: modulesError } = await supabase
    .from('training_modules')
    .select('id, title, required_license, position, is_active')
    .eq('is_active', true)
    .order('position');

  if (modulesError) {
    console.error('❌ Erreur lors de la récupération des modules:', modulesError);
    return null;
  }

  console.log(`\n📚 MODULES DISPONIBLES (${modules.length}):`);
  modules.forEach(m => {
    const icon = m.required_license === 'starter' ? '🟢' : m.required_license === 'pro' ? '🟡' : '🔴';
    console.log(`   ${icon} [${m.required_license || 'starter'}] ${m.title}`);
  });

  // 3. Récupérer les accès actuels de l'utilisateur
  const { data: currentAccess, error: accessError } = await supabase
    .from('training_access')
    .select('module_id, access_type, granted_at')
    .eq('user_id', profile.id);

  if (accessError) {
    console.error('❌ Erreur lors de la récupération des accès:', accessError);
    return null;
  }

  console.log(`\n🔑 ACCÈS ACTUELS (${currentAccess.length}):`);
  if (currentAccess.length === 0) {
    console.log('   ⚠️  AUCUN ACCÈS TROUVÉ !');
  } else {
    currentAccess.forEach(acc => {
      const module = modules.find(m => m.id === acc.module_id);
      console.log(`   ✓ ${module?.title || acc.module_id} (${acc.access_type})`);
    });
  }

  // 4. Calculer les modules auxquels l'utilisateur DEVRAIT avoir accès
  const userSystemLicense = profileToSystemLicense(profile.license);
  const expectedModules = modules.filter(module => {
    const moduleRequiredLicense = module.required_license || 'starter';
    return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
  });

  console.log(`\n✅ MODULES ATTENDUS SELON LA LICENCE (${expectedModules.length}):`);
  if (expectedModules.length === 0) {
    console.log('   ⚠️  Aucun module attendu (licence: none ou invalide)');
  } else {
    expectedModules.forEach(m => {
      console.log(`   ✓ ${m.title} (requiert: ${m.required_license || 'starter'})`);
    });
  }

  // 5. Comparer accès actuels vs attendus
  const currentModuleIds = new Set(currentAccess.map(a => a.module_id));
  const expectedModuleIds = new Set(expectedModules.map(m => m.id));

  const missingAccess = expectedModules.filter(m => !currentModuleIds.has(m.id));
  const extraAccess = currentAccess.filter(a => !expectedModuleIds.has(a.module_id));

  console.log(`\n🔍 ANALYSE DES DIFFÉRENCES:`);
  
  if (missingAccess.length === 0 && extraAccess.length === 0) {
    console.log('   ✅ Tout est correct !');
  } else {
    if (missingAccess.length > 0) {
      console.log(`\n   ❌ ACCÈS MANQUANTS (${missingAccess.length}):`);
      missingAccess.forEach(m => {
        console.log(`      - ${m.title} (requiert: ${m.required_license || 'starter'})`);
      });
    }

    if (extraAccess.length > 0) {
      console.log(`\n   ⚠️  ACCÈS SUPPLÉMENTAIRES (${extraAccess.length}):`);
      extraAccess.forEach(acc => {
        const module = modules.find(m => m.id === acc.module_id);
        console.log(`      - ${module?.title || acc.module_id} (non requis par la licence)`);
      });
    }
  }

  return {
    profile,
    modules,
    currentAccess,
    expectedModules,
    missingAccess,
    extraAccess,
    hasIssues: missingAccess.length > 0 || extraAccess.length > 0
  };
}

/**
 * Diagnostique tous les utilisateurs et identifie ceux avec des problèmes
 */
async function diagnoseAllUsers() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 DIAGNOSTIC DE TOUS LES UTILISATEURS');
  console.log('='.repeat(80));

  // Récupérer tous les utilisateurs clients
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, license, role')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    return;
  }

  console.log(`\n📊 Total utilisateurs clients: ${profiles.length}\n`);

  const usersWithIssues = [];
  const usersWithoutLicense = [];
  const usersWithoutAccess = [];

  for (const profile of profiles) {
    const userSystemLicense = profileToSystemLicense(profile.license);
    
    // Récupérer les modules actifs
    const { data: modules } = await supabase
      .from('training_modules')
      .select('id, title, required_license')
      .eq('is_active', true);

    if (!modules || modules.length === 0) continue;

    // Calculer les modules attendus
    const expectedModules = modules.filter(module => {
      const moduleRequiredLicense = module.required_license || 'starter';
      return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
    });

    // Récupérer les accès actuels
    const { data: currentAccess } = await supabase
      .from('training_access')
      .select('module_id')
      .eq('user_id', profile.id);

    const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
    const expectedModuleIds = new Set(expectedModules.map(m => m.id));
    const missingAccess = expectedModules.filter(m => !currentModuleIds.has(m.id));

    // Identifier les problèmes
    if (!profile.license || profile.license === 'none') {
      usersWithoutLicense.push({
        ...profile,
        expectedModules: expectedModules.length,
        currentAccess: currentAccess?.length || 0
      });
    } else if (expectedModules.length > 0 && missingAccess.length > 0) {
      usersWithIssues.push({
        ...profile,
        license: profile.license,
        expectedModules: expectedModules.length,
        currentAccess: currentAccess?.length || 0,
        missingAccess: missingAccess.length,
        missingModules: missingAccess.map(m => m.title)
      });
    } else if (expectedModules.length > 0 && (currentAccess?.length || 0) === 0) {
      usersWithoutAccess.push({
        ...profile,
        license: profile.license,
        expectedModules: expectedModules.length
      });
    }
  }

  // Afficher les résultats
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ DES PROBLÈMES');
  console.log('='.repeat(80));

  if (usersWithoutLicense.length > 0) {
    console.log(`\n⚠️  UTILISATEURS SANS LICENCE (${usersWithoutLicense.length}):`);
    usersWithoutLicense.slice(0, 10).forEach(u => {
      console.log(`   - ${u.email} (${u.full_name || 'N/A'})`);
    });
    if (usersWithoutLicense.length > 10) {
      console.log(`   ... et ${usersWithoutLicense.length - 10} autres`);
    }
  }

  if (usersWithoutAccess.length > 0) {
    console.log(`\n❌ UTILISATEURS AVEC LICENCE MAIS SANS ACCÈS (${usersWithoutAccess.length}):`);
    usersWithoutAccess.forEach(u => {
      console.log(`   - ${u.email} (${u.full_name || 'N/A'}) - Licence: ${u.license} - Devrait avoir ${u.expectedModules} modules`);
    });
  }

  if (usersWithIssues.length > 0) {
    console.log(`\n🔴 UTILISATEURS AVEC ACCÈS INCOMPLETS (${usersWithIssues.length}):`);
    usersWithIssues.forEach(u => {
      console.log(`   - ${u.email} (${u.full_name || 'N/A'})`);
      console.log(`     Licence: ${u.license} | Attendus: ${u.expectedModules} | Actuels: ${u.currentAccess} | Manquants: ${u.missingAccess}`);
      if (u.missingModules && u.missingModules.length > 0) {
        console.log(`     Modules manquants: ${u.missingModules.join(', ')}`);
      }
    });
  }

  if (usersWithoutLicense.length === 0 && usersWithoutAccess.length === 0 && usersWithIssues.length === 0) {
    console.log('\n✅ Aucun problème détecté ! Tous les utilisateurs ont les accès corrects.');
  }

  return {
    usersWithoutLicense,
    usersWithoutAccess,
    usersWithIssues
  };
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const userEmail = args[0];

  if (userEmail) {
    // Diagnostiquer un utilisateur spécifique
    await diagnoseUser(userEmail);
  } else {
    // Diagnostiquer tous les utilisateurs
    await diagnoseAllUsers();
  }
}

main().catch(console.error);

