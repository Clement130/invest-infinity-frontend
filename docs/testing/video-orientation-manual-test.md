# Guide de Test Manuel - Rotation Vidéo Mobile

## 📱 Prérequis

- Un appareil mobile (iPhone ou Android)
- Connexion à https://investinfinity.fr
- Compte utilisateur avec accès aux formations
- Rotation automatique de l'écran activée

## 🧪 Test 1 : Rotation Basique (Portrait → Paysage)

### Objectif
Vérifier que la vidéo continue au même endroit après rotation

### Étapes

1. **Se connecter**
   - Ouvrir Safari (iOS) ou Chrome (Android)
   - Aller sur https://investinfinity.fr
   - Se connecter avec vos identifiants
   - ✅ Vous êtes connecté

2. **Accéder à une formation**
   - Menu → Formations
   - Sélectionner un module (ex: "Trading Débutant")
   - Cliquer sur une leçon avec vidéo
   - ✅ La page de la leçon s'ouvre

3. **Lancer la vidéo**
   - Cliquer sur le bouton Play
   - Attendre que la vidéo démarre
   - ✅ La vidéo se lit correctement

4. **Avancer dans la vidéo**
   - Laisser la vidéo jouer pendant 30 secondes
   - OU utiliser la barre de progression pour aller à 0:30
   - ✅ La vidéo est à ~30 secondes

5. **Pivoter l'écran**
   - Tourner votre téléphone en position paysage
   - Attendre 1-2 secondes
   - ✅ L'écran s'adapte en mode paysage

6. **Vérifier la continuité**
   - ✅ **SUCCÈS** : La vidéo continue à ~30 secondes
   - ❌ **ÉCHEC** : La vidéo redémarre à 0:00

### Résultat Attendu

```
✅ La vidéo continue au même timestamp (±1-2 secondes)
✅ La lecture reprend automatiquement
✅ Pas de freeze ou d'erreur
✅ L'interface s'adapte correctement au mode paysage
```

---

## 🧪 Test 2 : Rotation avec Pause

### Objectif
Vérifier que l'état pause est préservé

### Étapes

1. **Lire une vidéo**
   - Lancer une vidéo
   - Avancer jusqu'à 1:00 (1 minute)
   - ✅ La vidéo est à 1:00

2. **Mettre en pause**
   - Cliquer sur le bouton Pause
   - ✅ La vidéo est en pause

3. **Pivoter l'écran**
   - Tourner en paysage
   - Attendre 1-2 secondes
   - ✅ L'écran s'adapte

4. **Vérifier l'état**
   - ✅ **SUCCÈS** : La vidéo est toujours à 1:00 ET en pause
   - ❌ **ÉCHEC** : La vidéo redémarre ou change de position

### Résultat Attendu

```
✅ Position préservée (1:00)
✅ État pause préservé (pas de lecture auto)
✅ Interface réactive
```

---

## 🧪 Test 3 : Rotations Multiples

### Objectif
Vérifier la stabilité avec rotations rapides

### Étapes

1. **Lancer une vidéo**
   - Démarrer une vidéo
   - Avancer à 45 secondes
   - ✅ Vidéo en lecture à 0:45

2. **Rotation 1 : Portrait → Paysage**
   - Pivoter en paysage
   - Attendre 2 secondes
   - ✅ Vidéo continue à ~0:45

3. **Rotation 2 : Paysage → Portrait**
   - Pivoter en portrait
   - Attendre 2 secondes
   - ✅ Vidéo continue à ~0:47

4. **Rotation 3 : Portrait → Paysage (rapide)**
   - Pivoter immédiatement en paysage
   - ✅ Vidéo continue sans problème

5. **Rotation 4 : Paysage → Portrait (rapide)**
   - Pivoter immédiatement en portrait
   - ✅ Vidéo continue normalement

### Résultat Attendu

```
✅ Toutes les rotations sont fluides
✅ Pas de freeze ou blocage
✅ La position progresse normalement (pas de reset)
✅ Pas de comportement erratique
```

---

## 🧪 Test 4 : Navigation Entre Leçons

### Objectif
Vérifier l'isolation des états entre leçons

### Étapes

1. **Vidéo A**
   - Lancer la leçon "Introduction"
   - Avancer à 30 secondes
   - Pivoter l'écran
   - ✅ Position préservée à 0:30

2. **Changer de leçon**
   - Retour au module
   - Ouvrir la leçon "Les Bases du Trading"
   - ✅ Nouvelle vidéo démarre à 0:00 (normal)

