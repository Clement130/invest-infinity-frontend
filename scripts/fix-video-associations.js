/**
 * Script pour corriger les associations vidéos-leçons
 * Fait un matching intelligent entre les titres des leçons et les vidéos Bunny Stream
 */

import fs from 'fs';

// Charger les vidéos Bunny
const bunnyVideos = JSON.parse(fs.readFileSync('bunny-videos.json', 'utf-8'));

// Mapping intelligent basé sur les titres
const videoMappings = {
  // Etape 1 - La Fondation
  'La Base du Vocabulaire en Trading': '9295490a-0072-4752-996d-6f573306318b', // topstepx.mp4
  'Les Différents Types de Marchés': null, // Pas de vidéo correspondante trouvée
  'Les Différents Profils en Trading': '8dcf803c-ccc6-4f6d-9d93-4f4ccdc0d908', // Breaker.mp4
  'Les Différentes Stratégies En Trading': 'a14be160-90fa-4ddd-a3ab-aad23a47f36b', // structure.mp4
  'Avoir son Money Management': 'dbf2b57b-8b32-483f-89c4-ccd994e86e1d', // Track record Data 10 (1).mp4
  'Avoir un Track Record & Data': 'dbf2b57b-8b32-483f-89c4-ccd994e86e1d', // Track record Data 10 (1).mp4
  'Faire des Trades Recaps': 'd2ef6154-16ca-46f4-bf56-6f47c738d143', // trade Recap.mp4
  
  // Etape 2 - Les Bases en ICT
  'La Structure de marché': 'a14be160-90fa-4ddd-a3ab-aad23a47f36b', // structure.mp4
  'Le Breaker block & Mitigation block': '8dcf803c-ccc6-4f6d-9d93-4f4ccdc0d908', // Breaker.mp4
  'La FVG': null, // Pas de vidéo correspondante trouvée
  'L\'OB.': null, // Pas de vidéo correspondante trouvée
  'La Liquidité': null, // Pas de vidéo correspondante trouvée
  'La SMT': null, // Pas de vidéo correspondante trouvée
  'BreakerAway Gap': null, // Pas de vidéo correspondante trouvée
  'La IFVG': null, // Pas de vidéo correspondante trouvée
  'OB sans Corps': null, // Pas de vidéo correspondante trouvée
  
  // Etape 3 - La Stratégie ICT Mickael
  'Introduction': null, // Pas de vidéo correspondante trouvée
  'Définir mon biais': null, // Pas de vidéo correspondante trouvée (actuellement faitBacktest)
  'Définir mes zones': null, // Pas de vidéo correspondante trouvée
  'Mes confirmations pour prendre position': null, // Pas de vidéo correspondante trouvée
  'Où TP, SL et BE ?': null, // Pas de vidéo correspondante trouvée
  'Displacement + création d\'une FVG': null, // Pas de vidéo correspondante trouvée
  'Si Accumulation (je ne la trade que sous condition)': null, // Pas de vidéo correspondante trouvée
  
  // MetaTrader & TopStepX
  'Comment installer son compte MetaTrader ?': null, // Pas de vidéo correspondante trouvée
  'Comment prendre un Trade sur MetaTrader ?': '8254f866-0ab0-498c-b1fe-5ef2b66a2ab8', // Prendre position MT5.mp4
  'TopStepX - Comment l\'utiliser ?': '9295490a-0072-4752-996d-6f573306318b', // topstepx.mp4
  
  // Trading View - Outils et Techniques
  'Actif - Trading View': '1b4b4891-d60c-4644-bfa3-7de80c950e8a', // Actif - Trading View.mp4
  'Faire zoom - Trading View': '3b574bdc-4c55-414a-8028-a4733e13ebc9', // faire zoomm - Trading View.mp4
  'Fait 2 écran - Trading View': '03f94cf1-205a-41d5-81a6-cca3d6d76da2', // fait2 ecran - Trading View.mp4
  'Fait Backtest - Trading View': '1c1129c4-df13-4973-8c4e-c7aa4c9d01b4', // faitBacktest - Trading View.mp4
  'Fait capture - Trading View': '86b787f6-7012-40cd-b98d-9bd2940b4165', // faitcapture - Trading View (1).mp4
  'Fait Fond - Trading View': '03d84e9e-f51a-45df-b2e0-96fe4107fd1c', // faitFond - Trading View.mp4
  'Fait indic - Trading View': '99bd5c2c-8c7c-4d9d-98ee-d3f40cf0e4cd', // faitindic - Trading View.mp4
  'Outil en fav - Trading View': '23fbc623-7626-4c1f-8c85-8b5c568cb7fa', // outil en fav - Trading View .mp4
  'Plan future - Trading View': 'b1a00800-5650-4557-a3c6-31adcfc98a1e', // planfuture - Trading View.mp4
  'Supprimer - Trading View': 'a65a03c6-eb43-43a4-9050-789a482ffb06', // supprimer - Trading View.mp4
  'Tracer ligne - Trading View': '0f4ec3c0-2437-4996-be13-81c72f528fc7', // ttracer ligne - Trading View.mp4
  'UT - Trading View': 'f24ac09e-5055-4d4a-ac8f-85e47a2f3b8b', // Ut - Trading View (1).mp4
};

console.log('📋 MAPPING DES VIDÉOS:');
console.log('====================\n');

// Générer les requêtes SQL
const updates = [];

for (const [lessonTitle, videoId] of Object.entries(videoMappings)) {
  const video = bunnyVideos.find(v => v.guid === videoId);
  const videoTitle = video ? video.title : 'NULL';
  
  if (videoId) {
    updates.push({
      lessonTitle,
      videoId,
      videoTitle,
      sql: `UPDATE training_lessons SET bunny_video_id = '${videoId}' WHERE title = '${lessonTitle.replace(/'/g, "''")}';`
    });
    console.log(`✅ ${lessonTitle}`);
    console.log(`   → ${videoTitle} (${videoId})`);
  } else {
    updates.push({
      lessonTitle,
      videoId: null,
      videoTitle: 'NULL',
      sql: `UPDATE training_lessons SET bunny_video_id = NULL WHERE title = '${lessonTitle.replace(/'/g, "''")}';`
    });
    console.log(`⚠️  ${lessonTitle}`);
    console.log(`   → Pas de vidéo associée`);
  }
  console.log('');
}

// Générer le script SQL
const sqlScript = `-- ============================================
-- Script : Correction automatique des associations vidéos-leçons
-- ============================================
-- Généré automatiquement le ${new Date().toISOString()}
-- ============================================

BEGIN;

${updates.map(u => u.sql).join('\n')}

-- Vérification
SELECT 
  tl.title as lesson_title,
  tl.bunny_video_id,
  CASE 
    WHEN tl.bunny_video_id IS NULL THEN '❌ Pas de vidéo'
    ELSE '✅ Vidéo associée'
  END as status
FROM training_lessons tl
ORDER BY tl.title;

COMMIT;
`;

fs.writeFileSync('supabase/sql/fix-all-video-associations.sql', sqlScript);
console.log('✅ Script SQL généré: supabase/sql/fix-all-video-associations.sql');

