# 🔒 Rapport d'Audit de Sécurité

**Date:** 2025-01-27  
**Projet:** Frontend Trading Bot  
**Statut:** ⚠️ CRITIQUE - Action immédiate requise

---

## 🚨 Failles Critiques (Priorité 1)

### 1. **Secrets API Exposés dans le Code Source**
**Fichiers affectés:**
- `scripts/auto-configure-secrets.ps1` (lignes 5-6)
- `scripts/configure-secrets-via-api.ps1` (lignes 5-6)
- `scripts/configure-secrets-final.ps1` (lignes 5-6)
- `scripts/set-bunny-secrets.ps1` (lignes 5-6)

**Problème:**
```powershell
$BUNNY_LIBRARY_ID = "542258"
$BUNNY_API_KEY = "be9a7d66-a76f-4314-88af7279bb1e-d7d8-42ca"
```

**Impact:** Les clés API Bunny Stream sont hardcodées dans le code source et peuvent être exposées dans le dépôt Git.

**Solution:**
- ✅ Retirer immédiatement ces clés du code
- ✅ Utiliser des variables d'environnement
- ✅ Ajouter ces fichiers au `.gitignore` si nécessaire
- ✅ Régénérer les clés API exposées

---

### 2. **Clés API Bunny Stream Exposées Côté Client**
**Fichiers affectés:**
- `src/services/bunnyStreamService.ts` (lignes 6-7)
- `src/utils/admin/bunnyStreamAPI.ts` (lignes 6-7)
- `src/hooks/admin/useBunnyLibrary.ts` (lignes 13-14)

**Problème:**
```typescript
const BUNNY_STREAM_API_KEY = import.meta.env.VITE_BUNNY_STREAM_API_KEY;
```

**Impact:** Les clés API avec le préfixe `VITE_` sont compilées dans le bundle JavaScript et exposées publiquement. N'importe qui peut les extraire depuis le code source du navigateur.

**Solution:**
- ✅ Retirer complètement l'utilisation de `VITE_BUNNY_STREAM_API_KEY` côté client
- ✅ Toutes les opérations Bunny Stream doivent passer par les Edge Functions Supabase
- ✅ Les clés API doivent rester uniquement côté serveur (Edge Functions)

---

### 3. **Fonction update-capital Sans Authentification**
**Fichier:** `supabase/functions/update-capital/index.ts`

**Problème:**
La fonction Edge `update-capital` ne vérifie pas l'authentification de l'utilisateur. N'importe qui peut modifier le capital d'un lead en connaissant son email.

**Impact:** 
- Modification non autorisée des données de leads
- Manipulation possible des segments de capital
- Violation de l'intégrité des données

**Solution:**
```typescript
// Ajouter la vérification d'authentification
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 401, 
    headers: corsHeaders 
  });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { 
    status: 401, 
    headers: corsHeaders 
  });
}

// Vérifier que l'utilisateur modifie son propre email ou est admin
if (user.email !== email.toLowerCase() && !isAdmin(user.id)) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { 
    status: 403, 
    headers: corsHeaders 
  });
}
```

---

### 4. **CORS Trop Permissif**
**Fichiers affectés:**
- Toutes les Edge Functions (`supabase/functions/*/index.ts`)

**Problème:**
```typescript
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  // ...
};
```

**Impact:** Permet à n'importe quel site web de faire des requêtes vers vos Edge Functions, facilitant les attaques CSRF.

**Solution:**
```typescript
const allowedOrigins = [
  'https://votre-domaine.com',
  'https://www.votre-domaine.com',
  // Ajouter uniquement les domaines autorisés
];

const origin = req.headers.get('Origin');
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') 
    ? origin || '*' 
    : 'null',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
```

---

### 5. **Email Hardcodé dans Migration SQL**
**Fichier:** `supabase/migrations/20250123000001_update_is_developer_email_only.sql`

**Problème:**
```sql
and p.email = 'butcher13550@gmail.com'
```

**Impact:** 
- Email personnel exposé dans le code source
- Difficulté à changer le développeur sans migration
- Information sensible dans l'historique Git

