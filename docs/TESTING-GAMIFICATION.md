# 🧪 **Plan de Test Gamification**

## 🎯 **Objectif**
Vérifier que toutes les fonctionnalités gamification sont opérationnelles après déploiement.

## 📋 **Prérequis**
- ✅ Migrations Supabase appliquées
- ✅ Script `init-gamification.sql` exécuté
- ✅ Serveur développement démarré (`npm run dev`)

## 🧪 **Tests à Effectuer**

### **1. Test d'Initialisation Utilisateur**
- [ ] Connexion avec un compte utilisateur
- [ ] Vérifier création automatique du wallet (1000 Focus Coins de départ)
- [ ] Vérifier affichage du solde dans le header

### **2. Test des Gains de Coins Automatiques**
- [ ] Regarder une leçon complète
- [ ] Vérifier gain de **+10 Focus Coins**
- [ ] Vérifier mise à jour du solde en temps réel
- [ ] Vérifier log dans timeline économie

### **3. Test de la Boutique**
- [ ] Ouvrir la boutique via le bouton "💰" dans le header
- [ ] Vérifier affichage des items :
  - [ ] Freeze Pass (150 coins)
  - [ ] XP Booster 2x (200 coins)
  - [ ] XP Booster 3x (300 coins)
  - [ ] Thème Aurora (250 coins)
  - [ ] Thème Eclipse (250 coins)

### **4. Test d'Achat - Freeze Pass**
- [ ] Acheter un Freeze Pass (150 coins)
- [ ] Vérifier débit du solde (-150 coins)
- [ ] Vérifier ajout dans l'inventaire
- [ ] Vérifier affichage du compteur Freeze Pass dans header
- [ ] Vérifier log d'achat dans timeline

### **5. Test d'Achat - Thème Cosmétique**
- [ ] Acheter le thème Aurora (250 coins)
- [ ] Vérifier débit du solde (-250 coins)
- [ ] Vérifier activation automatique du thème
- [ ] Vérifier changement visuel (couleurs nordiques)
- [ ] Vérifier persistance du thème après refresh

### **6. Test du Booster XP**
- [ ] Acheter XP Booster 2x (200 coins)
- [ ] Vérifier activation automatique
- [ ] Vérifier affichage "2x XP" dans header
- [ ] Regarder une leçon → vérifier gain doublé
- [ ] Attendre expiration (24h) → vérifier désactivation

### **7. Test des Quêtes Quotidiennes**
- [ ] Ouvrir "Quêtes du jour" dans le dashboard
- [ ] Vérifier quêtes disponibles :
  - [ ] "Première leçon" (+50 XP +10 coins)
  - [ ] "Leçon du jour" (+25 XP +5 coins)
  - [ ] "Streak actif" (+30 XP +8 coins)
- [ ] Compléter une quête
- [ ] Réclamer la récompense
- [ ] Vérifier gains XP et coins

### **8. Test XP Multi-Tracks**
- [ ] Vérifier sections "Maîtrise par compétences"
- [ ] Regarder leçons → vérifier gains XP par compétence
- [ ] Vérifier progression visuelle des barres
- [ ] Vérifier niveaux et paliers

### **9. Test Timeline Économie**
- [ ] Ouvrir "Historique économique" dans dashboard
- [ ] Vérifier logs de toutes les transactions :
  - [ ] Gains de coins (leçons)
  - [ ] Achats boutique
  - [ ] Récompenses quêtes
- [ ] Vérifier tri chronologique
- [ ] Vérifier calculs corrects

### **10. Test Inventaire**
- [ ] Ouvrir inventaire via header
- [ ] Vérifier items achetés visibles
- [ ] Vérifier quantités correctes
- [ ] Tester utilisation Freeze Pass (si applicable)

## 🔍 **Vérifications Visuelles**
- [ ] Animations fluides lors des achats
- [ ] Notifications toast pour gains/achats
- [ ] Mise à jour temps réel des soldes
- [ ] Transitions thème cosmétique
- [ ] Indicateurs booster actif

## 📊 **Métriques à Vérifier**
- [ ] Solde wallet cohérent après chaque transaction
- [ ] Pas d'erreurs dans console navigateur
- [ ] Pas d'erreurs dans logs serveur
- [ ] Performance acceptable (<2s pour achats)

## 🎯 **Critères de Succès**
- ✅ Tous les tests passent
- ✅ Interface fluide et responsive
- ✅ Économie équilibrée (gains = coûts)
- ✅ Gamification engageante et addictive

## 🚨 **Actions Correctives si Échec**
- Vérifier logs Supabase pour erreurs RPC
- Vérifier politiques RLS
- Vérifier données seed dans tables
- Debug via console navigateur
