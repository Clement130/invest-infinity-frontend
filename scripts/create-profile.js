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

const adminEmail = 'butcher13550@gmail.com';
const adminId = 'e16edaf1-072c-4e6a-9453-2b480ba6b898'; // ID de auth.users

console.log('🔧 Création du profil admin via API REST...\n');

const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseServiceRoleKey}`,
    'apikey': supabaseServiceRoleKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  },
  body: JSON.stringify({
    id: adminId,
    email: adminEmail,
    role: 'admin',
  }),
});

if (response.ok) {
  const profile = await response.json();
  console.log('✅ Profil créé avec succès !');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Role: ${profile.role}\n`);
  console.log('💡 Tu peux maintenant relancer: npm run grant-access');
} else {
  const errorText = await response.text();
  console.error(`❌ Erreur: ${response.status}`);
  console.error(`   ${errorText}\n`);
  console.log('💡 Solution manuelle:');
  console.log('   1. Va dans Supabase Dashboard > Table Editor > profiles');
  console.log('   2. Clique sur "Insert row"');
  console.log(`   3. id: ${adminId}`);
  console.log(`   4. email: ${adminEmail}`);
  console.log(`   5. role: admin`);
  console.log('   6. Clique sur "Save"');
}