**Solution:**
- ✅ Utiliser une table de configuration ou des variables d'environnement
- ✅ Créer une fonction qui lit depuis une table `developer_emails` ou similaire

---

## ⚠️ Failles Importantes (Priorité 2)

### 6. **Utilisation Incorrecte de l'ANON_KEY dans Authorization**
**Fichier:** `src/pages/ConfirmationPage.tsx` (ligne 37)

**Problème:**
```typescript
'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
```

**Impact:** L'ANON_KEY n'est pas un token d'authentification utilisateur. Cette requête ne sera pas authentifiée correctement.

**Solution:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Gérer l'absence de session
  return;
}

const response = await fetch(SUPABASE_CHECKOUT_FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  // ...
});
```

---

### 7. **Validation Côté Client Uniquement**
**Fichiers affectés:**
- `src/components/LandingForm/LeadForm.tsx`
- `src/components/AuthModal.tsx`

**Problème:** Les validations de formulaire sont uniquement côté client. Un attaquant peut contourner ces validations en appelant directement l'API.

**Impact:** 
- Injection de données malformées
- Bypass des règles de validation
- Corruption potentielle des données

**Solution:**
- ✅ Ajouter des validations côté serveur dans les Edge Functions
- ✅ Valider les formats d'email, téléphone, et montants
- ✅ Limiter les longueurs de champs
- ✅ Sanitizer les entrées utilisateur

**Exemple pour `register-lead`:**
```typescript
// Validation email
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return new Response(JSON.stringify({ error: 'Invalid email format' }), {
    status: 400,
    headers: corsHeaders,
  });
}

// Validation téléphone (format international)
if (!/^\+[1-9]\d{1,14}$/.test(telephone)) {
  return new Response(JSON.stringify({ error: 'Invalid phone format' }), {
    status: 400,
    headers: corsHeaders,
  });
}

// Validation capital
if (capitalValue < 0 || capitalValue > 1000000) {
  return new Response(JSON.stringify({ error: 'Invalid capital range' }), {
    status: 400,
    headers: corsHeaders,
  });
}

// Sanitization
const sanitizedPrenom = prenom.trim().substring(0, 100);
```

---

### 8. **Stockage de Données Sensibles dans localStorage**
**Fichiers affectés:**
- `src/components/AuthModal.tsx` (ligne 186)
- `src/components/LandingForm/LeadForm.tsx` (ligne 118)
- `src/pages/Welcome.tsx` (ligne 22)
- `src/pages/ConfirmationPage.tsx` (ligne 18)

**Problème:**
```typescript
localStorage.setItem('userEmail', formData.email);
```

**Impact:** 
- Les emails sont stockés en clair dans le navigateur
- Accessibles par JavaScript malveillant (XSS)
- Persistants même après déconnexion

**Solution:**
- ✅ Utiliser le contexte d'authentification Supabase
- ✅ Stocker uniquement dans la session serveur
- ✅ Si nécessaire, utiliser `sessionStorage` au lieu de `localStorage` (moins persistant)

---

### 9. **Absence de Rate Limiting**
**Fichiers affectés:**
- Toutes les Edge Functions

**Problème:** Aucune protection contre les abus de requêtes (DDoS, brute force, spam).

**Impact:**
- Coûts API élevés
- Surcharge serveur
- Spam de leads
- Attaques par déni de service

**Solution:**
- ✅ Implémenter un rate limiting par IP
- ✅ Utiliser Supabase Edge Functions rate limiting natif
- ✅ Ajouter un système de cache pour les requêtes répétées

**Exemple:**
```typescript
// Utiliser un Map en mémoire (ou Redis en production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const clientIP = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown';

const now = Date.now();
const limit = 10; // 10 requêtes
const window = 60000; // par minute

const clientData = requestCounts.get(clientIP);
if (clientData && clientData.resetAt > now) {
  if (clientData.count >= limit) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: corsHeaders,
    });
  }
  clientData.count++;
} else {
  requestCounts.set(clientIP, { count: 1, resetAt: now + window });
}
```

---

### 10. **Pas de Validation de Taille de Fichier pour Upload Vidéo**
**Fichier:** `supabase/functions/upload-bunny-video/index.ts`

**Problème:** Aucune limite de taille pour les fichiers vidéo uploadés.

**Impact:**
- Coûts de stockage élevés
- Surcharge serveur
- Attaques par upload de fichiers volumineux

**Solution:**
```typescript
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

