import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkModules() {
  // 1. Voir tous les modules et leur licence requise
  const { data: modules, error } = await supabase
    .from('training_modules')
    .select('id, title, required_license, position, is_active')
    .order('position');

  console.log('=== MODULES DE FORMATION ===\n');
  
  const licenseOrder = { 'entree': 1, 'transformation': 2, 'immersion': 3 };
  
  modules?.forEach(m => {
    const license = m.required_license || 'entree';
    const icon = license === 'entree' ? '🟢' : license === 'transformation' ? '🟡' : '🔴';
    console.log(`${icon} [${license}] ${m.title} ${m.is_active ? '' : '(INACTIF)'}`);
  });

  console.log('\n=== LEGENDE ===');
  console.log('🟢 entree (Starter) - Accessible avec licence Starter');
  console.log('🟡 transformation (Pro) - Accessible avec licence Pro+');
  console.log('🔴 immersion (Elite) - Accessible avec licence Elite uniquement');

  // 2. Vérifier les accès de kokocasin
  console.log('\n=== ACCES DE KOKOCASIN ===\n');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, license')
    .eq('email', 'kokocasin@gmail.com')
    .single();

  console.log(`Email: ${profile?.email}`);
  console.log(`Licence: ${profile?.license}`);

  const { data: access } = await supabase
    .from('training_access')
    .select('module_id, access_type, granted_at')
    .eq('user_id', profile?.id);

  console.log(`Nombre d'accès: ${access?.length || 0}`);
  
  if (access && access.length > 0) {
    console.log('\nModules accessibles:');
    for (const a of access) {
      const mod = modules?.find(m => m.id === a.module_id);
      console.log(`  - ${mod?.title || a.module_id}`);
    }
  }
}

checkModules();

