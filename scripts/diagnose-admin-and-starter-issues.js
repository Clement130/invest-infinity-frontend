#!/usr/bin/env node

/**
 * Script de diagnostic pour identifier les problèmes :
 * 1. Admin ne peut plus se connecter
 * 2. Starter donne accès à tous les modules
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Diagnostic des Problèmes Admin et Starter\n');
console.log('='.repeat(60));

// ============================================
// 1. VÉRIFIER LES ADMINS
// ============================================
async function checkAdmins() {
  console.log('\n📋 1. Vérification des Admins');
  console.log('-'.repeat(60));

  // Récupérer tous les admins
  const { data: admins, error } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .in('role', ['admin', 'developer'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur lors de la récupération des admins:', error.message);
    return;
  }

  if (!admins || admins.length === 0) {
    console.log('⚠️  Aucun admin trouvé dans la base de données');
    return;
  }

  console.log(`✅ ${admins.length} admin(s) trouvé(s):\n`);
  admins.forEach((admin, index) => {
    console.log(`   ${index + 1}. ${admin.email}`);
    console.log(`      - Rôle: ${admin.role}`);
    console.log(`      - ID: ${admin.id}`);
    console.log('');
  });

  // Vérifier les emails super admin
  const superAdminEmails = ['investinfinityfr@gmail.com', 'butcher13550@gmail.com'];
  console.log('\n🔐 Emails Super Admin configurés dans le code:');
  superAdminEmails.forEach(email => {
    const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (found) {
      console.log(`   ✅ ${email} - Trouvé (rôle: ${found.role})`);
    } else {
      console.log(`   ⚠️  ${email} - Non trouvé dans la base`);
    }
  });
}

// ============================================
// 2. VÉRIFIER LES MODULES ET LEURS LICENCES
// ============================================
async function checkModules() {
  console.log('\n📋 2. Vérification des Modules et Licences Requises');
  console.log('-'.repeat(60));

  const { data: modules, error } = await supabase
    .from('training_modules')
    .select('id, title, required_license, is_active, position')
    .order('position');

  if (error) {
    console.error('❌ Erreur lors de la récupération des modules:', error.message);
    return;
  }

  if (!modules || modules.length === 0) {
    console.log('⚠️  Aucun module trouvé');
    return;
  }

  console.log(`✅ ${modules.length} module(s) trouvé(s):\n`);

  const modulesByLicense = {
    starter: [],
    pro: [],
    elite: [],
    null: [],
    other: [],
  };

  modules.forEach(module => {
    const license = module.required_license;
    if (!license || license === 'null' || license === '') {
      modulesByLicense.null.push(module);
    } else if (license === 'starter') {
      modulesByLicense.starter.push(module);
    } else if (license === 'pro') {
      modulesByLicense.pro.push(module);
    } else if (license === 'elite') {
      modulesByLicense.elite.push(module);
    } else {
      modulesByLicense.other.push(module);
    }
  });

  console.log('📊 Répartition par licence requise:');
  console.log(`   🟢 Starter: ${modulesByLicense.starter.length} module(s)`);
  modulesByLicense.starter.forEach(m => {
    console.log(`      - ${m.title} (ID: ${m.id})`);
  });

  console.log(`   🟡 Pro: ${modulesByLicense.pro.length} module(s)`);
  modulesByLicense.pro.forEach(m => {
    console.log(`      - ${m.title} (ID: ${m.id})`);
  });

  console.log(`   🔴 Elite: ${modulesByLicense.elite.length} module(s)`);
  modulesByLicense.elite.forEach(m => {
    console.log(`      - ${m.title} (ID: ${m.id})`);
  });

  if (modulesByLicense.null.length > 0) {
    console.log(`\n   ⚠️  PROBLÈME: ${modulesByLicense.null.length} module(s) sans required_license:`);
    modulesByLicense.null.forEach(m => {
      console.log(`      - ${m.title} (ID: ${m.id})`);
      console.log(`        ⚠️  Ces modules seront accessibles à TOUS (fallback 'starter' dans le code)`);
    });
  }

  if (modulesByLicense.other.length > 0) {
    console.log(`\n   ⚠️  PROBLÈME: ${modulesByLicense.other.length} module(s) avec une licence invalide:`);
    modulesByLicense.other.forEach(m => {
      console.log(`      - ${m.title} (ID: ${m.id}, licence: "${m.required_license}")`);
    });
  }
}

// ============================================
// 3. VÉRIFIER LES UTILISATEURS STARTER
// ============================================
async function checkStarterUsers() {
  console.log('\n📋 3. Vérification des Utilisateurs Starter');
  console.log('-'.repeat(60));

  // Récupérer les utilisateurs Starter
  const { data: starterUsers, error } = await supabase
    .from('profiles')
    .select('id, email, license, created_at')
    .in('license', ['entree', 'starter'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs Starter:', error.message);
    return;
  }

  if (!starterUsers || starterUsers.length === 0) {
    console.log('⚠️  Aucun utilisateur Starter trouvé');
    return;
  }

  console.log(`✅ ${starterUsers.length} utilisateur(s) Starter trouvé(s) (affichage des 10 premiers):\n`);

  // Récupérer tous les modules
  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, title, required_license');

  if (!modules) {
    console.log('⚠️  Impossible de récupérer les modules pour le test');
    return;
  }

  // Tester l'accès pour chaque utilisateur Starter
  for (const user of starterUsers.slice(0, 3)) { // Tester seulement les 3 premiers
    console.log(`\n👤 ${user.email} (licence: ${user.license}):`);
    
    // Simuler la logique d'accès
    const userSystemLicense = user.license === 'entree' ? 'starter' : user.license;
    
    const accessibleModules = modules.filter(module => {
      const moduleLicense = module.required_license || 'starter'; // Fallback problématique
      
      // Hiérarchie: starter=1, pro=2, elite=3
      const weights = { starter: 1, pro: 2, elite: 3, none: 0 };
      const userWeight = weights[userSystemLicense] || 0;
      const moduleWeight = weights[moduleLicense] || 1;
      
      return userWeight >= moduleWeight;
    });

    console.log(`   Modules accessibles: ${accessibleModules.length}/${modules.length}`);
    
    // Vérifier s'il a accès à des modules Pro ou Elite
    const proModules = accessibleModules.filter(m => m.required_license === 'pro');
    const eliteModules = accessibleModules.filter(m => m.required_license === 'elite');
    const nullModules = accessibleModules.filter(m => !m.required_license || m.required_license === 'null');

    if (proModules.length > 0) {
      console.log(`   ⚠️  PROBLÈME: Accès à ${proModules.length} module(s) Pro:`);
      proModules.forEach(m => {
        console.log(`      - ${m.title}`);
      });
    }

    if (eliteModules.length > 0) {
      console.log(`   ⚠️  PROBLÈME: Accès à ${eliteModules.length} module(s) Elite:`);
      eliteModules.forEach(m => {
        console.log(`      - ${m.title}`);
      });
    }

    if (nullModules.length > 0) {
      console.log(`   ⚠️  PROBLÈME: Accès à ${nullModules.length} module(s) sans required_license:`);
      nullModules.forEach(m => {
        console.log(`      - ${m.title} (fallback 'starter' appliqué)`);
      });
    }
  }
}

// ============================================
// 4. VÉRIFIER LA CONFIGURATION DU CODE
// ============================================
async function checkCodeConfiguration() {
  console.log('\n📋 4. Vérification de la Configuration du Code');
  console.log('-'.repeat(60));

  const fs = await import('fs');
  const path = join(__dirname, '..', 'src', 'lib', 'auth.ts');
  
  try {
    const authCode = fs.readFileSync(path, 'utf-8');
    const superAdminEmails = authCode.match(/superAdmins\s*=\s*\[(.*?)\]/s);
    
    if (superAdminEmails) {
      console.log('✅ Emails Super Admin dans auth.ts:');
      console.log(`   ${superAdminEmails[1]}`);
    } else {
      console.log('⚠️  Impossible de trouver la liste des super admins dans auth.ts');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de auth.ts:', error.message);
  }

  // Vérifier useEntitlements.ts
  const entitlementsPath = join(__dirname, '..', 'src', 'hooks', 'useEntitlements.ts');
  try {
    const entitlementsCode = fs.readFileSync(entitlementsPath, 'utf-8');
    const fallbackMatch = entitlementsCode.match(/required_license\s*\|\|\s*['"](.*?)['"]/);
    
    if (fallbackMatch) {
      console.log(`\n⚠️  PROBLÈME TROUVÉ dans useEntitlements.ts:`);
      console.log(`   Fallback détecté: module.required_license || '${fallbackMatch[1]}'`);
      console.log(`   ⚠️  Les modules sans required_license seront accessibles aux Starter par défaut !`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de useEntitlements.ts:', error.message);
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  await checkAdmins();
  await checkModules();
  await checkStarterUsers();
  await checkCodeConfiguration();

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Diagnostic terminé\n');
  
  console.log('📝 Résumé des problèmes potentiels:');
  console.log('   1. Vérifiez que les emails admin sont corrects dans src/lib/auth.ts');
  console.log('   2. Vérifiez que tous les modules ont un required_license défini');
  console.log('   3. Vérifiez le fallback dans useEntitlements.ts (ligne 103)');
  console.log('   4. Vérifiez que la migration 20251205000000_fix_starter_module_access.sql a été appliquée\n');
}

main().catch(console.error);

