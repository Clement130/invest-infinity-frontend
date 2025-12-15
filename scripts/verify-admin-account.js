import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyAdminAccount() {
  const adminEmail = 'investinfinityfr@gmail.com';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 VÉRIFICATION DU COMPTE ADMIN');
  console.log('='.repeat(80));
  console.log(`\n📧 Email: ${adminEmail}\n`);

  // Vérifier le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', adminEmail)
    .single();

  if (profileError) {
    console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
    return;
  }

  if (!profile) {
    console.error('❌ Profil non trouvé');
    return;
  }

  console.log('✅ PROFIL TROUVÉ:');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Nom: ${profile.full_name || 'N/A'}`);
  console.log(`   Rôle: ${profile.role}`);
  console.log(`   Licence: ${profile.license || 'none'}`);

  // Vérifier l'utilisateur auth
  const { data: users } = await supabase.auth.admin.listUsers();
  const authUser = users?.users?.find(u => u.email === adminEmail);

  if (authUser) {
    console.log(`\n✅ COMPTE AUTH TROUVÉ:`);
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email confirmé: ${authUser.email_confirmed_at ? 'Oui' : 'Non'}`);
    console.log(`   Créé le: ${authUser.created_at}`);
  } else {
    console.log(`\n⚠️  Compte auth non trouvé`);
  }

  // Vérifier les accès aux modules
  const { data: access } = await supabase
    .from('training_access')
    .select('module_id')
    .eq('user_id', profile.id);

  console.log(`\n✅ ACCÈS AUX MODULES: ${access?.length || 0} module(s)`);

  if (profile.role === 'admin' && authUser) {
    console.log(`\n✅ Le compte admin est correctement restauré et fonctionnel !\n`);
  } else {
    console.log(`\n⚠️  Le compte admin nécessite des corrections.\n`);
  }
}

verifyAdminAccount().catch(console.error);

