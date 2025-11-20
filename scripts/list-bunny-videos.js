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
const libraryId = env.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = env.BUNNY_STREAM_API_KEY || process.env.BUNNY_STREAM_API_KEY;

if (!libraryId || !apiKey) {
  console.error('❌ BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être définis');
  process.exit(1);
}

async function listBunnyVideos() {
  console.log('📹 Récupération des vidéos depuis Bunny Stream...\n');
  console.log(`Library ID: ${libraryId}\n`);

  try {
    // API Bunny Stream pour lister les vidéos
    const url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=100&orderBy=date`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur API Bunny Stream: ${response.status}`);
      console.error(`   ${errorText}`);
      return;
    }

    const data = await response.json();
    const videos = data.items || [];

    console.log(`✅ ${videos.length} vidéo(s) trouvée(s) dans la bibliothèque\n`);

    if (videos.length === 0) {
      console.log('Aucune vidéo trouvée.');
      return;
    }

    console.log('📋 Liste des vidéos :\n');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title || 'Sans titre'}`);
      console.log(`   ID: ${video.guid || video.videoId || 'N/A'}`);
      console.log(`   Durée: ${video.length ? Math.floor(video.length / 60) + ' min' : 'N/A'}`);
      console.log(`   Date: ${video.dateUploaded ? new Date(video.dateUploaded).toLocaleDateString('fr-FR') : 'N/A'}`);
      console.log(`   Statut: ${video.status || 'N/A'}`);
      console.log('');
    });

    // Générer un fichier JSON avec les vidéos
    const videosData = videos.map(v => ({
      id: v.guid || v.videoId,
      title: v.title || 'Sans titre',
      description: v.description || '',
      duration: v.length || 0,
      dateUploaded: v.dateUploaded || null,
      status: v.status || 'unknown',
    }));

    const fs = await import('fs');
    fs.writeFileSync(
      join(process.cwd(), 'scripts', 'bunny-videos.json'),
      JSON.stringify(videosData, null, 2)
    );

    console.log('💾 Liste sauvegardée dans scripts/bunny-videos.json\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

listBunnyVideos();

