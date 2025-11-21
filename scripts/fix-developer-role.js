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
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  console.error('   Ajoutez VITE_SUPABASE_SERVICE_ROLE_KEY dans .env.local');
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

async function fixDeveloperRole() {
  console.log('🔧 Correction du rôle développeur...\n');
  console.log(`Email: ${DEVELOPER_EMAIL}\n`);

  try {
    // 1. Récupérer l'utilisateur par email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.find(u => u.email === DEVELOPER_EMAIL);

    if (!user) {
      console.error(`❌ Utilisateur ${DEVELOPER_EMAIL} non trouvé dans auth.users`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}\n`);

    // 2. Vérifier le profil actuel
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (currentProfile) {
      console.log(`📋 Profil actuel:`);
      console.log(`   Email: ${currentProfile.email}`);
      console.log(`   Rôle: ${currentProfile.role || 'non défini'}\n`);
    } else {
      console.log(`⚠️  Aucun profil trouvé, création d'un nouveau profil...\n`);
    }

    // 3. Mettre à jour le profil avec le rôle 'developer'
    let updatedProfile;
    let updateError;

    if (currentProfile) {
      // Mise à jour du profil existant
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: 'developer',
          email: DEVELOPER_EMAIL,
        })
        .eq('id', user.id)
        .select()
        .single();
      
      updatedProfile = data;
      updateError = error;
    } else {
      // Création d'un nouveau profil
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: DEVELOPER_EMAIL,
          role: 'developer',
        })
        .select()
        .single();
      
      updatedProfile = data;
      updateError = error;
    }

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Rôle développeur configuré avec succès !\n');
    console.log('📋 Détails du profil:');
    console.log(`   ID: ${updatedProfile.id}`);
    console.log(`   Email: ${updatedProfile.email}`);
    console.log(`   Rôle: ${updatedProfile.role}`);
    console.log(`   Créé le: ${updatedProfile.created_at || 'N/A'}\n`);

    // 4. Vérification finale
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.warn('⚠️  Erreur lors de la vérification:', verifyError.message);
    } else if (verifyProfile.role === 'developer') {
      console.log('🎉 Vérification réussie : Le rôle développeur est correctement configuré !');
    } else {
      console.error(`❌ Erreur : Le rôle est ${verifyProfile.role} au lieu de 'developer'`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction du rôle:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

fixDeveloperRole();

