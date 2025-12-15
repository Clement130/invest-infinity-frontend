import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Identifie les comptes de test selon différents patterns
 */
function isTestAccount(email, fullName) {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  const nameLower = (fullName || '').toLowerCase();
  
  // Patterns d'emails de test
  const testPatterns = [
    /@test\.investinfinity\.fr/i,
    /@example\.com/i,
    /^test-/i,
    /^test-payment-/i,
    /test\.smtp/i,
    /test@/i,
    /@test\./i,
    /test-progress@/i,
    /test-webhook-/i,
    /test-client@/i,
    /^test\./i,  // test.debug, test.final, etc.
    /test\.debug/i,
    /test\.final/i,
    /test\.email/i,
    /test\.option/i,
    /test\.prod/i,
  ];
  
  // Domaines d'emails temporaires/test (services de test d'email)
  const tempEmailDomains = [
    /@cexch\.com/i,
    /@bialode\.com/i,
    /@docsfy\.com/i,
    /@acpeak\.com/i,
    /@bnsteps\.com/i,
    /@guerrillamail/i,
    /@10minutemail/i,
    /@tempmail/i,
    /@mailinator/i,
    /@throwaway/i,
  ];
  
  // Patterns de noms de test
  const testNamePatterns = [
    /^test$/i,
    /test/i,
    /utilisateur test/i,
    /jean dupont test/i,
    /dupont test/i,
  ];
  
  // Vérifier les patterns d'email de test
  for (const pattern of testPatterns) {
    if (pattern.test(emailLower)) {
      return true;
    }
  }
  
  // Vérifier les domaines d'emails temporaires
  for (const pattern of tempEmailDomains) {
    if (pattern.test(emailLower)) {
      return true;
    }
  }
  
  // Vérifier les patterns de nom de test
  if (testNamePatterns.some(p => p.test(nameLower))) {
    return true;
  }
  
  return false;
}

/**
 * Supprime toutes les données associées à un utilisateur
 */
async function deleteUserData(userId) {
  const errors = [];
  
  // 1. Supprimer training_progress
  const { error: progressError } = await supabase
    .from('training_progress')
    .delete()
    .eq('user_id', userId);
  if (progressError) errors.push(`training_progress: ${progressError.message}`);
  
  // 2. Supprimer training_access
  const { error: accessError } = await supabase
    .from('training_access')
    .delete()
    .eq('user_id', userId);
  if (accessError) errors.push(`training_access: ${accessError.message}`);
  
  // 3. Supprimer payments
  const { error: paymentsError } = await supabase
    .from('payments')
    .delete()
    .eq('user_id', userId);
  if (paymentsError) errors.push(`payments: ${paymentsError.message}`);
  
  // 4. Supprimer leads (si existe)
  const { error: leadsError } = await supabase
    .from('leads')
    .delete()
    .eq('email', userId); // Peut être email ou user_id selon le schéma
  if (leadsError && !leadsError.message.includes('does not exist')) {
    errors.push(`leads: ${leadsError.message}`);
  }
  
  // 5. Supprimer contact_messages (si existe)
  const { error: messagesError } = await supabase
    .from('contact_messages')
    .delete()
    .eq('email', userId);
  if (messagesError && !messagesError.message.includes('does not exist')) {
    errors.push(`contact_messages: ${messagesError.message}`);
  }
  
  // 6. Supprimer le profil
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (profileError) errors.push(`profiles: ${profileError.message}`);
  
  // 7. Supprimer l'utilisateur auth (doit être fait en dernier)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) errors.push(`auth.users: ${authError.message}`);
  
  return errors;
}

/**
 * Liste tous les comptes de test
 */
async function listTestAccounts() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 IDENTIFICATION DES COMPTES DE TEST');
  console.log('='.repeat(80));
  
  // Récupérer tous les profils
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, license, role, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erreur lors de la récupération des profils:', error);
    return [];
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('✅ Aucun profil trouvé');
    return [];
  }
  
  // Filtrer les comptes de test (EXCLURE TOUS LES ADMINS)
  const testAccounts = profiles.filter(p => {
    // Ne JAMAIS supprimer les admins
    if (p.role === 'admin' || p.role === 'developer') {
      return false;
    }
    return isTestAccount(p.email, p.full_name);
  });
  
  console.log(`\n📊 Total profils: ${profiles.length}`);
  console.log(`🧪 Comptes de test identifiés: ${testAccounts.length}\n`);
  
  if (testAccounts.length > 0) {
    console.log('📋 Liste des comptes de test:');
    testAccounts.forEach((account, index) => {
      console.log(`\n   ${index + 1}. ${account.email}`);
      console.log(`      Nom: ${account.full_name || 'N/A'}`);
      console.log(`      Licence: ${account.license || 'none'}`);
      console.log(`      Rôle: ${account.role}`);
      console.log(`      Créé le: ${account.created_at}`);
      console.log(`      ID: ${account.id}`);
    });
  }
  
  return testAccounts;
}

/**
 * Supprime tous les comptes de test
 */
async function deleteTestAccounts(dryRun = true) {
  const testAccounts = await listTestAccounts();
  
  if (testAccounts.length === 0) {
    console.log('\n✅ Aucun compte de test à supprimer');
    return;
  }
  
  if (dryRun) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('⚠️  MODE DRY-RUN - Aucune suppression ne sera effectuée');
    console.log('='.repeat(80));
    console.log('\n💡 Pour supprimer réellement, exécutez:');
    console.log('   node scripts/delete-test-accounts.js --confirm\n');
    return;
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('🗑️  SUPPRESSION DES COMPTES DE TEST');
  console.log('='.repeat(80));
  console.log(`\n⚠️  ATTENTION: ${testAccounts.length} compte(s) vont être supprimé(s) définitivement !\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const account of testAccounts) {
    console.log(`\n🗑️  Suppression de ${account.email}...`);
    
    const deleteErrors = await deleteUserData(account.id);
    
    if (deleteErrors.length === 0) {
      console.log(`   ✅ Compte supprimé avec succès`);
      successCount++;
    } else {
      console.log(`   ⚠️  Suppression partielle (erreurs: ${deleteErrors.length})`);
      deleteErrors.forEach(err => {
        console.log(`      - ${err}`);
        errors.push({ email: account.email, error: err });
      });
      errorCount++;
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`✅ Comptes supprimés avec succès: ${successCount}`);
  if (errorCount > 0) {
    console.log(`⚠️  Comptes avec erreurs: ${errorCount}`);
    console.log('\n📋 Détails des erreurs:');
    errors.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`);
    });
  }
  
  if (successCount === testAccounts.length) {
    console.log('\n✅ Tous les comptes de test ont été supprimés avec succès !');
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  
  if (confirm) {
    console.log('\n⚠️  MODE CONFIRMATION - Les comptes seront réellement supprimés\n');
    await deleteTestAccounts(false);
  } else {
    await deleteTestAccounts(true);
  }
}

main().catch(console.error);

