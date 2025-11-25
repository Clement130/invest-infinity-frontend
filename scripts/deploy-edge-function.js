/**
 * Script pour déployer l'Edge Function upload-bunny-video
 * Utilise l'API Supabase Management
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const FUNCTION_NAME = 'upload-bunny-video';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN doit être défini dans .env.local');
  console.error('   Obtenez-le depuis: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

async function deployFunction() {
  console.log('🚀 Déploiement de l\'Edge Function upload-bunny-video...\n');

  try {
    // Lire le fichier de la fonction
    const functionPath = join(process.cwd(), 'supabase', 'functions', FUNCTION_NAME, 'index.ts');
    const functionCode = readFileSync(functionPath, 'utf-8');

    console.log('📝 Code de la fonction lu avec succès');
    console.log(`   Taille: ${functionCode.length} caractères\n`);

    // Utiliser l'API Management de Supabase pour déployer
    // Note: L'API Management nécessite un token d'accès valide
    const managementUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}`;
    
    const headers = {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Créer un FormData avec le code
    const formData = new FormData();
    formData.append('code', functionCode, {
      filename: 'index.ts',
      contentType: 'text/typescript',
    });

    console.log('📤 Envoi de la fonction à Supabase...');
    
    // Note: L'API Management de Supabase pour les Edge Functions utilise généralement
    // une approche différente. Pour l'instant, on va utiliser le CLI Supabase
    // ou afficher les instructions manuelles
    
    console.log('\n⚠️  L\'API Management de Supabase ne permet pas de déployer directement les Edge Functions');
    console.log('   Utilisez plutôt la commande CLI:\n');
    console.log('   supabase functions deploy upload-bunny-video\n');
    console.log('   Ou mettez à jour le code manuellement dans le Dashboard Supabase:\n');
    console.log(`   1. Allez sur: https://supabase.com/dashboard/project/${PROJECT_REF}/functions/${FUNCTION_NAME}/code`);
    console.log('   2. Remplacez le code par celui du fichier local');
    console.log('   3. Cliquez sur "Deploy updates"\n');

  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    process.exit(1);
  }
}

deployFunction();

