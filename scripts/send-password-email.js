#!/usr/bin/env node
/**
 * Script pour envoyer un email de création de mot de passe
 * Usage: node scripts/send-password-email.js <email> [prenom]
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

async function sendPasswordEmail(email, prenom = 'Cher membre') {
  console.log(`\n📧 Envoi d'un email de création de mot de passe à ${email}\n`);

  try {
    // 1. Générer le lien de récupération
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.investinfinity.fr/create-password',
      },
    });

    if (linkError) {
      console.error('❌ Erreur génération lien:', linkError.message);
      process.exit(1);
    }

    if (!linkData?.properties?.hashed_token) {
      console.error('❌ Pas de token généré');
      process.exit(1);
    }

    // 2. Construire l'URL de vérification
    const verificationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent('https://www.investinfinity.fr/create-password')}`;

    console.log('✅ Lien généré');

    // 3. Envoyer l'email via la fonction Supabase
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-password-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email: email,
        verificationUrl: verificationUrl,
        prenom: prenom,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur envoi email:', result);
      process.exit(1);
    }

    console.log('✅ Email envoyé avec succès!');
    console.log(`📬 Destinataire: ${email}`);
    console.log(`⏰ Le lien expire dans 1 heure.`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
const prenom = process.argv[3] || 'Cher membre';

if (!email) {
  console.error('Usage: node scripts/send-password-email.js <email> [prenom]');
  process.exit(1);
}

sendPasswordEmail(email, prenom);