3. **Vidéo B**
   - Avancer à 1:00
   - Pivoter l'écran
   - ✅ Position préservée à 1:00

4. **Retour à Vidéo A**
   - Retour au module
   - Rouvrir la leçon "Introduction"
   - ✅ **IMPORTANT** : Devrait reprendre près de 0:30
   - (Si dans la même session < 1 heure)

### Résultat Attendu

```
✅ Chaque leçon a son propre état
✅ Pas de "contamination" entre vidéos
✅ Navigation fluide
✅ États préservés par leçon (dans la session)
```

---

## 🧪 Test 5 : Plein Écran + Rotation

### Objectif
Vérifier le comportement en mode plein écran

### Étapes

1. **Lancer une vidéo**
   - Démarrer la lecture
   - Avancer à 40 secondes
   - ✅ Vidéo à 0:40

2. **Passer en plein écran**
   - Cliquer sur le bouton plein écran
   - ✅ Vidéo en plein écran

3. **Pivoter en plein écran**
   - Tourner l'écran en paysage
   - ✅ Plein écran s'adapte

4. **Vérifier la position**
   - ✅ Vidéo continue à ~0:40
   - ✅ Pas de redémarrage

5. **Sortir du plein écran**
   - Cliquer sur Exit ou touche retour
   - Pivoter en portrait
   - ✅ Vidéo continue normalement

### Résultat Attendu

```
✅ Plein écran fonctionne
✅ Rotation en plein écran préserve la position
✅ Sortie du plein écran + rotation OK
✅ Pas de freeze ou erreur
```

---

## 🧪 Test 6 : Vérification DevTools (Technique)

### Objectif
Vérifier que sessionStorage fonctionne correctement

### Prérequis
- Chrome Desktop ou Safari iOS avec Remote Debugging
- OU Chrome Android avec USB Debugging

### Étapes

#### Sur Chrome Desktop (Émulation Mobile)

1. **Ouvrir DevTools**
   - F12 ou Clic droit → Inspecter
   - Toggle device toolbar (Ctrl+Shift+M)
   - Sélectionner "iPhone 14 Pro" ou "Pixel 7"

2. **Lancer une vidéo**
   - Naviguer vers une leçon
   - Démarrer la vidéo
   - Avancer à 20 secondes

3. **Vérifier sessionStorage**
   - DevTools → Application → Storage → Session Storage
   - Chercher : `bunny_player_state_*`
   - ✅ Voir un objet JSON avec currentTime, wasPlaying, timestamp

4. **Simuler une rotation**
   - DevTools → Toggle device orientation (portrait/landscape)
   - Observer sessionStorage se mettre à jour

5. **Vérifier la structure**
   ```json
   {
     "currentTime": 20.5,
     "wasPlaying": true,
     "timestamp": 1736179200000
   }
   ```
   - ✅ Structure correcte
   - ✅ currentTime correspond à la vidéo
   - ✅ wasPlaying = true si en lecture
   - ✅ timestamp récent

#### Sur Mobile Réel (Remote Debugging)

1. **iOS Safari**
   - Sur Mac : Safari → Develop → [Votre iPhone]
   - Sur iPhone : Réglages → Safari → Avancé → Inspecteur Web
   - Connecter via USB
   - Ouvrir la page dans Safari
   - Inspecter via Mac

2. **Android Chrome**
   - Sur téléphone : Activer USB Debugging
   - Sur ordinateur : Chrome → chrome://inspect
   - Connecter via USB
   - Inspecter la page

3. **Vérifier sessionStorage**
   - Même procédure que Chrome Desktop
   - Application → Session Storage
   - Vérifier la structure JSON

### Résultat Attendu

```
✅ sessionStorage contient bunny_player_state_<lessonId>
✅ Structure JSON valide
✅ currentTime mis à jour toutes les ~1 seconde
✅ wasPlaying reflète l'état réel
✅ timestamp récent (< 1 heure)
```

---

## 🧪 Test 7 : Fermeture/Réouverture Onglet

### Objectif
Vérifier la persistence dans la session

### Étapes

1. **Lancer une vidéo**
   - Démarrer une vidéo
   - Avancer à 2:00
   - ✅ Vidéo à 2:00

2. **Ouvrir un nouvel onglet**
   - Menu → Nouvel onglet
   - Naviguer ailleurs (ex: Google)
   - ✅ Onglet formation toujours ouvert

3. **Revenir à l'onglet formation**
   - Cliquer sur l'onglet de la formation
   - ✅ Page toujours chargée

