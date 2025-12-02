#!/usr/bin/env node
/**
 * Script pour générer un lien de création de mot de passe pour un utilisateur
 * Usage: node scripts/generate-password-link.js <email>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generatePasswordLink(email) {
  console.log(`\n🔐 Génération d'un lien de création de mot de passe pour ${email}\n`);

  try {
    // Générer le lien de récupération
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.investinfinity.fr/create-password',
      },
    });

    if (linkError) {
      console.error('❌ Erreur:', linkError.message);
      process.exit(1);
    }

    if (!linkData?.properties?.hashed_token) {
      console.error('❌ Pas de token généré');
      process.exit(1);
    }

    // Construire l'URL de vérification Supabase
    const verificationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent('https://www.investinfinity.fr/create-password')}`;

    console.log('✅ Lien généré avec succès!\n');
    console.log('🔗 URL de création de mot de passe:');
    console.log(verificationUrl);
    console.log('\n⏰ Ce lien expire dans 1 heure.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/generate-password-link.js <email>');
  process.exit(1);
}

generatePasswordLink(email);

