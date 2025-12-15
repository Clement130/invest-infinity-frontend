/**
 * Script de vérification des accès clients en PRODUCTION
 * 
 * Vérifie :
 * 1. Les clients avec des licences invalides
 * 2. Les clients avec des accès qu'ils ne devraient pas avoir
 * 3. Les clients qui devraient avoir des accès mais n'en ont pas
 * 
 * Usage:
 *   node scripts/verify-production-client-access.js
 * 
 * Variables d'environnement requises:
 *   VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
 *   VITE_SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction pour charger les variables d'environnement depuis .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://vveswlmcgmizmjsriezw.supabase.co';
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                                env.SUPABASE_SERVICE_ROLE_KEY || 
                                process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                                process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_ROLE_KEY doit être défini');
  console.error('   Cette clé est nécessaire pour vérifier les accès en production');
  console.error('   Ajoutez-la dans .env.local : VITE_SUPABASE_SERVICE_ROLE_KEY=votre_cle_ici');
  console.error('   Ou récupérez-la depuis : Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Mapping des licences
const PROFILE_TO_SYSTEM = {
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

const SYSTEM_HIERARCHY = ['starter', 'pro', 'elite'];

function profileToSystem(profileLicense) {
  if (!profileLicense || profileLicense === 'none') return 'none';
  return PROFILE_TO_SYSTEM[profileLicense] || 'none';
}

function getLicenseLevel(license) {
  const systemLicense = profileToSystem(license);
  return SYSTEM_HIERARCHY.indexOf(systemLicense);
}

function hasAccess(userProfileLicense, moduleRequiredLicense) {
  if (!moduleRequiredLicense || !userProfileLicense || userProfileLicense === 'none') {
    return false;
  }
  
  const userLevel = getLicenseLevel(userProfileLicense);
  const requiredLevel = SYSTEM_HIERARCHY.indexOf(moduleRequiredLicense);
  
  return userLevel >= requiredLevel && userLevel >= 0 && requiredLevel >= 0;
}

async function verifyProductionAccess() {
  console.log('\n🔍 VÉRIFICATION DES ACCÈS CLIENTS EN PRODUCTION\n');
  console.log('='.repeat(80));
  console.log(`📡 Connexion à : ${supabaseUrl}\n`);
  
  // 1. Vérifier les clients et leurs licences
  console.log('📊 Étape 1 : Récupération des clients...\n');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, license, role, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false });
  
  if (profilesError) {
    console.error('❌ Erreur lors de la récupération des profils:', profilesError.message);
    
    if (profilesError.message.includes('license')) {
      console.error('\n⚠️  La colonne "license" n\'existe pas dans cette base de données.');
      console.error('   Cela peut signifier que :');
      console.error('   1. Vous êtes connecté à la mauvaise base de données');
      console.error('   2. La migration n\'a pas été appliquée');
      console.error('   3. La structure de la base est différente');
    }
    
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Aucun client trouvé dans la base de données');
    return;
  }
  
  console.log(`✅ ${profiles.length} client(s) trouvé(s)\n`);
  
  // 2. Vérifier les licences invalides
  console.log('🔍 Étape 2 : Vérification des licences...\n');
  
  const validLicenses = ['none', 'entree', 'transformation', 'immersion'];
  const invalidLicenses = profiles.filter(p => 
    p.license && !validLicenses.includes(p.license)
  );
  
  if (invalidLicenses.length > 0) {
    console.log(`❌ PROBLÈME : ${invalidLicenses.length} client(s) avec des licences invalides\n`);
    invalidLicenses.forEach(client => {
      console.log(`   👤 ${client.email}`);
      console.log(`      Licence actuelle : "${client.license}" (INVALIDE)`);
      console.log(`      Licences valides : ${validLicenses.join(', ')}`);
    });
    console.log('');
  } else {
    console.log('✅ Toutes les licences sont valides\n');
  }
  
  // 3. Vérifier les modules
  console.log('📚 Étape 3 : Récupération des modules...\n');
  
  let modules = [];
  try {
    const { data: modulesData, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, required_license, is_active, position')
      .eq('is_active', true)
      .order('position');
    
    if (modulesError) {
      console.log(`⚠️  Erreur lors de la récupération des modules: ${modulesError.message}`);
      console.log('   La table training_modules n\'existe peut-être pas\n');
    } else if (modulesData) {
      modules = modulesData;
      console.log(`✅ ${modules.length} module(s) actif(s) trouvé(s)\n`);
    }
  } catch (error) {
    console.log('⚠️  Table training_modules non disponible\n');
  }
  
  // 4. Vérifier les accès dans training_access
  if (modules.length > 0) {
    console.log('🔐 Étape 4 : Vérification des accès aux modules...\n');
    
    try {
      // Essayer de récupérer les accès avec une requête simple d'abord
      const { data: accessRecords, error: accessError } = await supabase
        .from('training_access')
        .select('user_id, module_id, access_type, granted_at');
      
      if (accessError) {
        console.log(`⚠️  Table training_access non disponible: ${accessError.message}`);
        console.log('   Les RLS policies gèrent probablement l\'accès directement\n');
        
        // Vérifier les accès théoriques selon les licences
        console.log('🔍 Vérification des accès théoriques selon les licences...\n');
        
        const clientsWithLicense = profiles.filter(p => 
          p.license && p.license !== 'none' && validLicenses.includes(p.license)
        );
        
        console.log(`📋 ${clientsWithLicense.length} client(s) avec licence valide\n`);
        
        // Grouper par licence
        const byLicense = {
          entree: clientsWithLicense.filter(c => c.license === 'entree'),
          transformation: clientsWithLicense.filter(c => c.license === 'transformation'),
          immersion: clientsWithLicense.filter(c => c.license === 'immersion'),
        };
        
        console.log('📊 Répartition des clients par licence :\n');
        console.log(`   🌱 Starter (entree) : ${byLicense.entree.length} client(s)`);
        console.log(`   🚀 Premium (transformation) : ${byLicense.transformation.length} client(s)`);
        console.log(`   👑 Bootcamp Élite (immersion) : ${byLicense.immersion.length} client(s)\n`);
        
        console.log('📚 Modules accessibles par licence :\n');
        
        // Modules Starter
        const starterModules = modules.filter(m => m.required_license === 'starter');
        console.log(`   🌱 Starter devrait avoir accès à :`);
        if (starterModules.length > 0) {
          starterModules.forEach(m => console.log(`      - ${m.title}`));
        } else {
          console.log(`      (Aucun module starter)`);
        }
        console.log('');
        
        // Modules Pro
        const proModules = modules.filter(m => m.required_license === 'pro');
        console.log(`   🚀 Premium devrait avoir accès à :`);
        if (starterModules.length > 0) {
          starterModules.forEach(m => console.log(`      - ${m.title} (starter)`));
        }
        if (proModules.length > 0) {
          proModules.forEach(m => console.log(`      - ${m.title} (pro)`));
        }
        console.log('');
        
        // Modules Elite
        console.log(`   👑 Bootcamp Élite devrait avoir accès à TOUS les modules :`);
        modules.forEach(m => console.log(`      - ${m.title} (${m.required_license})`));
        console.log('');
        
        return;
      } else if (accessRecords && accessRecords.length > 0) {
        console.log(`📋 ${accessRecords.length} accès trouvé(s)\n`);
        
        // Vérifier les accès incorrects
        const incorrectAccess = [];
        
        accessRecords.forEach(access => {
          const profile = access.profiles;
          const module = access.training_modules;
          
          if (!profile || !module) return;
          
          const userLicense = profile.license;
          const moduleRequiredLicense = module.required_license;
          
          if (!hasAccess(userLicense, moduleRequiredLicense)) {
            incorrectAccess.push({
              email: profile.email,
              userLicense: userLicense,
              moduleTitle: module.title,
              moduleRequiredLicense: moduleRequiredLicense,
              grantedAt: access.granted_at,
            });
          }
        });
        
        if (incorrectAccess.length > 0) {
          console.log(`\n❌ PROBLÈME : ${incorrectAccess.length} accès incorrect(s) détecté(s)\n`);
          incorrectAccess.forEach(access => {
            const userLabel = LICENSE_LABELS[access.userLicense] || access.userLicense;
            console.log(`   👤 ${access.email}`);
            console.log(`      Licence : ${userLabel}`);
            console.log(`      Module : ${access.moduleTitle}`);
            console.log(`      Licence requise : ${access.moduleRequiredLicense}`);
            console.log(`      Accès accordé le : ${access.grantedAt}`);
            console.log(`      ❌ Ce client ne devrait PAS avoir accès à ce module`);
            console.log('');
          });
        } else {
          console.log('✅ Tous les accès sont corrects\n');
        }
        
        // Vérifier les clients qui devraient avoir des accès mais n'en ont pas
        console.log('🔍 Étape 5 : Vérification des accès manquants...\n');
        
        const clientsWithLicense = profiles.filter(p => 
          p.license && p.license !== 'none' && validLicenses.includes(p.license)
        );
        
        const missingAccess = [];
        
        clientsWithLicense.forEach(client => {
          const accessibleModules = modules.filter(m => 
            hasAccess(client.license, m.required_license)
          );
          
          accessibleModules.forEach(module => {
            const hasAccessRecord = accessRecords.some(a => 
              a.user_id === client.id && a.module_id === module.id
            );
            
            if (!hasAccessRecord) {
              missingAccess.push({
                email: client.email,
                license: client.license,
                moduleTitle: module.title,
                moduleRequiredLicense: module.required_license,
              });
            }
          });
        });
        
        if (missingAccess.length > 0) {
          console.log(`⚠️  ${missingAccess.length} accès manquant(s) détecté(s)\n`);
          console.log('   Ces clients devraient avoir accès mais n\'ont pas d\'entrée dans training_access:');
          console.log('   (Cela peut être normal si les RLS policies gèrent l\'accès directement)\n');
          
          missingAccess.forEach(access => {
            const licenseLabel = LICENSE_LABELS[access.license] || access.license;
            console.log(`   👤 ${access.email} (${licenseLabel})`);
            console.log(`      Module manquant : ${access.moduleTitle}`);
            console.log('');
          });
        } else {
          console.log('✅ Tous les clients ont les accès nécessaires\n');
        }
      } else {
        console.log('⚠️  Aucun accès trouvé dans training_access');
        console.log('   Cela peut être normal si les RLS policies gèrent l\'accès directement\n');
      }
    } catch (error) {
      console.log(`⚠️  Erreur lors de la vérification des accès: ${error.message}\n`);
    }
  }
  
  // 5. Résumé
  console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION\n');
  console.log('='.repeat(80));
  console.log(`   Total de clients : ${profiles.length}`);
  console.log(`   Clients avec licence valide : ${profiles.filter(p => validLicenses.includes(p.license || 'none')).length}`);
  console.log(`   Clients avec licence invalide : ${invalidLicenses.length}`);
  
  if (modules.length > 0) {
    console.log(`   Modules actifs : ${modules.length}`);
  }
  
  console.log('\n✅ Vérification terminée\n');
}

// Exécuter la vérification
verifyProductionAccess().catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});

