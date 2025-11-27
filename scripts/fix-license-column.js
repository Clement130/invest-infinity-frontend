import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vveswlmcgmizmjsriezw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQzMzg2NywiZXhwIjoyMDc5MDA5ODY3fQ.a5Wr6M28RDRyJCX93FAPCUnRX-GUWrL-4zCFd4Q-yto'
);

async function main() {
  console.log('Vérification et correction de la colonne license dans profiles...\n');
  
  // Vérifier si la colonne existe
  const { data: columns, error: colError } = await supabase
    .from('profiles')
    .select('license')
    .limit(1);
  
  if (colError && colError.message.includes('does not exist')) {
    console.log('❌ La colonne license n\'existe pas.');
    console.log('');
    console.log('Pour corriger, exécute cette commande SQL dans la console Supabase:');
    console.log('');
    console.log('ALTER TABLE public.profiles');
    console.log('  ADD COLUMN IF NOT EXISTS license text DEFAULT \'none\'');
    console.log('    CHECK (license IN (\'none\', \'starter\', \'pro\', \'elite\')),');
    console.log('  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();');
    console.log('');
    console.log('Ou via le Dashboard Supabase > SQL Editor');
  } else {
    console.log('✅ La colonne license existe déjà!');
    
    // Afficher quelques utilisateurs avec leur licence
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, role, license')
      .limit(5);
    
    if (profiles) {
      console.log('\nUtilisateurs:');
      profiles.forEach(p => {
        console.log(`  ${p.email} | ${p.role} | ${p.license || 'none'}`);
      });
    }
  }
}

main().catch(console.error);

