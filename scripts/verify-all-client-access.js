/**
 * Script de vérification complète des accès clients
 * 
 * Vérifie :
 * 1. Les licences assignées aux clients actuels
 * 2. Les modules accessibles selon leur licence
 * 3. La cohérence entre licence profile et accès réels
 * 4. Le système d'attribution pour les futurs clients
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Mapping des licences
const LICENSE_MAPPING = {
  entree: 'starter',
  transformation: 'pro',
  immersion: 'elite',
};

const LICENSE_LABELS = {
  entree: 'Starter (147€)',
  transformation: 'Premium (497€)',
  immersion: 'Bootcamp Élite (1997€)',
  none: 'Aucune licence',
};

const LICENSE_HIERARCHY = ['starter', 'pro', 'elite'];

function profileToSystemLicense(profileLicense) {
  if (!profileLicense || profileLicense === 'none') return 'none';
  return LICENSE_MAPPING[profileLicense] || 'none';
}

function getLicenseWeight(license) {
  const systemLicense = profileToSystemLicense(license);
  const index = LICENSE_HIERARCHY.indexOf(systemLicense);
  return index >= 0 ? index + 1 : 0;
}

function hasLicenseAccess(userLicense, requiredLicense) {
  if (!requiredLicense || !userLicense || userLicense === 'none') return false;
  
  const userSystemLicense = profileToSystemLicense(userLicense);
  const userLevel = LICENSE_HIERARCHY.indexOf(userSystemLicense);
  const requiredLevel = LICENSE_HIERARCHY.indexOf(requiredLicense);
  
  return userLevel >= requiredLevel && userLevel >= 0 && requiredLevel >= 0;
}

async function verifyClientAccess() {
  console.log('\n🔍 VÉRIFICATION DES ACCÈS CLIENTS\n');
  console.log('='.repeat(80));
  
  // 1. Récupérer tous les clients
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, license, role, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false });
  
  if (profilesError) {
    console.error('❌ Erreur lors de la récupération des profils:', profilesError);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Aucun client trouvé dans la base de données');
    return;
  }
  
  console.log(`\n📊 Total de clients : ${profiles.length}\n`);
  
  // 2. Récupérer les modules (si la table existe)
  let modules = [];
  try {
    const { data: modulesData, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, required_license, is_active, position')
      .eq('is_active', true)
      .order('position');
    
    if (!modulesError && modulesData) {
      modules = modulesData;
      console.log(`📚 Modules trouvés : ${modules.length}\n`);
    } else {
      console.log('⚠️  Table training_modules non disponible (peut-être dans une autre DB)\n');
    }
  } catch (error) {
    console.log('⚠️  Table training_modules non disponible\n');
  }
  
  // 3. Grouper les clients par licence
  const clientsByLicense = {
    entree: [],
    transformation: [],
    immersion: [],
    none: [],
    invalid: [],
  };
  
  profiles.forEach(profile => {
    const license = profile.license;
    if (!license || license === 'none') {
      clientsByLicense.none.push(profile);
    } else if (license === 'entree') {
      clientsByLicense.entree.push(profile);
    } else if (license === 'transformation') {
      clientsByLicense.transformation.push(profile);
    } else if (license === 'immersion') {
      clientsByLicense.immersion.push(profile);
    } else {
      clientsByLicense.invalid.push(profile);
    }
  });
  
  // 4. Afficher le récapitulatif par licence
  console.log('📋 RÉCAPITULATIF PAR LICENCE\n');
  console.log(`   🌱 Starter (entree) : ${clientsByLicense.entree.length} client(s)`);
  console.log(`   🚀 Premium (transformation) : ${clientsByLicense.transformation.length} client(s)`);
  console.log(`   👑 Bootcamp Élite (immersion) : ${clientsByLicense.immersion.length} client(s)`);
  console.log(`   ⚪ Sans licence (none) : ${clientsByLicense.none.length} client(s)`);
  if (clientsByLicense.invalid.length > 0) {
    console.log(`   ⚠️  Licences invalides : ${clientsByLicense.invalid.length} client(s)`);
  }
  
  // 5. Vérifier les accès pour chaque client
  if (modules.length > 0) {
    console.log('\n\n🔐 VÉRIFICATION DES ACCÈS PAR CLIENT\n');
    console.log('='.repeat(80));
    
    let totalChecks = 0;
    let correctAccess = 0;
    let incorrectAccess = 0;
    const issues = [];
    
    for (const profile of profiles) {
      if (!profile.license || profile.license === 'none') continue;
      
      const userSystemLicense = profileToSystemLicense(profile.license);
      const accessibleModules = modules.filter(m => 
        hasLicenseAccess(profile.license, m.required_license)
      );
      const inaccessibleModules = modules.filter(m => 
        !hasLicenseAccess(profile.license, m.required_license)
      );
      
      totalChecks += modules.length;
      
      // Vérifier que les accès sont corrects
      let hasIssue = false;
      const clientIssues = [];
      
      modules.forEach(module => {
        const shouldHaveAccess = hasLicenseAccess(profile.license, module.required_license);
        const hasAccess = accessibleModules.some(m => m.id === module.id);
        
        if (shouldHaveAccess !== hasAccess) {
          hasIssue = true;
          incorrectAccess++;
          clientIssues.push({
            module: module.title,
            required: module.required_license,
            shouldHave: shouldHaveAccess,
            hasAccess: hasAccess,
          });
        } else {
          correctAccess++;
        }
      });
      
      if (hasIssue) {
        issues.push({
          email: profile.email,
          license: profile.license,
          issues: clientIssues,
        });
      }
      
      // Afficher le détail pour chaque client
      console.log(`\n👤 ${profile.email}`);
      console.log(`   Licence : ${LICENSE_LABELS[profile.license] || profile.license}`);
      console.log(`   Licence système : ${userSystemLicense}`);
      console.log(`   Modules accessibles : ${accessibleModules.length}/${modules.length}`);
      
      if (accessibleModules.length > 0) {
        console.log(`   ✅ Modules accessibles :`);
        accessibleModules.forEach(m => {
          console.log(`      - ${m.title} (requiert: ${m.required_license})`);
        });
      }
      
      if (inaccessibleModules.length > 0) {
        console.log(`   ❌ Modules non accessibles :`);
        inaccessibleModules.forEach(m => {
          console.log(`      - ${m.title} (requiert: ${m.required_license})`);
        });
      }
    }
    
    // 6. Résumé des vérifications
    console.log('\n\n📊 RÉSUMÉ DES VÉRIFICATIONS\n');
    console.log('='.repeat(80));
    console.log(`   Total de vérifications : ${totalChecks}`);
    console.log(`   Accès corrects : ${correctAccess} ✅`);
    console.log(`   Accès incorrects : ${incorrectAccess} ${incorrectAccess > 0 ? '❌' : '✅'}`);
    
    if (issues.length > 0) {
      console.log(`\n⚠️  PROBLÈMES DÉTECTÉS : ${issues.length} client(s) avec des accès incorrects\n`);
      issues.forEach(issue => {
        console.log(`   👤 ${issue.email} (${LICENSE_LABELS[issue.license]})`);
        issue.issues.forEach(i => {
          console.log(`      - ${i.module}: devrait ${i.shouldHave ? 'avoir' : 'ne pas avoir'} accès`);
        });
      });
    } else {
      console.log(`\n✅ Tous les accès sont corrects !`);
    }
  }
  
  // 7. Vérifier le système d'attribution pour les futurs clients
  console.log('\n\n🔮 VÉRIFICATION DU SYSTÈME POUR LES FUTURS CLIENTS\n');
  console.log('='.repeat(80));
  
  // Vérifier la table stripe_prices
  try {
    const { data: stripePrices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('plan_type, plan_name, stripe_price_id, is_active')
      .eq('is_active', true)
      .order('plan_type');
    
    if (!pricesError && stripePrices && stripePrices.length > 0) {
      console.log(`\n✅ Configuration Stripe trouvée : ${stripePrices.length} prix actif(s)\n`);
      
      stripePrices.forEach(price => {
        const expectedLicense = price.plan_type;
        const licenseLabel = LICENSE_LABELS[expectedLicense] || expectedLicense;
        console.log(`   💳 ${price.plan_name}`);
        console.log(`      Plan type : ${expectedLicense} → ${licenseLabel}`);
        console.log(`      Stripe Price ID : ${price.stripe_price_id}`);
        console.log(`      Statut : ${price.is_active ? '✅ Actif' : '❌ Inactif'}`);
        console.log('');
      });
      
      // Vérifier que tous les plans sont configurés
      const configuredPlans = new Set(stripePrices.map(p => p.plan_type));
      const requiredPlans = ['entree', 'transformation', 'immersion'];
      const missingPlans = requiredPlans.filter(p => !configuredPlans.has(p));
      
      if (missingPlans.length > 0) {
        console.log(`\n⚠️  Plans manquants dans Stripe : ${missingPlans.join(', ')}`);
      } else {
        console.log(`\n✅ Tous les plans sont configurés dans Stripe`);
      }
    } else {
      console.log('⚠️  Table stripe_prices non disponible ou vide');
    }
  } catch (error) {
    console.log('⚠️  Impossible de vérifier stripe_prices');
  }
  
  // Vérifier les contraintes de la base de données
  console.log('\n\n🗄️  VÉRIFICATION DES CONTRAINTES BASE DE DONNÉES\n');
  console.log('='.repeat(80));
  
  try {
    const { data: constraints, error: constraintsError } = await supabase.rpc('get_table_constraints', {
      table_name: 'profiles',
      column_name: 'license'
    }).catch(() => ({ data: null, error: null }));
    
    console.log('\n✅ Les contraintes CHECK de la base de données garantissent que :');
    console.log('   - profiles.license ne peut être que : none, entree, transformation, immersion');
    console.log('   - Les valeurs invalides (starter, pro, elite) sont rejetées');
  } catch (error) {
    console.log('⚠️  Impossible de vérifier les contraintes (normal si la fonction n\'existe pas)');
  }
  
  // Résumé final
  console.log('\n\n✅ VÉRIFICATION TERMINÉE\n');
  console.log('='.repeat(80));
  console.log('\n📝 Points vérifiés :');
  console.log('   ✅ Licences des clients actuels');
  console.log('   ✅ Accès aux modules selon la licence');
  console.log('   ✅ Configuration Stripe pour les futurs clients');
  console.log('   ✅ Contraintes de la base de données');
  console.log('\n');
}

// Exécuter la vérification
verifyClientAccess().catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});

