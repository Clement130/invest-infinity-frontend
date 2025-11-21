import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
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

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Pour mettre à jour le mot de passe, on a besoin du service role key
// On va utiliser l'API REST directement
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';
const NEW_PASSWORD = 'Password130!';
const PROJECT_REF = 'vveswlmcgmizmjsriezw';

async function updatePassword() {
  console.log('🔐 Mise à jour du mot de passe développeur...\n');
  console.log(`Email: ${DEVELOPER_EMAIL}`);
  console.log(`Nouveau mot de passe: ${NEW_PASSWORD}\n`);

  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN doit être défini');
    console.error('   Obtenez-le depuis: https://supabase.com/dashboard/account/tokens');
    console.error('\n   OU utilisez le Dashboard Supabase:');
    console.error('   1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/auth/users');
    console.error('   2. Cliquez sur butcher13550@gmail.com');
    console.error('   3. Cliquez sur "Send password recovery"');
    console.error('   4. Ou utilisez l\'API REST directement avec votre service role key');
    process.exit(1);
  }

  try {
    // Utiliser l'API Management de Supabase pour mettre à jour le mot de passe
    const userId = 'e16edaf1-072c-4e6a-9453-2b480ba6b898'; // ID de l'utilisateur
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: NEW_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur lors de la mise à jour:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Mot de passe mis à jour avec succès !\n');
    console.log('📋 Détails:');
    console.log(`   Email: ${DEVELOPER_EMAIL}`);
    console.log(`   Nouveau mot de passe: ${NEW_PASSWORD}`);
    console.log(`   ID utilisateur: ${userId}\n`);
    console.log('🎉 Vous pouvez maintenant vous connecter avec ce nouveau mot de passe !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Alternative: Utilisez le Dashboard Supabase');
    console.error('   1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/auth/users');
    console.error('   2. Cliquez sur butcher13550@gmail.com');
    console.error('   3. Cliquez sur "Send password recovery"');
    console.error('   4. Ou utilisez l\'API REST avec votre service role key');
    process.exit(1);
  }
}

updatePassword();

