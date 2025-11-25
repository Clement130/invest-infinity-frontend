#!/usr/bin/env node

/**
 * Script de debug pour vérifier les variables d'environnement
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';

console.log('🔍 Vérification des variables d\'environnement Bunny Stream\n');

// Charger .env.local
dotenv.config({ path: '.env.local' });

const vars = {
  VITE_BUNNY_STREAM_LIBRARY_ID: process.env.VITE_BUNNY_STREAM_LIBRARY_ID,
  VITE_BUNNY_EMBED_BASE_URL: process.env.VITE_BUNNY_EMBED_BASE_URL,
  BUNNY_STREAM_LIBRARY_ID: process.env.BUNNY_STREAM_LIBRARY_ID,
  BUNNY_STREAM_API_KEY: process.env.BUNNY_STREAM_API_KEY,
};

console.log('Variables dans process.env:');
Object.entries(vars).forEach(([key, value]) => {
  if (value) {
    console.log(`  ✅ ${key} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  } else {
    console.log(`  ❌ ${key} = (non défini)`);
  }
});

// Vérifier le fichier .env.local directement
console.log('\n📄 Contenu du fichier .env.local:');
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  const lines = envContent.split('\n').filter(line => 
    line.includes('BUNNY') && !line.trim().startsWith('#')
  );
  
  if (lines.length > 0) {
    lines.forEach(line => {
      const [key] = line.split('=');
      console.log(`  ${key ? '✅' : '⚠️'} ${line.substring(0, 80)}`);
    });
  } else {
    console.log('  ⚠️  Aucune variable Bunny trouvée dans .env.local');
  }
} catch (error) {
  console.log(`  ❌ Erreur lors de la lecture: ${error.message}`);
}

console.log('\n💡 Note: Les variables VITE_* doivent être accessibles via import.meta.env dans le code client');
console.log('   Vite charge automatiquement les variables depuis .env.local au démarrage du serveur dev');

