/**
 * Script pour configurer les secrets Bunny Stream dans Supabase
 * Utilise l'API Supabase Management
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN doit être défini dans .env.local');
  console.error('   Obtenez-le depuis: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
  console.error('❌ BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être définis dans .env.local');
  process.exit(1);
}

async function configureSecrets() {
  console.log('🔐 Configuration des secrets Bunny Stream dans Supabase...\n');

  try {
    // Utiliser l'API Management de Supabase
    const managementUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`;
    
    const headers = {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Configurer BUNNY_STREAM_LIBRARY_ID
    console.log('📝 Configuration de BUNNY_STREAM_LIBRARY_ID...');
    const libraryIdResponse = await fetch(managementUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'BUNNY_STREAM_LIBRARY_ID',
        value: BUNNY_LIBRARY_ID,
      }),
    });

    if (!libraryIdResponse.ok) {
      const errorText = await libraryIdResponse.text();
      if (libraryIdResponse.status === 409) {
        console.log('   ℹ️  Secret existe déjà, mise à jour...');
        // Mettre à jour le secret existant
        const updateResponse = await fetch(`${managementUrl}/${encodeURIComponent('BUNNY_STREAM_LIBRARY_ID')}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            value: BUNNY_LIBRARY_ID,
          }),
        });
        if (updateResponse.ok) {
          console.log('   ✅ BUNNY_STREAM_LIBRARY_ID mis à jour');
        } else {
          console.error('   ❌ Erreur lors de la mise à jour:', await updateResponse.text());
        }
      } else {
        console.error('   ❌ Erreur:', errorText);
      }
    } else {
      console.log('   ✅ BUNNY_STREAM_LIBRARY_ID configuré');
    }

    // Configurer BUNNY_STREAM_API_KEY
    console.log('📝 Configuration de BUNNY_STREAM_API_KEY...');
    const apiKeyResponse = await fetch(managementUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'BUNNY_STREAM_API_KEY',
        value: BUNNY_API_KEY,
      }),
    });

    if (!apiKeyResponse.ok) {
      const errorText = await apiKeyResponse.text();
      if (apiKeyResponse.status === 409) {
        console.log('   ℹ️  Secret existe déjà, mise à jour...');
        // Mettre à jour le secret existant
        const updateResponse = await fetch(`${managementUrl}/${encodeURIComponent('BUNNY_STREAM_API_KEY')}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            value: BUNNY_API_KEY,
          }),
        });
        if (updateResponse.ok) {
          console.log('   ✅ BUNNY_STREAM_API_KEY mis à jour');
        } else {
          console.error('   ❌ Erreur lors de la mise à jour:', await updateResponse.text());
        }
      } else {
        console.error('   ❌ Erreur:', errorText);
      }
    } else {
      console.log('   ✅ BUNNY_STREAM_API_KEY configuré');
    }

    console.log('\n✨ Configuration terminée!');
    console.log('\nLes secrets sont maintenant disponibles pour l\'Edge Function upload-bunny-video.');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    process.exit(1);
  }
}

configureSecrets();

