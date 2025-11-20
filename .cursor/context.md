# Project Context

Project Name: Invest Infinity Training Platform

Nature: LMS (formation en trading) — aucune fonctionnalité de bot ou d'automatisation de trading.

Frontend: React + Vite (base existante à étendre proprement)

Backend: Supabase (Auth, DB, Storage, RLS, Functions, Edge Functions)

Payments: Stripe (paiements, abonnements, webhooks)

Videos: Bunny Stream (cours vidéo sécurisés via URLs signées)

Users:
  - client : élève humain qui suit les cours
  - admin : formateur ou membre du staff

Objectives:
  - Créer un espace client complet (modules, leçons, progression vidéo)
  - Créer un espace admin complet (CRUD modules/lessons, gestion accès élèves)
  - Implémenter les rôles client/admin avec Supabase Auth + RLS
  - Connecter les paiements Stripe aux accès contenus
  - Garantir une architecture front/back propre, sécurisée et maintenable
