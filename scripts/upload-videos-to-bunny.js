/**
 * Script pour uploader automatiquement des vidéos vers Bunny Stream
 * Usage: node scripts/upload-videos-to-bunny.js <dossier-videos>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration depuis .env.local
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || 'be9a7d66-a76f-4314-88af7279bb1e-d7d8-42ca';
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '542258';

const BUNNY_API_URL = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`;

/**
 * Upload une vidéo vers Bunny Stream
 */
async function uploadVideo(filePath, title) {
  return new Promise((resolve, reject) => {
    // Créer d'abord la vidéo
    const createData = JSON.stringify({ title: path.basename(filePath, path.extname(filePath)) });
    
    const createOptions = {
      hostname: 'video.bunnycdn.com',
      path: `/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_STREAM_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createData),
      },
    };

    const createReq = https.request(createOptions, (createRes) => {
      let createData = '';
      
      createRes.on('data', (chunk) => {
        createData += chunk;
      });
      
      createRes.on('end', () => {
        if (createRes.statusCode >= 200 && createRes.statusCode < 300) {
          try {
            const video = JSON.parse(createData);
            const videoId = video.guid || video.videoId;
            
            if (!videoId) {
              reject(new Error('Failed to get video ID from creation response'));
              return;
            }
            
            // Maintenant uploader le fichier
            const fileStream = fs.createReadStream(filePath);
            const fileStats = fs.statSync(filePath);
            
            const uploadOptions = {
              hostname: 'video.bunnycdn.com',
              path: `/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
              method: 'PUT',
              headers: {
                'AccessKey': BUNNY_STREAM_API_KEY,
                'Content-Type': 'application/octet-stream',
                'Content-Length': fileStats.size,
              },
            };

            const uploadReq = https.request(uploadOptions, (uploadRes) => {
              let uploadData = '';
              
              uploadRes.on('data', (chunk) => {
                uploadData += chunk;
              });
              
              uploadRes.on('end', () => {
                if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
                  resolve({ ...video, uploadSuccess: true });
                } else {
                  reject(new Error(`Upload failed: ${uploadRes.statusCode} - ${uploadData}`));
                }
              });
            });

            uploadReq.on('error', (error) => {
              reject(error);
            });

            fileStream.pipe(uploadReq);
          } catch (e) {
            reject(new Error(`Failed to parse creation response: ${createData}`));
          }
        } else {
          reject(new Error(`Create failed: ${createRes.statusCode} - ${createData}`));
        }
      });
    });

    createReq.on('error', (error) => {
      reject(error);
    });

    createReq.write(createData);
    createReq.end();
  });
}


/**
 * Trouver tous les fichiers vidéo dans un dossier
 */
function findVideoFiles(directory) {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const files = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (videoExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDir(directory);
  return files;
}

/**
 * Main function
 */
async function main() {
  const videoDir = process.argv[2] || './videos';
  
  console.log('🚀 UPLOAD AUTOMATIQUE VERS BUNNY STREAM');
  console.log('=======================================\n');
  console.log(`📁 Dossier: ${videoDir}`);
  console.log(`🏛️  Bibliothèque: ${BUNNY_STREAM_LIBRARY_ID}\n`);
  
  // Trouver les fichiers vidéo
  const videoFiles = findVideoFiles(videoDir);
  
  if (videoFiles.length === 0) {
    console.log('❌ Aucun fichier vidéo trouvé dans:', videoDir);
    console.log('\n💡 Créez un dossier "videos" et placez-y vos fichiers vidéo');
    console.log('   Exemple: mkdir videos && mv *.mp4 videos/');
    process.exit(1);
  }
  
  console.log(`📹 ${videoFiles.length} fichier(s) vidéo trouvé(s):\n`);
  videoFiles.forEach((file, index) => {
    const fileName = path.basename(file);
    const fileSize = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
    console.log(`   ${index + 1}. ${fileName} (${fileSize} MB)`);
  });
  console.log('');
  
  // Upload chaque vidéo
  const results = [];
  
  for (const filePath of videoFiles) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    try {
      console.log(`📤 Upload: ${fileName}...`);
      
      const result = await uploadVideo(filePath, fileName);
      
      if (result.guid) {
        console.log(`   ✅ Succès! ID: ${result.guid}`);
        results.push({
          file: fileName,
          guid: result.guid,
          title: result.title || fileName,
          status: 'success',
        });
      } else {
        console.log(`   ⚠️  Réponse:`, result);
        results.push({
          file: fileName,
          status: 'unknown',
          response: result,
        });
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      results.push({
        file: fileName,
        status: 'error',
        error: error.message,
      });
    }
    
    console.log('');
  }
  
  // Résumé
  console.log('📊 RÉSUMÉ:');
  console.log('==========');
  const success = results.filter(r => r.status === 'success').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Succès: ${success}`);
  console.log(`❌ Erreurs: ${errors}`);
  
  if (success > 0) {
    console.log('\n📋 IDs des vidéos uploadées:');
    results.filter(r => r.guid).forEach(r => {
      console.log(`   ${r.title}: ${r.guid}`);
    });
  }
}

main().catch(console.error);

