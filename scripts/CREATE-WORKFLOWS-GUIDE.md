# 🚀 Guide Rapide : Créer les Workflows N8N Automatiquement

## Méthode 1 : Script Automatique (Recommandé) ⚡

### Étape 1 : Obtenir la clé API N8N

1. Va dans ton instance N8N : `https://n8n.srv1154679.hstgr.cloud/`
2. **Settings** → **API** (menu de gauche)
3. Clique sur **"Create API Key"**
4. **Copie la clé** (format: `n8n_api_xxxxxxxxxxxxx`)

### Étape 2 : Exécuter le script

**Windows PowerShell :**
```powershell
$env:N8N_API_KEY="ta-cle-api-ici"
node scripts/create-n8n-workflows.js
```

**Windows CMD :**
```cmd
set N8N_API_KEY=ta-cle-api-ici
node scripts/create-n8n-workflows.js
```

**Linux/Mac :**
```bash
export N8N_API_KEY="ta-cle-api-ici"
node scripts/create-n8n-workflows.js
```

### Étape 3 : Le script va créer automatiquement

✅ **Workflow 1** : "Newsletter - Séquence de Bienvenue"  
✅ **Workflow 2** : "Newsletter - Hebdomadaire (Mardi 10h30)"

Les workflows seront créés en mode **désactivé** pour que tu puisses configurer les credentials.

---

## ⚙️ Configuration Post-Création

### 1. Credentials à créer dans N8N

#### Postgres (Supabase)
1. **Settings** → **Credentials** → **Add Credential** → **Postgres**
2. Nom : `Supabase`
3. Configuration :
   - **Host** : `db.[ton-projet].supabase.co`
   - **Port** : `5432`
   - **Database** : `postgres`
   - **User** : `postgres`
   - **Password** : [Ton mot de passe Supabase]
   - **SSL** : **Enabled**

#### HTTP Header Auth (Resend)
1. **Settings** → **Credentials** → **Add Credential** → **HTTP Header Auth**
2. Nom : `Resend API`
3. Configuration :
   - **Name** : `Authorization`
   - **Value** : `Bearer {{$env.RESEND_API_KEY}}`

### 2. Variables d'Environnement

**Settings** → **Environment Variables** :
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@investinfinity.fr
```

### 3. Configurer les Credentials dans les Workflows

1. **Workflows** → Ouvre chaque workflow
2. Pour chaque node **Postgres** :
   - Clique dessus → **Credential for Postgres** → Sélectionne `Supabase`
3. Pour chaque node **HTTP Request** :
   - Clique dessus → **Authentication** → Sélectionne `Resend API`

### 4. Activer les Workflows

Clique sur le toggle **"Active"** en haut à droite de chaque workflow.

### 5. Tester

Clique sur **"Execute Workflow"** pour tester une exécution manuelle.

---

## 📊 Workflows Créés

### Workflow 1 : Séquence de Bienvenue
- **Trigger** : Toutes les heures
- **Emails envoyés** :
  - J+3 : Conseils avancés
  - J+7 : Témoignages et social proof
  - J+14 : Offre spéciale

### Workflow 2 : Newsletter Hebdomadaire
- **Trigger** : Tous les mardis à 10h30
- **Cible** : Abonnés actifs (14+ jours après inscription)
- **Contenu** : Analyse de marché, conseils stratégiques (rotation)

---

## 🐛 Dépannage

### Erreur "Failed to get user"
- ✅ Vérifie que la clé API est correcte
- ✅ Vérifie que l'API est activée dans Settings → API

### Erreur "Failed to create workflow"
- ✅ Vérifie que tu as les permissions admin dans N8N
- ✅ Vérifie que l'URL N8N est correcte

### Workflows créés mais ne fonctionnent pas
- ✅ Vérifie que les credentials sont configurés dans chaque node
- ✅ Vérifie que les variables d'environnement sont définies
- ✅ Teste manuellement avec "Execute Workflow"

---

## 📝 Alternative : Import Manuel

Si le script ne fonctionne pas, tu peux importer les fichiers JSON manuellement :

1. **Workflows** → **Import from File**
2. Sélectionne `workflows/n8n-newsletter-welcome.json`
3. Répète pour `workflows/n8n-newsletter-weekly.json`
4. Configure les credentials comme indiqué ci-dessus

---

## ✅ Checklist Finale

- [ ] Script exécuté avec succès
- [ ] Workflows créés dans N8N
- [ ] Credential Postgres créé et configuré
- [ ] Credential HTTP Header Auth créé
- [ ] Variables d'environnement définies
- [ ] Credentials assignés aux nodes
- [ ] Workflows activés
- [ ] Test manuel réussi
















