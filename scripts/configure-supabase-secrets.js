/**
 * Script pour configurer les secrets Supabase Edge Functions
 * Utilise l'API Supabase Management
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN doit être défini dans .env.local');
  console.error('   Obtenez-le depuis: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY doit être défini dans .env.local');
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
      console.log(`   ✅ ${name} configuré`);
      return true;
    } else {
      const error = await response.text();
      console.error(`   ❌ Erreur pour ${name}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Erreur pour ${name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔐 Configuration des secrets Supabase Edge Functions');
  console.log('═'.repeat(80));
  console.log('');

  console.log('📝 Configuration des secrets...\n');

  const secrets = [
    {
      name: 'STRIPE_SECRET_KEY',
      value: STRIPE_SECRET_KEY,
    },
    {
      name: 'SITE_URL',
      value: 'https://www.investinfinity.fr',
    },
  ];

  let successCount = 0;
  for (const secret of secrets) {
    const success = await setSecret(secret.name, secret.value);
    if (success) successCount++;
  }

  console.log('\n📊 Résumé:');
  console.log('─'.repeat(80));
  console.log(`✅ Secrets configurés: ${successCount}/${secrets.length}`);
  console.log('');

  if (successCount < secrets.length) {
    console.log('⚠️  Certains secrets n\'ont pas pu être configurés automatiquement');
    console.log('   Configurez-les manuellement dans le Dashboard:');
    console.log('   https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions');
    console.log('');
  }

  console.log('⚠️  IMPORTANT: Configurez manuellement STRIPE_WEBHOOK_SECRET');
  console.log('   1. Créez le webhook dans Stripe Dashboard');
  console.log('   2. URL: https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook');
  console.log('   3. Copiez le Signing secret');
  console.log('   4. Ajoutez-le comme STRIPE_WEBHOOK_SECRET dans Supabase Dashboard');
  console.log('');
}

main().catch(console.error);

