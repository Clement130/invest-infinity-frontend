import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
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

function isTestAccount(email, fullName) {
  if (!email) return false;
  const emailLower = email.toLowerCase();
  const nameLower = (fullName || '').toLowerCase();
  
  const testPatterns = [
    /@test\.investinfinity\.fr/i,
    /@example\.com/i,
    /^test-/i,
    /^test-payment-/i,
    /test\.smtp/i,
    /test@/i,
    /@test\./i,
    /test-progress@/i,
    /test-webhook-/i,
    /test-client@/i,
    /^test\./i,
    /test\.debug/i,
    /test\.final/i,
    /test\.email/i,
    /test\.option/i,
    /test\.prod/i,
  ];
  
  const tempEmailDomains = [
    /@cexch\.com/i,
    /@bialode\.com/i,
    /@docsfy\.com/i,
    /@acpeak\.com/i,
    /@bnsteps\.com/i,
  ];
  
  for (const pattern of [...testPatterns, ...tempEmailDomains]) {
    if (pattern.test(emailLower)) return true;
  }
  
  return false;
}

async function verifyAllChanges() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 VÉRIFICATION COMPLÈTE DES MODIFICATIONS EN PRODUCTION');
  console.log('='.repeat(80));

  let allChecksPassed = true;

  // ========================================================================
  // 1. VÉRIFICATION DU COMPTE ADMIN
  // ========================================================================
  console.log(`\n${'='.repeat(80)}`);
  console.log('1️⃣  VÉRIFICATION DU COMPTE ADMIN');
  console.log('='.repeat(80));

  const adminEmail = 'investinfinityfr@gmail.com';
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', adminEmail)
    .single();

  if (adminProfile) {
    console.log(`✅ Compte admin trouvé:`);
    console.log(`   Email: ${adminProfile.email}`);
    console.log(`   Rôle: ${adminProfile.role}`);
    console.log(`   Licence: ${adminProfile.license || 'none'}`);
    
    if (adminProfile.role !== 'admin') {
      console.log(`   ❌ ERREUR: Le rôle n'est pas 'admin' !`);
      allChecksPassed = false;
    } else {
      console.log(`   ✅ Rôle correct`);
    }

    const { data: adminAccess } = await supabase
      .from('training_access')
      .select('module_id')
      .eq('user_id', adminProfile.id);

    console.log(`   Accès modules: ${adminAccess?.length || 0}`);
    if ((adminAccess?.length || 0) === 0) {
      console.log(`   ⚠️  Aucun accès aux modules (normal pour admin via RLS)`);
    }
  } else {
    console.log(`❌ ERREUR: Compte admin non trouvé !`);
    allChecksPassed = false;
  }

  // ========================================================================
  // 2. VÉRIFICATION DES ACCÈS D'ARMANDINO
  // ========================================================================
  console.log(`\n${'='.repeat(80)}`);
  console.log('2️⃣  VÉRIFICATION DES ACCÈS D\'ARMANDINO');
  console.log('='.repeat(80));

  const armandinoEmails = ['monarm005@gmail.com', 'armandino.monteiro@me.com'];
  
  for (const email of armandinoEmails) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profile) {
      console.log(`\n📧 ${email}:`);
      console.log(`   Licence: ${profile.license || 'none'}`);

      const userSystemLicense = profileToSystemLicense(profile.license);
      const { data: modules } = await supabase
        .from('training_modules')
        .select('id, title, required_license')
        .eq('is_active', true);

      const expectedModules = modules?.filter(module => {
        const moduleRequiredLicense = module.required_license || 'starter';
        return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
      }) || [];

      const { data: currentAccess } = await supabase
        .from('training_access')
        .select('module_id')
        .eq('user_id', profile.id);

      const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
      const missingAccess = expectedModules.filter(m => !currentModuleIds.has(m.id));

      if (missingAccess.length > 0) {
        console.log(`   ❌ ERREUR: ${missingAccess.length} accès manquant(s):`);
        missingAccess.forEach(m => console.log(`      - ${m.title}`));
        allChecksPassed = false;
      } else {
        console.log(`   ✅ Tous les accès sont corrects (${expectedModules.length} module(s))`);
      }
    } else {
      console.log(`\n⚠️  ${email}: Compte non trouvé`);
    }
  }

  // ========================================================================
  // 3. VÉRIFICATION DES AUTRES UTILISATEURS CORRIGÉS
  // ========================================================================
  console.log(`\n${'='.repeat(80)}`);
  console.log('3️⃣  VÉRIFICATION DES AUTRES UTILISATEURS CORRIGÉS');
  console.log('='.repeat(80));

  const usersToCheck = [
    'jeremyr93@hotmail.fr',
    'test-payment-1765300683888@test.investinfinity.fr',
    'test-payment-1765300716489@test.investinfinity.fr',
  ];

  let usersWithIssues = 0;

  for (const email of usersToCheck) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profile) {
      const userSystemLicense = profileToSystemLicense(profile.license);
      const { data: modules } = await supabase
        .from('training_modules')
        .select('id, title, required_license')
        .eq('is_active', true);

      const expectedModules = modules?.filter(module => {
        const moduleRequiredLicense = module.required_license || 'starter';
        return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
      }) || [];

      if (expectedModules.length > 0) {
        const { data: currentAccess } = await supabase
          .from('training_access')
          .select('module_id')
          .eq('user_id', profile.id);

        const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
        const missingAccess = expectedModules.filter(m => !currentModuleIds.has(m.id));

        if (missingAccess.length > 0) {
          console.log(`   ❌ ${email}: ${missingAccess.length} accès manquant(s)`);
          usersWithIssues++;
          allChecksPassed = false;
        }
      }
    }
  }

  if (usersWithIssues === 0) {
    console.log(`✅ Tous les utilisateurs corrigés ont leurs accès corrects`);
  }

  // ========================================================================
  // 4. VÉRIFICATION DE LA SUPPRESSION DES COMPTES DE TEST
  // ========================================================================
  console.log(`\n${'='.repeat(80)}`);
  console.log('4️⃣  VÉRIFICATION DE LA SUPPRESSION DES COMPTES DE TEST');
  console.log('='.repeat(80));

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('email, full_name, role');

  const testAccounts = allProfiles?.filter(p => {
    // Exclure les admins
    if (p.role === 'admin' || p.role === 'developer') return false;
    return isTestAccount(p.email, p.full_name);
  }) || [];

  if (testAccounts.length > 0) {
    console.log(`❌ ERREUR: ${testAccounts.length} compte(s) de test encore présent(s):`);
    testAccounts.forEach(acc => {
      console.log(`   - ${acc.email} (${acc.full_name || 'N/A'})`);
    });
    allChecksPassed = false;
  } else {
    console.log(`✅ Aucun compte de test trouvé (tous supprimés)`);
  }

  // ========================================================================
  // 5. VÉRIFICATION GLOBALE DES UTILISATEURS AVEC LICENCE
  // ========================================================================
  console.log(`\n${'='.repeat(80)}`);
  console.log('5️⃣  VÉRIFICATION GLOBALE DES UTILISATEURS AVEC LICENCE');
  console.log('='.repeat(80));

  const { data: profilesWithLicense } = await supabase
    .from('profiles')
    .select('id, email, license, role')
    .not('license', 'is', null)
    .neq('license', 'none')
    .eq('role', 'client');

  const { data: allModules } = await supabase
    .from('training_modules')
    .select('id, title, required_license')
    .eq('is_active', true);

  let totalUsersWithIssues = 0;
  let totalUsersChecked = 0;

  if (profilesWithLicense && profilesWithLicense.length > 0) {
    for (const profile of profilesWithLicense) {
      const userSystemLicense = profileToSystemLicense(profile.license);
      const expectedModules = allModules?.filter(module => {
        const moduleRequiredLicense = module.required_license || 'starter';
        return hasLicenseAccess(userSystemLicense, moduleRequiredLicense);
      }) || [];

      if (expectedModules.length > 0) {
        totalUsersChecked++;
        const { data: currentAccess } = await supabase
          .from('training_access')
          .select('module_id')
          .eq('user_id', profile.id);

        const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
        const missingAccess = expectedModules.filter(m => !currentModuleIds.has(m.id));

        if (missingAccess.length > 0) {
          totalUsersWithIssues++;
        }
      }
    }

    console.log(`📊 Statistiques:`);
    console.log(`   Utilisateurs avec licence vérifiés: ${totalUsersChecked}`);
    console.log(`   Utilisateurs avec problèmes: ${totalUsersWithIssues}`);

    if (totalUsersWithIssues > 0) {
      console.log(`   ⚠️  ${totalUsersWithIssues} utilisateur(s) ont encore des accès manquants`);
      allChecksPassed = false;
    } else {
      console.log(`   ✅ Tous les utilisateurs avec licence ont leurs accès corrects`);
    }
  }

  // ========================================================================
  // RÉSUMÉ FINAL
  // ========================================================================
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ FINAL');
  console.log('='.repeat(80));

  if (allChecksPassed) {
    console.log(`\n✅ TOUTES LES VÉRIFICATIONS SONT PASSÉES AVEC SUCCÈS !\n`);
    console.log(`✅ Le compte admin est restauré et protégé`);
    console.log(`✅ Les accès d'Armandino sont corrects`);
    console.log(`✅ Tous les comptes de test ont été supprimés`);
    console.log(`✅ Les utilisateurs avec licence ont leurs accès corrects\n`);
  } else {
    console.log(`\n❌ CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ\n`);
    console.log(`⚠️  Veuillez corriger les problèmes identifiés ci-dessus\n`);
    process.exit(1);
  }
}

verifyAllChanges().catch(console.error);










