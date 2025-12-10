/**
 * Script pour convertir des leads en utilisateurs
 * 
 * Usage: node scripts/convert-leads-to-users.js [email1] [email2] ...
 * 
 * Exemple:
 *   node scripts/convert-leads-to-users.js vidot.emma@gmail.com kevin.ferreira78111@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Charger les variables d'environnement depuis .env.local
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
const supabaseServiceRoleKey =
  env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini dans .env.local');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini dans .env.local');
  console.error('📝 Récupérez la clé depuis : Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Créer le client Supabase avec service_role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function convertLeadToUser(email) {
  console.log(`\n🔄 Conversion de ${email}...`);

  try {
    // 1. Vérifier si le lead existe
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      console.error(`   ❌ Lead non trouvé pour ${email}`);
      return { success: false, error: 'Lead not found' };
    }

    console.log(`   ✅ Lead trouvé: ${lead.prenom || 'N/A'}`);

    // 2. Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`   ⚠️  Utilisateur existe déjà: ${userId}`);
    } else {
      // 3. Créer l'utilisateur
      const tempPassword = randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error(`   ❌ Erreur création utilisateur: ${createError?.message}`);
        return { success: false, error: createError?.message };
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`   ✅ Utilisateur créé: ${userId}`);
    }

    // 4. Vérifier si le profil existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      // 5. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          user_id: userId,
          email: email.toLowerCase().trim(),
          full_name: lead.prenom || null,
          role: 'client',
          license: 'none',
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.error(`   ❌ Erreur création profil: ${profileError.message}`);
        return { success: false, error: profileError.message };
      }

      console.log(`   ✅ Profil créé`);
    } else {
      console.log(`   ⚠️  Profil existe déjà`);
    }

    // 6. Générer le lien de récupération (si nouvel utilisateur)
    if (isNewUser) {
      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email.toLowerCase().trim(),
          options: {
            redirectTo: 'https://www.investinfinity.fr/create-password',
          },
        });

        if (!linkError && linkData?.properties?.hashed_token) {
          console.log(`   ✅ Lien de récupération généré`);
          
          // Envoyer l'email de bienvenue
          try {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-password-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
              },
              body: JSON.stringify({
                email: email.toLowerCase().trim(),
                token: linkData.properties.hashed_token,
                prenom: lead.prenom || 'Cher membre',
              }),
            });

            if (emailResponse.ok) {
              console.log(`   ✅ Email de bienvenue envoyé`);
            } else {
              const errorData = await emailResponse.text();
              console.warn(`   ⚠️  Erreur envoi email: ${errorData}`);
            }
          } catch (emailError) {
            console.warn(`   ⚠️  Exception envoi email: ${emailError.message}`);
          }
        }
      } catch (linkError) {
        console.warn(`   ⚠️  Erreur génération lien: ${linkError.message}`);
      }
    }

    console.log(`   ✅ Conversion réussie pour ${email}`);
    return { success: true, userId, isNewUser };

  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  // Emails par défaut si aucun argument n'est fourni
  const defaultEmails = [
    'vidot.emma@gmail.com',
    'kevin.ferreira78111@gmail.com',
  ];

  const emails = process.argv.slice(2).length > 0 
    ? process.argv.slice(2)
    : defaultEmails;

  console.log('🚀 Conversion de leads en utilisateurs\n');
  console.log(`📧 Emails à convertir: ${emails.join(', ')}\n`);

  const results = [];

  for (const email of emails) {
    const result = await convertLeadToUser(email);
    results.push({ email, ...result });
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Réussis: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.email} (${r.isNewUser ? 'nouvel utilisateur' : 'utilisateur existant'})`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Échecs: ${failed.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.email}: ${r.error}`);
    });
  }

  console.log('\n✨ Terminé !');
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

