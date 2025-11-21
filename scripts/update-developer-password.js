import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  console.error('   Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local');
  console.error('   Vous pouvez le trouver dans: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/api');
  process.exit(1);
}

// Créer le client Supabase avec le service role key (admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';
const NEW_PASSWORD = 'Password130!';

async function updatePassword() {
  console.log('🔐 Mise à jour du mot de passe développeur...\n');
  console.log(`Email: ${DEVELOPER_EMAIL}`);
  console.log(`Nouveau mot de passe: ${NEW_PASSWORD}\n`);

  try {
    // Récupérer l'utilisateur par email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.find(u => u.email === DEVELOPER_EMAIL);

    if (!user) {
      console.error(`❌ Utilisateur ${DEVELOPER_EMAIL} non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}\n`);

    // Mettre à jour le mot de passe
    console.log('📝 Mise à jour du mot de passe...');
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: NEW_PASSWORD,
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Mot de passe mis à jour avec succès !\n');
    console.log('📋 Détails:');
    console.log(`   Email: ${DEVELOPER_EMAIL}`);
    console.log(`   Nouveau mot de passe: ${NEW_PASSWORD}`);
    console.log(`   ID utilisateur: ${user.id}\n`);
    console.log('🎉 Vous pouvez maintenant vous connecter avec ce nouveau mot de passe !');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du mot de passe:', error.message);
    process.exit(1);
  }
}

updatePassword();