4. **Pivoter l'écran**
   - Tourner en paysage
   - ✅ **SUCCÈS** : Vidéo continue près de 2:00

### Résultat Attendu

```
✅ État préservé entre les onglets (même session)
✅ Position correcte après retour
✅ Rotation fonctionne après changement d'onglet
```

---

## 📊 Grille de Test Complète

| Test | iOS Safari | Chrome Android | Status |
|------|------------|----------------|--------|
| Rotation Portrait → Paysage | ⬜ | ⬜ | |
| Rotation avec Pause | ⬜ | ⬜ | |
| Rotations Multiples | ⬜ | ⬜ | |
| Navigation Entre Leçons | ⬜ | ⬜ | |
| Plein Écran + Rotation | ⬜ | ⬜ | |
| DevTools sessionStorage | ⬜ | ⬜ | |
| Fermeture/Réouverture | ⬜ | ⬜ | |

**Légende** : ⬜ Non testé | ✅ Réussi | ❌ Échoué | ⚠️ Partiel

---

## 🐛 Problèmes Possibles & Solutions

### Problème 1 : Vidéo ne reprend pas automatiquement (iOS)

**Symptôme** :
- Position restaurée correctement
- Mais la vidéo reste en pause

**Cause** :
- Politique autoplay iOS

**Solution** :
- ✅ **NORMAL** sur iOS
- L'utilisateur doit appuyer sur Play
- La position est correcte (fonctionnalité principale OK)

**Workaround** :
- Aucun (limitation navigateur)

---

### Problème 2 : Décalage de 1-2 secondes

**Symptôme** :
- Vidéo à 30s → Après rotation : 28s ou 32s

**Cause** :
- Latence de sauvegarde/restauration
- Buffer vidéo

**Solution** :
- ✅ **ACCEPTABLE** (±2s tolérance)
- Bien meilleur que redémarrage à 0:00

**Workaround** :
- Aucun nécessaire

---

### Problème 3 : sessionStorage non trouvé

**Symptôme** :
- DevTools : Pas de `bunny_player_state_*`

**Causes possibles** :
1. Navigation privée (sessionStorage peut être désactivé)
2. sessionStorage plein (très rare)
3. Bug navigateur

**Solutions** :
1. Tester en mode normal (pas privé)
2. Vider sessionStorage : `sessionStorage.clear()`
3. Recharger la page

---

### Problème 4 : Freeze après rotation

**Symptôme** :
- Écran noir après rotation
- Ou vidéo figée

**Causes possibles** :
1. Connexion réseau perdue
2. Bug navigateur mobile
3. Iframe rechargée mais pas réinitialisée

**Solutions** :
1. Vérifier la connexion réseau
2. Rafraîchir la page (Pull-to-refresh)
3. Fermer/rouvrir l'onglet

---

## 📝 Rapport de Test

Après avoir effectué les tests, remplir ce rapport :

```markdown
## Rapport de Test Mobile - Rotation Vidéo

**Date** : _______________
**Testeur** : _______________
**Appareil** : _______________
**Navigateur** : _______________
**Version OS** : _______________

### Tests Effectués

- [ ] Test 1 : Rotation Basique
- [ ] Test 2 : Rotation avec Pause
- [ ] Test 3 : Rotations Multiples
- [ ] Test 4 : Navigation Entre Leçons
- [ ] Test 5 : Plein Écran + Rotation
- [ ] Test 6 : DevTools sessionStorage
- [ ] Test 7 : Fermeture/Réouverture

### Résultats

**Tests réussis** : __ / 7
**Tests échoués** : __ / 7

### Problèmes Détectés

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Commentaires

_______________________________________________
_______________________________________________
_______________________________________________

### Conclusion

☐ ✅ Tout fonctionne parfaitement
☐ ⚠️ Quelques problèmes mineurs (détails ci-dessus)
☐ ❌ Problèmes critiques (rollback recommandé)
```

---

## 🎯 Critères de Succès

Pour valider le déploiement, il faut :

1. ✅ Au moins **5/7 tests** réussis
2. ✅ Test 1 (Rotation Basique) **OBLIGATOIRE**
3. ✅ Aucun freeze ou crash
4. ✅ Aucune régression (anciennes fonctionnalités OK)
5. ✅ Performance acceptable (pas de lag)

---

## 📞 Support

En cas de problème lors des tests :

1. **Vérifier les logs console** (F12)
2. **Prendre des captures d'écran** des erreurs
3. **Noter l'environnement exact** (appareil, OS, navigateur)
4. **Contacter l'équipe** avec ces informations

---

**Fin du guide de test** ✅

