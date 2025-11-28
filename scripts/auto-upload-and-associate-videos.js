/**
 * Script complet : Upload automatique + Association aux leçons
 * Usage: node scripts/auto-upload-and-associate-videos.js <dossier-videos>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || 'be9a7d66-a76f-4314-88af7279bb1e-d7d8-42ca';
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '542258';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vveswlmcgmizmjsriezw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Upload une vidéo vers Bunny Stream
 */
async function uploadVideo(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Étape 1: Créer la vidéo
    const createData = JSON.stringify({ title: fileName });
    
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
      let createResponse = '';
      
      createRes.on('data', (chunk) => {
        createResponse += chunk;
      });
      
      createRes.on('end', () => {
        if (createRes.statusCode >= 200 && createRes.statusCode < 300) {
          try {
            const video = JSON.parse(createResponse);
            const videoId = video.guid || video.videoId;
            
            if (!videoId) {
              reject(new Error('Failed to get video ID from creation response'));
              return;
            }
            
            // Étape 2: Uploader le fichier
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
              let uploadResponse = '';
              
              uploadRes.on('data', (chunk) => {
                uploadResponse += chunk;
              });
              
              uploadRes.on('end', () => {
                if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
                  resolve({
                    guid: videoId,
                    title: fileName,
                    originalTitle: video.title || fileName,
                  });
                } else {
                  reject(new Error(`Upload failed: ${uploadRes.statusCode} - ${uploadResponse}`));
                }
              });
            });

            uploadReq.on('error', (error) => {
              reject(error);
            });

            fileStream.pipe(uploadReq);
          } catch (e) {
            reject(new Error(`Failed to parse creation response: ${createResponse}`));
          }
        } else {
          reject(new Error(`Create failed: ${createRes.statusCode} - ${createResponse}`));
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
 * Trouver une leçon correspondant au nom de fichier
 */
function findMatchingLesson(fileName, lessons) {
  // Nettoyer le nom de fichier
  const cleanFileName = fileName
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\.(mp4|mov|avi|mkv|webm)$/i, '')
    .trim();
  
  // Chercher une correspondance exacte ou partielle
  for (const lesson of lessons) {
    const cleanLessonTitle = lesson.title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .trim();
    
    // Correspondance exacte
    if (cleanFileName === cleanLessonTitle) {
      return lesson;
    }
    
    // Correspondance partielle (si le nom de fichier contient le titre de la leçon ou vice versa)
    if (cleanFileName.includes(cleanLessonTitle) || cleanLessonTitle.includes(cleanFileName)) {
      return lesson;
    }
    
    // Correspondance par mots-clés
    const fileNameWords = cleanFileName.split(/\s+/);
    const lessonWords = cleanLessonTitle.split(/\s+/);
    const matchingWords = fileNameWords.filter(word => 
      lessonWords.some(lword => lword.includes(word) || word.includes(lword))
    );
    
    if (matchingWords.length >= Math.min(fileNameWords.length, lessonWords.length) * 0.6) {
      return lesson;
    }
  }
  
  return null;
}

/**
 * Associer une vidéo à une leçon
 */
async function associateVideoToLesson(lessonId, videoId) {
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: videoId })
    .eq('id', lessonId);
  
  if (error) {
    throw new Error(`Failed to associate video: ${error.message}`);
  }
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
  
  console.log('🚀 UPLOAD ET ASSOCIATION AUTOMATIQUE');
  console.log('=====================================\n');
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
  
  // Récupérer toutes les leçons
  console.log('📚 Récupération des leçons...');
  const { data: lessons, error: lessonsError } = await supabase
    .from('training_lessons')
    .select('id, title, bunny_video_id')
    .order('title');
  
  if (lessonsError) {
    console.error('❌ Erreur lors de la récupération des leçons:', lessonsError.message);
    process.exit(1);
  }
  
  console.log(`✅ ${lessons.length} leçon(s) trouvée(s)\n`);
  
  console.log(`📹 ${videoFiles.length} fichier(s) vidéo trouvé(s):\n`);
  videoFiles.forEach((file, index) => {
    const fileName = path.basename(file);
    const fileSize = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
    console.log(`   ${index + 1}. ${fileName} (${fileSize} MB)`);
  });
  console.log('');
  
  // Upload et association
  const results = [];
  
  for (const filePath of videoFiles) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    try {
      console.log(`📤 Upload: ${fileName}...`);
      
      // Upload
      const video = await uploadVideo(filePath);
      console.log(`   ✅ Upload réussi! ID: ${video.guid}`);
      
      // Trouver la leçon correspondante
      const lesson = findMatchingLesson(fileName, lessons);
      
      if (lesson) {
        // Vérifier si la leçon a déjà une vidéo
        if (lesson.bunny_video_id) {
          console.log(`   ⚠️  La leçon "${lesson.title}" a déjà une vidéo (${lesson.bunny_video_id})`);
          console.log(`   💡 Voulez-vous la remplacer ? (ignoré pour l'instant)`);
        } else {
          // Associer automatiquement
          await associateVideoToLesson(lesson.id, video.guid);
          console.log(`   ✅ Associée à la leçon: "${lesson.title}"`);
        }
        
        results.push({
          file: fileName,
          videoId: video.guid,
          lesson: lesson.title,
          lessonId: lesson.id,
          status: 'success',
          associated: !lesson.bunny_video_id,
        });
      } else {
        console.log(`   ⚠️  Aucune leçon correspondante trouvée`);
        console.log(`   💡 Associez-la manuellement via l'admin`);
        results.push({
          file: fileName,
          videoId: video.guid,
          status: 'success',
          associated: false,
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
  const associated = results.filter(r => r.associated).length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Uploads réussis: ${success}`);
  console.log(`🔗 Associations automatiques: ${associated}`);
  console.log(`❌ Erreurs: ${errors}`);
  
  if (success > 0) {
    console.log('\n📋 Détails des vidéos uploadées:');
    results.filter(r => r.videoId).forEach(r => {
      if (r.lesson) {
        console.log(`   ✅ ${r.file} → ${r.lesson} (${r.videoId})`);
      } else {
        console.log(`   ⚠️  ${r.file} → À associer manuellement (${r.videoId})`);
      }
    });
  }
}

main().catch(console.error);

