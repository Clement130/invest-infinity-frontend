import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkModules() {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log('📋 Modules actuels dans la base de données:\n');
  data?.forEach((m, i) => {
    console.log(`${i + 1}. ${m.title}`);
    console.log(`   Position: ${m.position}`);
    console.log(`   Actif: ${m.is_active ? 'Oui' : 'Non'}`);
    console.log(`   Description: ${m.description || 'Aucune'}\n`);
  });

  const tradingViewModule = data?.find(m => 
    m.title.toLowerCase().includes('trading view') || 
    m.title.toLowerCase().includes('tradingview')
  );

  if (tradingViewModule) {
    console.log('✅ Le module Trading View existe toujours !');
    console.log(`   ID: ${tradingViewModule.id}`);
    console.log(`   Titre: ${tradingViewModule.title}`);
  } else {
    console.log('❌ Le module Trading View n\'a pas été trouvé.');
  }
}

checkModules();

