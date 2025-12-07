/**
 * Script pour mettre à jour les required_license des modules de formation
 * 
 * Usage: node scripts/updateModuleLicenses.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Configuration des modules et leurs licences requises
const MODULE_LICENSE_CONFIG = {
  // Modules STARTER (accessibles à tous les clients payants)
  'MetaTrader & TopStepX & Apex': 'starter',
  'Etape 1 - La Fondation': 'starter',
  
  // Modules PRO/PREMIUM (nécessite offre Premium ou supérieure)
  'Etape 2 - Les Bases en ICT': 'pro',
  'Etape 3 - La Stratégie ICT Mickael': 'pro',
  'Trading View - Outils et Techniques': 'pro',
};

async function updateModuleLicenses() {
  console.log('🔄 Mise à jour des licences des modules de formation\n');
  
  // Récupérer tous les modules
  console.log('📦 Récupération des modules...\n');
  const { data: modules, error: fetchError } = await supabase
    .from('training_modules')
    .select('id, title, required_license, position')
    .order('position', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Erreur lors de la récupération des modules:', fetchError.message);
    process.exit(1);
  }
  
  if (!modules || modules.length === 0) {
    console.log('⚠️ Aucun module trouvé');
    process.exit(0);
  }
  
  console.log(`📋 ${modules.length} modules trouvés:\n`);
  
  // Afficher l'état actuel et mettre à jour
  for (const module of modules) {
    const configuredLicense = MODULE_LICENSE_CONFIG[module.title];
    const currentLicense = module.required_license || 'starter';
    
    console.log(`📚 ${module.title}`);
    console.log(`   Position: ${module.position}`);
    console.log(`   Licence actuelle: ${currentLicense}`);
    
    if (configuredLicense) {
      if (currentLicense !== configuredLicense) {
        // Mettre à jour
        const { error: updateError } = await supabase
          .from('training_modules')
          .update({ required_license: configuredLicense })
          .eq('id', module.id);
        
        if (updateError) {
          console.log(`   ❌ Erreur: ${updateError.message}`);
        } else {
          console.log(`   ✅ Mise à jour: ${currentLicense} → ${configuredLicense}`);
        }
      } else {
        console.log(`   ✓ Déjà correct`);
      }
    } else {
      console.log(`   ⚠️ Non configuré dans le script (conserve: ${currentLicense})`);
    }
    console.log('');
  }
  
  console.log('\n✅ Terminé!');
  console.log('\n📌 Récapitulatif des accès:');
  console.log('   • Starter: Etape 1, MetaTrader & TopStepX');
  console.log('   • Premium: + Etape 2, Etape 3, Trading View');
  console.log('   • Elite: Tout');
}

updateModuleLicenses().catch(console.error);
