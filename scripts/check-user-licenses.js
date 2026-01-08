/**
 * Script pour vérifier les licences des utilisateurs
 * Utilise la service_role key pour bypasser les RLS
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
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erreur: Variables d\'environnement requises');
  console.log('   SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Email spécifique à vérifier (passé en argument)
const targetEmail = process.argv[2];

console.log('🔍 VÉRIFICATION DES LICENCES UTILISATEURS\n');
console.log('='.repeat(70));

async function checkLicenses() {
  try {
    let query = supabase
      .from('profiles')
      .select('id, email, role, license, license_valid_until, created_at')
      .order('created_at', { ascending: false });
    
    if (targetEmail) {
      query = query.ilike('email', `%${targetEmail}%`);
      console.log(`\n🔎 Recherche de: ${targetEmail}\n`);
    } else {
      query = query.limit(50);
      console.log('\n📋 50 derniers utilisateurs:\n');
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  Aucun profil trouvé');
      return;
    }

    // Statistiques
    const stats = {
      total: profiles.length,
      none: 0,
      entree: 0,
      transformation: 0,
      immersion: 0,
      admins: 0,
      clients: 0
    };

    console.log('-'.repeat(70));
    profiles.forEach(p => {
      const roleIcon = p.role === 'admin' || p.role === 'developer' ? '👑' : '👤';
      const licenseIcon = p.license && p.license !== 'none' ? '✅' : '❌';
      
      // Mapping licence -> accès modules
      let accessLevel = 'Aucun accès';
      if (p.role === 'admin' || p.role === 'developer') {
        accessLevel = '🔓 TOUT (admin)';
        stats.admins++;
      } else {
        stats.clients++;
        switch (p.license) {
          case 'immersion':
            accessLevel = '🔓 starter + pro + elite';
            stats.immersion++;
            break;
          case 'transformation':
            accessLevel = '🔓 starter + pro';
            stats.transformation++;
            break;
          case 'entree':
            accessLevel = '🔓 starter uniquement';
            stats.entree++;
            break;
          default:
            accessLevel = '🔒 Aucun accès';
            stats.none++;
        }
      }
      
      console.log(`${roleIcon} ${licenseIcon} ${p.email}`);
      console.log(`   Role: ${p.role} | License: ${p.license || 'NULL'}`);
      console.log(`   Accès: ${accessLevel}`);
      if (p.license_valid_until) {
        const validUntil = new Date(p.license_valid_until);
        const now = new Date();
        const isExpired = validUntil < now;
        console.log(`   Valide jusqu'au: ${validUntil.toLocaleDateString()} ${isExpired ? '⚠️ EXPIRÉ' : '✅'}`);
      }
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('📊 STATISTIQUES');
    console.log('-'.repeat(70));
    console.log(`   Total: ${stats.total}`);
    console.log(`   Admins/Developers: ${stats.admins}`);
    console.log(`   Clients: ${stats.clients}`);
    console.log(`     - Sans licence (none/null): ${stats.none}`);
    console.log(`     - Entrée (starter): ${stats.entree}`);
    console.log(`     - Transformation (pro): ${stats.transformation}`);
    console.log(`     - Immersion (elite): ${stats.immersion}`);

    // Rappel des modules et leurs required_license
    console.log('\n📚 RAPPEL - MODULES ET LICENCES REQUISES');
    console.log('-'.repeat(70));
    
    const { data: modules } = await supabase
      .from('training_modules')
      .select('title, required_license, is_active');
    
    if (modules) {
      modules.forEach(m => {
        const status = m.is_active ? '🟢' : '🔴';
        console.log(`   ${status} [${m.required_license}] ${m.title}`);
      });
    }

    console.log('\n💡 PROBLÈME POTENTIEL:');
    console.log('-'.repeat(70));
    if (stats.none > 0) {
      console.log(`   ⚠️  ${stats.none} utilisateurs n'ont pas de licence!`);
      console.log('   → Ils ne peuvent accéder à aucune formation.');
      console.log('   → Vérifier si le webhook Stripe a bien mis à jour leur licence.');
    }
    if (stats.entree > 0) {
      console.log(`   ℹ️  ${stats.entree} utilisateurs ont la licence "entree" (starter).`);
      console.log('   → Ils n\'ont accès qu\'aux modules avec required_license = "starter".');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

checkLicenses()
  .then(() => {
    console.log('\n🏁 Vérification terminée.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

