/**
 * Script pour corriger les required_license des modules de formation
 * 
 * Usage: node scripts/fixModuleLicenses.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixModuleLicenses() {
  console.log('🔄 Correction des licences des modules de formation\n');
  
  // Récupérer tous les modules
  const { data: modules, error: fetchError } = await supabase
    .from('training_modules')
    .select('id, title, required_license, position')
    .order('position', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Erreur:', fetchError.message);
    process.exit(1);
  }
  
  console.log(`📋 ${modules?.length || 0} modules trouvés:\n`);
  
  if (!modules || modules.length === 0) {
    console.log('⚠️ Aucun module');
    return;
  }

  // Afficher les modules actuels
  modules.forEach((m, i) => {
    console.log(`${i+1}. [${m.required_license || 'N/A'}] ${m.title}`);
  });
  
  console.log('\n📝 Application des corrections...\n');
  
  // Mettre à jour selon la position
  // Position 0-1: starter (Etape 1, MetaTrader)
  // Position 2+: pro (Etape 2, Etape 3, Trading View)
  
  for (const module of modules) {
    const title = module.title.toLowerCase();
    let newLicense = 'pro'; // Par défaut pro
    
    // Modules Starter
    if (title.includes('etape 1') || title.includes('étape 1') || 
        title.includes('fondation') ||
        title.includes('metatrader') || title.includes('topstep') || title.includes('apex')) {
      newLicense = 'starter';
    }
    
    // Mettre à jour
    const { error: updateError } = await supabase
      .from('training_modules')
      .update({ required_license: newLicense })
      .eq('id', module.id);
    
    if (updateError) {
      console.log(`❌ ${module.title}: ${updateError.message}`);
    } else {
      const changed = module.required_license !== newLicense;
      console.log(`${changed ? '✅' : '✓'} ${module.title}: ${module.required_license || 'N/A'} → ${newLicense}`);
    }
  }
  
  console.log('\n✅ Terminé!');
  console.log('\n📌 Récapitulatif:');
  console.log('   • Starter: Etape 1 + MetaTrader/TopStepX/Apex');
  console.log('   • Premium (pro): Tout le reste');
}

fixModuleLicenses().catch(console.error);
