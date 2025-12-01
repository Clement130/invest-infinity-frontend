/**
 * Script pour mettre à jour le plan (licence) d'un utilisateur par email
 * 
 * Usage:
 *   npx tsx scripts/setUserPlan.ts
 *   npx tsx scripts/setUserPlan.ts --email=autre@email.com --plan=transformation
 * 
 * Plans disponibles: entree, transformation, immersion, none
 *   - entree = Starter (147€)
 *   - transformation = Premium (497€)
 *   - immersion = Bootcamp Élite (1997€)
 *   - none = Aucun accès
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Types
type LicenseType = 'none' | 'entree' | 'transformation' | 'immersion';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  license: LicenseType;
  license_valid_until: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string | null;
}

// Configuration par défaut
const DEFAULT_EMAIL = 'mickaelgiliberti@gmail.com';
const DEFAULT_PLAN: LicenseType = 'entree'; // 'entree' = Starter dans la DB

// Mapping pour l'affichage
const PLAN_DISPLAY_NAMES: Record<LicenseType, string> = {
  none: 'Aucun accès',
  entree: 'Starter (147€)',
  transformation: 'Premium (497€)',
  immersion: 'Bootcamp Élite (1997€)',
};

// Charger les variables d'environnement depuis .env.local
function loadEnv(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};
    
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
    console.log('⚠️  Fichier .env.local non trouvé, utilisation des variables d\'environnement système');
    return process.env as Record<string, string>;
  }
}

// Parser les arguments de la ligne de commande
function parseArgs(): { email: string; plan: LicenseType } {
  const args = process.argv.slice(2);
  let email = DEFAULT_EMAIL;
  let plan: LicenseType = DEFAULT_PLAN;
  
  args.forEach(arg => {
    if (arg.startsWith('--email=')) {
      email = arg.replace('--email=', '');
    } else if (arg.startsWith('--plan=')) {
      const planArg = arg.replace('--plan=', '') as LicenseType;
      if (['none', 'entree', 'transformation', 'immersion'].includes(planArg)) {
        plan = planArg;
      } else {
        console.error(`❌ Plan invalide: ${planArg}`);
        console.error('   Plans valides: none, entree, transformation, immersion');
        process.exit(1);
      }
    }
  });
  
  return { email, plan };
}

async function setUserPlan() {
  const { email, plan } = parseArgs();
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           MISE À JOUR DU PLAN UTILISATEUR                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📧 Email: ${email}`);
  console.log(`📦 Nouveau plan: ${PLAN_DISPLAY_NAMES[plan]} (${plan})\n`);
  
  // Charger les variables d'environnement
  const env = loadEnv();
  
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ Erreur: VITE_SUPABASE_URL n\'est pas défini dans .env.local');
    process.exit(1);
  }
  
  if (!supabaseServiceRoleKey) {
    console.error('❌ Erreur: VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini dans .env.local');
    console.error('📝 Récupérez la clé depuis: Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }
  
  // Créer le client Supabase avec service_role key (bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    // Étape 1: Rechercher l'utilisateur par email
    console.log('🔍 Recherche de l\'utilisateur...\n');
    
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (selectError) {
      console.error(`❌ Erreur lors de la recherche: ${selectError.message}`);
      process.exit(1);
    }
    
    if (!profile) {
      console.error(`❌ Utilisateur non trouvé avec l'email: ${email}`);
      console.error('\n💡 Vérifiez que:');
      console.error('   - L\'email est correct');
      console.error('   - L\'utilisateur existe dans la table profiles');
      console.error('   - L\'utilisateur s\'est bien inscrit sur la plateforme');
      
      // Lister les utilisateurs existants pour aider
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('email, license')
        .limit(10);
      
      if (allProfiles && allProfiles.length > 0) {
        console.log('\n📋 Utilisateurs existants (10 premiers):');
        allProfiles.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.email} (${p.license || 'none'})`);
        });
      }
      
      process.exit(1);
    }
    
    // Afficher les informations actuelles
    console.log('✅ User found!\n');
    console.log('📋 Informations actuelles:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Nom: ${profile.full_name || 'Non renseigné'}`);
    console.log(`   Rôle: ${profile.role}`);
    console.log(`   Plan actuel: ${PLAN_DISPLAY_NAMES[profile.license as LicenseType] || profile.license}`);
    console.log(`   Créé le: ${new Date(profile.created_at).toLocaleString('fr-FR')}`);
    console.log('');
    
    // Vérifier si le plan est déjà le bon
    if (profile.license === plan) {
      console.log(`ℹ️  L'utilisateur a déjà le plan "${PLAN_DISPLAY_NAMES[plan]}"`);
      console.log('✅ Aucune modification nécessaire.');
      process.exit(0);
    }
    
    // Étape 2: Mettre à jour le plan
    console.log(`🔄 Mise à jour du plan: ${profile.license || 'none'} → ${plan}...\n`);
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        license: plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();
    
    if (updateError) {
      console.error(`❌ Erreur lors de la mise à jour: ${updateError.message}`);
      process.exit(1);
    }
    
    // Succès !
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SUCCÈS                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ Plan updated to ${PLAN_DISPLAY_NAMES[plan]}!\n`);
    
    console.log('📋 Nouvelles informations:');
    console.log(`   Email: ${updatedProfile.email}`);
    console.log(`   Plan: ${PLAN_DISPLAY_NAMES[updatedProfile.license as LicenseType]}`);
    console.log(`   Mis à jour le: ${new Date(updatedProfile.updated_at).toLocaleString('fr-FR')}`);
    console.log('');
    
    console.log('💡 L\'utilisateur peut maintenant se reconnecter pour voir ses nouveaux accès.');
    console.log('   Les accès "Starter" incluent:');
    console.log('   - Sessions de trading en direct');
    console.log('   - Communauté privée Discord');
    console.log('   - Alertes trading en temps réel');
    console.log('   - Tutoriels plateformes (TopStep, Apex, MT4/MT5)');
    
  } catch (error: any) {
    console.error('❌ Erreur inattendue:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
setUserPlan().catch(console.error);

