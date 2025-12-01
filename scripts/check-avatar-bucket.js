// Script pour vérifier et créer le bucket avatars si nécessaire
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ciwzplxruqfhxlsnjfvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  console.log('Exécutez: $env:SUPABASE_SERVICE_ROLE_KEY="votre_clé"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('🔍 Vérification du bucket avatars...\n');

  // Lister les buckets existants
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Erreur lors de la liste des buckets:', listError.message);
    return;
  }

  console.log('📦 Buckets existants:');
  buckets.forEach(b => console.log(`  - ${b.name} (public: ${b.public})`));

  const avatarBucket = buckets.find(b => b.id === 'avatars');

  if (!avatarBucket) {
    console.log('\n⚠️ Le bucket "avatars" n\'existe pas. Création en cours...');
    
    const { data, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (createError) {
      console.error('❌ Erreur lors de la création du bucket:', createError.message);
    } else {
      console.log('✅ Bucket "avatars" créé avec succès!');
    }
  } else {
    console.log('\n✅ Le bucket "avatars" existe déjà');
    console.log(`   Public: ${avatarBucket.public}`);
  }

  // Tester un upload fictif
  console.log('\n🧪 Test de permissions...');
  
  // Vérifier la colonne avatar_url dans profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .limit(1)
    .single();

  if (profileError) {
    console.error('❌ Erreur lecture profiles:', profileError.message);
  } else {
    console.log('✅ Colonne avatar_url accessible dans profiles');
    console.log(`   Exemple: ${profile.avatar_url || '(vide)'}`);
  }

  console.log('\n✅ Vérification terminée');
}

main().catch(console.error);

