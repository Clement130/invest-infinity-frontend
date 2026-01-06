# Guide de Test - Rotation d'Écran Mobile

## 🎯 Objectif
Vérifier que la vidéo reprend au même timestamp après une rotation d'écran sur mobile.

## 📱 Pré-requis
- Un appareil mobile (iOS ou Android)
- Connexion à investinfinity.fr
- Compte de test actif

## 🔍 Scénario de Test

### Test 1 : Rotation Basique
1. **Ouvrir** https://investinfinity.fr sur mobile
2. **Se connecter** avec vos identifiants
3. **Naviguer** vers "Mes Formations"
4. **Sélectionner** un module (ex: MetaTrader & TopStepX)
5. **Ouvrir** une leçon vidéo
6. **Lancer** la vidéo et attendre 10-15 secondes
7. **Pivoter** l'écran (portrait → paysage ou paysage → portrait)
8. **✅ RÉSULTAT ATTENDU** : 
   - La vidéo continue au même timestamp (±2 secondes)
   - La vidéo reprend automatiquement si elle était en lecture
   - Pas de retour au début (0:00)

### Test 2 : Rotation en Pause
1. **Lancer** une vidéo
2. **Avancer** à 30 secondes
3. **Mettre en pause**
4. **Pivoter** l'écran
5. **✅ RÉSULTAT ATTENDU** :
   - La vidéo reste à 30 secondes
   - La vidéo reste en pause
   - Le bouton play est visible

### Test 3 : Rotation Multiple
1. **Lancer** une vidéo
2. **Avancer** à 20 secondes
3. **Pivoter** 3 fois rapidement (portrait → paysage → portrait)
4. **✅ RÉSULTAT ATTENDU** :
   - La vidéo revient au dernier état sauvegardé (~20 secondes)
   - Pas de plantage ou erreur

### Test 4 : Plein Écran
1. **Lancer** une vidéo
2. **Avancer** à 15 secondes
3. **Activer** le mode plein écran
4. **Attendre** 5 secondes
5. **Quitter** le plein écran
6. **✅ RÉSULTAT ATTENDU** :
   - La vidéo continue depuis ~20 secondes
   - Pas de redémarrage

## 🐛 Logs de Debug

### Activer les Logs Chrome sur Mobile
**Android Chrome:**
1. Connecter le téléphone en USB
2. Ouvrir `chrome://inspect` sur PC
3. Inspecter la page mobile
4. Voir les logs en temps réel

**iOS Safari:**
1. Activer "Inspecteur web" dans Réglages > Safari > Avancé
2. Connecter l'iPhone au Mac
3. Safari Desktop > Développement > [Votre iPhone]
4. Voir les logs dans la console

### Messages à Surveiller
Lors de la rotation, vous devriez voir :
```
[BunnyPlayer] 🔄 Changement d'orientation détecté
[BunnyPlayer] 💾 État persisté: { time: '15.50s', playing: true, ... }
[BunnyPlayer] Iframe chargée, tentative d'initialisation Player.js
[BunnyPlayer] 🔄 Restauration de l'état persisté: { currentTime: 15.5, ... }
[BunnyPlayer] ✅ Temps restauré à: 15.50 s
[BunnyPlayer] ▶️ Lecture automatiquement reprise
```

## ❌ Problèmes Connus

### iOS Safari
- **Autoplay bloqué** : Sur iOS, la vidéo peut ne pas reprendre automatiquement (politique Apple). L'utilisateur devra cliquer sur play.
- **Solution** : Le timestamp est quand même restauré, seul le play automatique est bloqué.

### Android Chrome
- **Délai de rechargement** : L'iframe peut mettre 1-2 secondes à se recharger lors de la rotation.
- **Solution** : Notre code attend jusqu'à 5 secondes avant d'abandonner la restauration.

## 🔧 Troubleshooting

### La vidéo redémarre à 0:00
**Diagnostic:**
```javascript
// Dans la console du navigateur
sessionStorage.getItem('bunny_player_state_...') // Devrait retourner un objet JSON
```

**Solutions:**
1. Vérifier que le sessionStorage n'est pas désactivé
2. Vérifier qu'il n'y a pas d'erreur JavaScript dans la console
3. Vérifier que le videoId et lessonId sont corrects

### La vidéo ne reprend pas automatiquement
**C'est normal sur iOS !** 
- Le navigateur bloque l'autoplay
- L'utilisateur doit cliquer sur play
- Le timestamp est quand même correct

### Logs manquants
**Vérifier:**
```javascript
// Dans la console
console.log(window.playerjs); // Devrait être défini
console.log(sessionStorage); // Devrait être accessible
```

## 📊 Résultats Attendus

| Plateforme | Restauration Timestamp | Autoplay | Notes |
|------------|------------------------|----------|-------|
| **iOS Safari** | ✅ Oui | ❌ Non | Autoplay bloqué par iOS |
| **Android Chrome** | ✅ Oui | ✅ Oui | Fonctionne complètement |
| **Android Firefox** | ✅ Oui | ⚠️ Parfois | Dépend des paramètres |
| **Desktop Chrome** | ✅ Oui | ✅ Oui | Référence |

## 🎬 Vidéo de Test Recommandée
- **Module** : MetaTrader & TopStepX & Apex
- **Leçon** : Comment prendre un Trade sur MetaTrader ?
- **ID Vidéo** : `8254f866-0ab0-498c-b1fe-5ef2b66a2ab8`
- **Durée** : 2:01
- **URL** : https://investinfinity.fr/app/modules/3dafab41-dc43-429a-bdd7-6bee2c432d0e/lessons/39b0f250-88b4-4a5d-94c5-8dbac60994b2

## ✅ Checklist Finale

- [ ] Test 1 : Rotation basique OK
- [ ] Test 2 : Rotation en pause OK
- [ ] Test 3 : Rotations multiples OK
- [ ] Test 4 : Plein écran OK
- [ ] iOS Safari testé
- [ ] Android Chrome testé
- [ ] Logs vérifiés (aucune erreur)
- [ ] Timestamp restauré (±2 secondes)
- [ ] Expérience utilisateur satisfaisante

## 📝 Rapport de Bug

Si vous rencontrez un problème, notez :
1. **Plateforme** : iOS 17.2 / Android 14 / etc.
2. **Navigateur** : Safari / Chrome / Firefox + version
3. **Étape** : À quelle étape le problème survient
4. **Logs** : Copier les messages de la console
5. **Timestamp** : Temps attendu vs temps réel
6. **Screenshots** : Si possible

---

**Dernière mise à jour** : 2026-01-06
**Version** : 2.0 (avec restauration améliorée)

