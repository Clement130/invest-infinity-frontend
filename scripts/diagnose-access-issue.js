/**
 * Script de diagnostic pour identifier pourquoi les clients n'ont plus accès aux formations
 * 
 * Vérifie:
 * 1. Les licences des utilisateurs dans profiles
 * 2. Les required_license des modules
 * 3. La logique de hasLicenseAccess
 */

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

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: Variables d\'environnement SUPABASE_URL et SUPABASE_ANON_KEY requises');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DIAGNOSTIC: Accès aux formations\n');
console.log('='.repeat(70));

async function diagnose() {
  try {
    // 1. Vérifier les modules et leur required_license
    console.log('\n📋 1. MODULES DE FORMATION');
    console.log('-'.repeat(70));
    
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, required_license, is_active');

    if (modulesError) {
      console.error('❌ Erreur lors de la récupération des modules:', modulesError.message);
    } else {
      console.log(`\n📚 ${modules?.length || 0} modules trouvés:\n`);
      
      const modulesWithoutLicense = [];
      const modulesWithInvalidLicense = [];
      
      modules?.forEach(m => {
        const validLicenses = ['starter', 'pro', 'elite'];
        const licenseStatus = !m.required_license 
          ? '⚠️  SANS LICENCE' 
          : !validLicenses.includes(m.required_license)
            ? '❌ LICENCE INVALIDE'
            : '✅';
        
        const activeStatus = m.is_active === true ? '🟢' : m.is_active === false ? '🔴' : '⚪';
        console.log(`   ${licenseStatus} ${activeStatus} [${m.required_license || 'NULL'}] ${m.title} (is_active: ${m.is_active})`);
        
        if (!m.required_license) {
          modulesWithoutLicense.push(m);
        } else if (!validLicenses.includes(m.required_license)) {
          modulesWithInvalidLicense.push(m);
        }
      });
      
      if (modulesWithoutLicense.length > 0) {
        console.log(`\n⚠️  PROBLÈME DÉTECTÉ: ${modulesWithoutLicense.length} modules sans required_license!`);
        console.log('   Ces modules seront INACCESSIBLES à tous les clients (sécurité par défaut).');
        console.log('\n   Solution SQL pour corriger:');
        modulesWithoutLicense.forEach(m => {
          console.log(`   UPDATE training_modules SET required_license = 'starter' WHERE id = '${m.id}';`);
        });
      }
      
      if (modulesWithInvalidLicense.length > 0) {
        console.log(`\n❌ PROBLÈME DÉTECTÉ: ${modulesWithInvalidLicense.length} modules avec licence invalide!`);
        modulesWithInvalidLicense.forEach(m => {
          console.log(`   - ${m.title}: "${m.required_license}" (devrait être starter, pro ou elite)`);
        });
      }
    }

    // 2. Vérifier les profils utilisateurs et leurs licences
    console.log('\n\n📋 2. PROFILS UTILISATEURS');
    console.log('-'.repeat(70));
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, license, license_valid_until')
      .order('created_at', { ascending: false })
      .limit(50);

    if (profilesError) {
      console.error('❌ Erreur lors de la récupération des profils:', profilesError.message);
    } else {
      console.log(`\n👥 ${profiles?.length || 0} profils récents:\n`);
      
      const licenseStats = {
        none: 0,
        entree: 0,
        transformation: 0,
        immersion: 0,
        other: 0
      };
      
      const profilesWithoutLicense = [];
      
      profiles?.forEach(p => {
        const license = p.license || 'none';
        if (licenseStats.hasOwnProperty(license)) {
          licenseStats[license]++;
        } else {
          licenseStats.other++;
        }
        
        if (!p.license || p.license === 'none') {
          profilesWithoutLicense.push(p);
        }
        
        const roleIcon = p.role === 'admin' || p.role === 'developer' ? '👑' : '👤';
        const licenseIcon = p.license && p.license !== 'none' ? '✅' : '❌';
        console.log(`   ${roleIcon} ${licenseIcon} ${p.email} | role: ${p.role} | license: ${p.license || 'NULL'}`);
      });
      
      console.log('\n📊 Statistiques des licences:');
      console.log(`   - none/null: ${licenseStats.none}`);
      console.log(`   - entree (starter): ${licenseStats.entree}`);
      console.log(`   - transformation (pro): ${licenseStats.transformation}`);
      console.log(`   - immersion (elite): ${licenseStats.immersion}`);
      if (licenseStats.other > 0) {
        console.log(`   - autre valeur invalide: ${licenseStats.other}`);
      }
      
      if (profilesWithoutLicense.length > 0) {
        console.log(`\n⚠️  ${profilesWithoutLicense.length} utilisateurs sans licence (role=client)`);
      }
    }

    // 3. Vérifier les leçons
    console.log('\n\n📋 3. LEÇONS');
    console.log('-'.repeat(70));
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, module_id')
      .limit(20);

    if (lessonsError) {
      console.error('❌ Erreur lors de la récupération des leçons:', lessonsError.message);
    } else {
      console.log(`\n📖 ${lessons?.length || 0} leçons (échantillon):\n`);
      lessons?.slice(0, 10).forEach(l => {
        console.log(`   - ${l.title} (module: ${l.module_id?.substring(0, 8)}...)`);
      });
    }

    // 4. Résumé et recommandations
    console.log('\n\n' + '='.repeat(70));
    console.log('📝 RÉSUMÉ ET RECOMMANDATIONS');
    console.log('='.repeat(70));
    
    const hasModulesWithoutLicense = modules?.some(m => !m.required_license);
    const hasModulesWithInvalidLicense = modules?.some(m => m.required_license && !['starter', 'pro', 'elite'].includes(m.required_license));
    
    if (hasModulesWithoutLicense) {
      console.log('\n🔴 PROBLÈME CRITIQUE: Certains modules n\'ont pas de required_license défini.');
      console.log('   → Le code de sécurité refuse l\'accès aux modules sans licence définie.');
      console.log('   → Solution: Définir required_license pour tous les modules.\n');
      console.log('   SQL à exécuter:');
      console.log('   UPDATE training_modules SET required_license = \'starter\' WHERE required_license IS NULL;');
    }
    
    if (hasModulesWithInvalidLicense) {
      console.log('\n🔴 PROBLÈME: Certains modules ont une valeur de licence invalide.');
      console.log('   → Valeurs valides: starter, pro, elite');
    }
    
    if (!hasModulesWithoutLicense && !hasModulesWithInvalidLicense) {
      console.log('\n✅ Les modules semblent correctement configurés.');
      console.log('   Si le problème persiste, vérifier:');
      console.log('   1. La licence de l\'utilisateur spécifique');
      console.log('   2. Les logs de la console navigateur');
      console.log('   3. Le chargement du profil dans AuthContext');
    }

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error);
  }
}

diagnose()
  .then(() => {
    console.log('\n\n🏁 Diagnostic terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

