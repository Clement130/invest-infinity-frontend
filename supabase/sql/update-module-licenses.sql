-- Script pour mettre à jour les required_license des modules de formation
-- Exécuter dans Supabase Dashboard > SQL Editor

-- Configuration des accès selon les formules:
-- Starter (147€): Modules de base (starter)
-- Premium (497€): Modules avancés + Starter (pro)
-- Bootcamp Élite (1997€): Tout (elite)

-- Afficher l'état actuel
SELECT id, title, required_license, position 
FROM training_modules 
ORDER BY position;

-- Mettre à jour les modules

-- Modules STARTER (accessibles à tous les clients payants)
UPDATE training_modules 
SET required_license = 'starter' 
WHERE title IN (
  'MetaTrader & TopStepX & Apex',
  'Etape 1 - La Fondation'
);

-- Modules PRO/PREMIUM (nécessite offre Premium ou supérieure)
UPDATE training_modules 
SET required_license = 'pro' 
WHERE title IN (
  'Etape 2 - Les Bases en ICT',
  'Etape 3 - La Stratégie ICT Mickael',
  'Trading View - Outils et Techniques'
);

-- Vérifier les mises à jour
SELECT id, title, required_license, position 
FROM training_modules 
ORDER BY position;

-- Récapitulatif des accès:
-- ✓ Starter: Etape 1, MetaTrader & TopStepX
-- ✓ Premium: + Etape 2, Etape 3, Trading View
-- ✓ Elite: Tout (les modules elite sont automatiquement accessibles)