if (videoFile.size > MAX_FILE_SIZE) {
  return new Response(
    JSON.stringify({ error: 'File size exceeds maximum allowed (500MB)' }),
    { status: 400, headers: corsHeaders }
  );
}

// Valider aussi le type MIME
const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
if (!allowedMimeTypes.includes(videoFile.type)) {
  return new Response(
    JSON.stringify({ error: 'Invalid file type' }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

## 🔍 Bugs et Problèmes Mineurs (Priorité 3)

### 11. **Gestion d'Erreur Insuffisante**
**Problème:** Beaucoup de fonctions ne gèrent pas correctement les erreurs, exposant des détails techniques aux utilisateurs.

**Solution:**
- ✅ Créer des messages d'erreur génériques pour les utilisateurs
- ✅ Logger les erreurs détaillées côté serveur uniquement
- ✅ Ne pas exposer les stack traces en production

---

### 12. **Vérification de Rôle Admin Incomplète**
**Fichier:** `supabase/functions/upload-bunny-video/index.ts` (ligne 56)

**Problème:** La vérification ne prend pas en compte le rôle `developer`.

**Solution:**
```typescript
if (!profile || (profile.role !== 'admin' && profile.role !== 'developer')) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Admin or Developer access required' }),
    { status: 403, headers: corsHeaders }
  );
}
```

---

### 13. **PROJECT_REF Hardcodé**
**Fichiers:** Tous les scripts PowerShell

**Problème:** Le PROJECT_REF Supabase est hardcodé dans plusieurs scripts.

**Solution:**
- ✅ Utiliser des variables d'environnement
- ✅ Lire depuis un fichier de configuration

---

### 14. **Absence de Logging de Sécurité**
**Problème:** Aucun logging des tentatives d'accès non autorisées ou d'actions suspectes.

**Solution:**
- ✅ Logger toutes les tentatives d'authentification échouées
- ✅ Logger les accès aux routes admin
- ✅ Logger les modifications de données sensibles
- ✅ Implémenter un système d'alerte pour les activités suspectes

---

## 📋 Plan d'Action Recommandé

### Phase 1 - Urgente (À faire immédiatement)
1. ✅ Retirer toutes les clés API du code source
2. ✅ Régénérer les clés API exposées
3. ✅ Ajouter l'authentification à `update-capital`
4. ✅ Retirer `VITE_BUNNY_STREAM_API_KEY` du code client
5. ✅ Restreindre CORS

### Phase 2 - Importante (Cette semaine)
6. ✅ Corriger l'utilisation de l'ANON_KEY dans ConfirmationPage
7. ✅ Ajouter des validations côté serveur
8. ✅ Implémenter le rate limiting
9. ✅ Ajouter la validation de taille de fichier
10. ✅ Remplacer localStorage par sessionStorage ou contexte auth

### Phase 3 - Amélioration (Ce mois)
11. ✅ Améliorer la gestion d'erreurs
12. ✅ Ajouter le logging de sécurité
13. ✅ Refactoriser les emails hardcodés
14. ✅ Documenter les bonnes pratiques de sécurité

---

## 🔐 Bonnes Pratiques à Suivre

1. **Ne jamais exposer de secrets dans le code source**
2. **Toujours valider côté serveur**
3. **Utiliser HTTPS partout**
4. **Implémenter l'authentification pour toutes les opérations sensibles**
5. **Limiter les permissions CORS**
6. **Implémenter le rate limiting**
7. **Logger les activités de sécurité**
8. **Utiliser des variables d'environnement pour la configuration**
9. **Sanitizer toutes les entrées utilisateur**
10. **Valider les types et tailles de fichiers uploadés**

---

## 📞 Contact

Pour toute question concernant ce rapport, contactez l'équipe de sécurité.

**Note:** Ce rapport doit être traité comme confidentiel et ne doit pas être partagé publiquement.

