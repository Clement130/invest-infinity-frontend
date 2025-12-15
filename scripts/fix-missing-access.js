import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Utilitaires de licence
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
 * Corrige les accès manquants pour un utilisateur spécifique
 */
async function fixUserAccess(userEmail) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔧 CORRECTION DES ACCÈS POUR: ${userEmail}`);
  console.log('='.repeat(80));

  // 1. Récupérer le profil utilisateur
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, license, role')
    .or(`email.ilike.%${userEmail}%,full_name.ilike.%${userEmail}%`);

  if (!profiles || profiles.length === 0) {
    console.error(`❌ Utilisateur non trouvé: ${userEmail}`);
    return false;
  }

  if (profiles.length > 1) {
    console.log(`\n⚠️  Plusieurs utilisateurs trouvés (${profiles.length}):`);
    profiles.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.email} (${p.full_name || 'N/A'}) - Licence: ${p.license || 'none'}`);
    });
    console.log('\n💡 Utilisez l\'email exact pour une correction précise.\n');
  }

  const profile = profiles[0];
  console.log(`\n📋 Utilisateur: ${profile.email} (${profile.full_name || 'N/A'})`);
  console.log(`   Licence: ${profile.license || 'none'}`);

  if (!profile.license || profile.license === 'none') {
    console.log('⚠️  L\'utilisateur n\'a pas de licence. Aucune correction nécessaire.');
    return false;
  }

  // 2. Récupérer tous les modules actifs
  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, title, required_license')
    .eq('is_active', true);

  if (!modules || modules.length === 0) {
    console.error('❌ Aucun module actif trouvé');
    return false;
  }

  // 3. Calculer les modules auxquels l'utilisateur devrait avoir accès
  const userSystemLicense = profileToSystemLicense(profile.license);
  const expectedModules = modules.filter(module => {
    const moduleRequiredLicense = module.required_license || 'starter';
    return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
  });

  console.log(`\n✅ Modules attendus (${expectedModules.length}):`);
  expectedModules.forEach(m => {
    console.log(`   - ${m.title} (requiert: ${m.required_license || 'starter'})`);
  });

  // 4. Récupérer les accès actuels
  const { data: currentAccess } = await supabase
    .from('training_access')
    .select('module_id')
    .eq('user_id', profile.id);

  const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
  const missingModules = expectedModules.filter(m => !currentModuleIds.has(m.id));

  if (missingModules.length === 0) {
    console.log('\n✅ Tous les accès sont déjà en place. Aucune correction nécessaire.');
    return true;
  }

  console.log(`\n🔧 Accès manquants à corriger (${missingModules.length}):`);
  missingModules.forEach(m => {
    console.log(`   - ${m.title}`);
  });

  // 5. Créer les accès manquants
  const accessRecords = missingModules.map(m => ({
    user_id: profile.id,
    module_id: m.id,
    access_type: 'full',
    granted_at: new Date().toISOString()
  }));

  const { error: accessError } = await supabase
    .from('training_access')
    .upsert(accessRecords, {
      onConflict: 'user_id,module_id'
    });

  if (accessError) {
    console.error('❌ Erreur lors de la création des accès:', accessError);
    return false;
  }

  console.log(`\n✅ ${missingModules.length} accès créé(s) avec succès !`);
  return true;
}

/**
 * Corrige les accès manquants pour tous les utilisateurs
 */
async function fixAllUsersAccess() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔧 CORRECTION DES ACCÈS POUR TOUS LES UTILISATEURS');
  console.log('='.repeat(80));

  // Récupérer tous les utilisateurs clients avec licence
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, license, role')
    .eq('role', 'client')
    .not('license', 'is', null)
    .neq('license', 'none');

  if (!profiles || profiles.length === 0) {
    console.log('✅ Aucun utilisateur avec licence trouvé');
    return;
  }

  console.log(`\n📊 Total utilisateurs avec licence: ${profiles.length}\n`);

  // Récupérer tous les modules actifs
  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, title, required_license')
    .eq('is_active', true);

  if (!modules || modules.length === 0) {
    console.error('❌ Aucun module actif trouvé');
    return;
  }

  let totalFixed = 0;
  let totalErrors = 0;

  for (const profile of profiles) {
    const userSystemLicense = profileToSystemLicense(profile.license);
    
    // Calculer les modules attendus
    const expectedModules = modules.filter(module => {
      const moduleRequiredLicense = module.required_license || 'starter';
      return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
    });

    if (expectedModules.length === 0) continue;

    // Récupérer les accès actuels
    const { data: currentAccess } = await supabase
      .from('training_access')
      .select('module_id')
      .eq('user_id', profile.id);

    const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
    const missingModules = expectedModules.filter(m => !currentModuleIds.has(m.id));

    if (missingModules.length === 0) continue;

    // Créer les accès manquants
    const accessRecords = missingModules.map(m => ({
      user_id: profile.id,
      module_id: m.id,
      access_type: 'full',
      granted_at: new Date().toISOString()
    }));

    const { error: accessError } = await supabase
      .from('training_access')
      .upsert(accessRecords, {
        onConflict: 'user_id,module_id'
      });

    if (accessError) {
      console.error(`❌ Erreur pour ${profile.email}:`, accessError.message);
      totalErrors++;
    } else {
      console.log(`✅ ${profile.email}: ${missingModules.length} accès créé(s)`);
      totalFixed += missingModules.length;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`✅ Total accès créés: ${totalFixed}`);
  if (totalErrors > 0) {
    console.log(`❌ Total erreurs: ${totalErrors}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const userEmail = args[0];
  const fixAll = args.includes('--all');

  if (fixAll) {
    await fixAllUsersAccess();
  } else if (userEmail) {
    await fixUserAccess(userEmail);
  } else {
    console.log('Usage:');
    console.log('  node scripts/fix-missing-access.js <email>     # Corriger un utilisateur spécifique');
    console.log('  node scripts/fix-missing-access.js --all       # Corriger tous les utilisateurs');
  }
}

main().catch(console.error);

