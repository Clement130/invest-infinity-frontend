/**
 * Script pour mettre à jour les required_license des modules de formation
 * 
 * Configuration des accès selon les formules:
 * - Starter (147€): Modules de base
 * - Premium (497€): Modules avancés + Starter
 * - Bootcamp Élite (1997€): Tout
 * 
 * Usage:
 *   npx tsx scripts/updateModuleLicenses.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement depuis .env.local
function loadEnv(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    
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
    console.error('❌ Impossible de lire .env.local');
    process.exit(1);
  }
}

// Configuration des modules et leurs licences requises
// Ajuster selon vos besoins
const MODULE_LICENSE_CONFIG: Record<string, 'starter' | 'pro' | 'elite'> = {
  // Modules Starter (accessibles à tous les clients payants)
  'MetaTrader & TopStepX & Apex': 'starter',
  'Etape 1 - La Fondation': 'starter',
  
  // Modules Premium (Pro) - Nécessite offre Premium ou supérieure
  'Etape 2 - Les Bases en ICT': 'pro',
  'Etape 3 - La Stratégie ICT Mickael': 'pro',
  
  // Modules Elite - Nécessite offre Bootcamp Élite
  'Trading View - Outils et Techniques': 'pro', // Ou 'elite' si réservé au bootcamp
};

async function main() {
  console.log('🔄 Mise à jour des licences des modules de formation\n');
  
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes dans .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
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

main().catch(console.error);
