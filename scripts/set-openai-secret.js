/**
 * Script pour configurer le secret OPENAI_API_KEY dans Supabase Edge Functions
 * Utilise l'API Supabase Management
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN doit être défini dans .env.local');
  console.error('   Obtenez-le depuis: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY doit être défini dans .env.local');
  console.error('   Ajoutez-le dans votre fichier .env.local');
  process.exit(1);
}

async function setSecret(name, value) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        value: value,
      }),
    });

    if (response.ok) {
      console.log(`   ✅ ${name} configuré avec succès`);
      return true;
    } else {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        // Garder le texte brut si ce n'est pas du JSON
      }
      
      // Si le secret existe déjà, c'est OK
      if (response.status === 409 || errorMessage.includes('already exists')) {
        console.log(`   ⚠️  ${name} existe déjà. Mise à jour...`);
        // Essayer de mettre à jour (supprimer puis recréer)
        return await updateSecret(name, value);
      }
      
      console.error(`   ❌ Erreur pour ${name} (${response.status}):`, errorMessage);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Erreur pour ${name}:`, error.message);
    return false;
  }
}

async function updateSecret(name, value) {
  // Pour mettre à jour, on doit d'abord supprimer puis recréer
  const deleteUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets/${name}`;
  
  try {
    // Essayer de supprimer
    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      },
    });
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Recréer
    return await setSecret(name, value);
  } catch (error) {
    // Si la suppression échoue, essayer quand même de créer
    return await setSecret(name, value);
  }
}

async function main() {
  console.log('🔐 Configuration du secret OPENAI_API_KEY dans Supabase Edge Functions');
  console.log('═'.repeat(80));
  console.log('');

  const success = await setSecret('OPENAI_API_KEY', OPENAI_API_KEY);

  console.log('');
  if (success) {
    console.log('✅ Configuration terminée avec succès!');
    console.log('');
    console.log('Le chatbot devrait maintenant fonctionner en production.');
  } else {
    console.log('❌ La configuration a échoué.');
    console.log('');
    console.log('💡 Configurez manuellement:');
    console.log('   1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions');
    console.log('   2. Cliquez sur "Secrets"');
    console.log('   3. Ajoutez: OPENAI_API_KEY =', OPENAI_API_KEY);
  }
  console.log('');
}

main().catch(console.error);

