/**
 * SCRIPT DE VÉRIFICATION DE SÉCURITÉ (Security Health Check)
 * 
 * Ce script simule des attaques basiques pour vérifier que les protections sont actives.
 * 
 * Usage:
 *   node scripts/verify-security.js
 * 
 * Pré-requis:
 *   - Avoir les variables d'environnement dans .env.local ou .env
 */

const fs = require('fs');
const path = require('path');

// Charger les env vars manuellement si dotenv n'est pas là
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERREUR: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY requis.');
  console.error('Assurez-vous d\'avoir un fichier .env.local à la racine.');
  process.exit(1);
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function test(name, fn) {
  process.stdout.write(`${COLORS.cyan}[TEST] ${name}...${COLORS.reset} `);
  try {
    await fn();
    console.log(`${COLORS.green}✅ PASS${COLORS.reset}`);
  } catch (e) {
    console.log(`${COLORS.red}❌ FAIL${COLORS.reset}`);
    console.error(`   ${e.message}`);
  }
}

async function run() {
  console.log('🛡️  Démarrage de l\'audit de sécurité...\n');

  // TEST 1: RLS sur admin_activity_logs
  // Un utilisateur anonyme ne doit PAS pouvoir lire les logs
  await test('RLS: Lecture logs admin (Anonyme)', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_activity_logs?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    // Supabase retourne [] s'il y a RLS mais pas d'accès, ou erreur 401/403 selon config.
    // Si RLS est bien fait, on doit avoir un tableau vide.
    const data = await res.json();
    if (Array.isArray(data) && data.length === 0) return; // OK (filtré)
    if (res.status === 401 || res.status === 403) return; // OK (bloqué)
    
    // Si on reçoit des données, c'est grave
    if (Array.isArray(data) && data.length > 0) {
      throw new Error(`FAIL: J'ai pu lire ${data.length} logs en tant qu'anonyme !`);
    }
  });

  // TEST 2: Edge Function sans Auth
  // Doit retourner 401
  await test('Edge Function: generate-bunny-token (Sans Token)', async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-bunny-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoId: 'test' })
    });
    
    if (res.status !== 401) {
      throw new Error(`Attendu 401, reçu ${res.status}`);
    }
  });

  // TEST 3: Edge Function avec faux Token
  // Doit retourner 401
  await test('Edge Function: generate-bunny-token (Faux Token)', async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-bunny-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-123'
      },
      body: JSON.stringify({ videoId: 'test' })
    });
    
    if (res.status !== 401) {
      throw new Error(`Attendu 401, reçu ${res.status}`);
    }
  });

  // TEST 4: Chatbot sans Auth
  await test('Edge Function: chatbot (Sans Token)', async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] })
    });
    if (res.status !== 401) {
        throw new Error(`Attendu 401, reçu ${res.status}`);
    }
  });

  console.log('\n✨ Audit terminé.');
}

run();

