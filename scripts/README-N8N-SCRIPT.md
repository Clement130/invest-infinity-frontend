# Script de Création Automatique des Workflows N8N

## 🚀 Utilisation Rapide

### 1. Obtenir une clé API N8N

1. Va dans ton instance N8N : `https://n8n.srv1154679.hstgr.cloud/`
2. **Settings** → **API** (menu de gauche)
3. Clique sur **"Create API Key"**
4. Copie la clé générée (format: `n8n_api_xxxxxxxxxxxxx`)

### 2. Exécuter le script

**Option A : Avec variables d'environnement (recommandé)**
```bash
export N8N_API_KEY="ta-cle-api-ici"
node scripts/create-n8n-workflows.js
```

**Option B : Avec fichier .env**
```bash
# Crée un fichier .env à la racine du projet
echo "N8N_API_KEY=ta-cle-api-ici" >> .env
node scripts/create-n8n-workflows.js
```

**Option C : Directement dans la commande**
```bash
N8N_API_KEY="ta-cle-api-ici" node scripts/create-n8n-workflows.js
```

### 3. Le script va :
- ✅ Se connecter à ton instance N8N
- ✅ Vérifier si les workflows existent déjà
- ✅ Créer les 2 workflows (ou les mettre à jour s'ils existent)
- ✅ Les workflows seront **désactivés** par défaut pour que tu puisses configurer les credentials

### 4. Configuration post-création

Après l'exécution du script :

1. **Va dans N8N → Workflows**
2. **Configure les credentials** pour chaque workflow :
   - **Postgres node** → Credential "Supabase" (crée-le si nécessaire)
   - **HTTP Request node** → Credential "Resend API" (crée-le si nécessaire)

3. **Variables d'environnement** (Settings → Environment Variables) :
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=noreply@investinfinity.fr
   ```

4. **Active les workflows** avec le toggle "Active" en haut à droite

5. **Teste** avec "Execute Workflow" pour vérifier que tout fonctionne

## 📋 Workflows créés

### 1. Newsletter - Séquence de Bienvenue
- **Trigger** : Toutes les heures
- **Emails** : J+3, J+7, J+14 après inscription
- **Contenu** : Conseils avancés, témoignages, offre spéciale

### 2. Newsletter - Hebdomadaire (Mardi 10h30)
- **Trigger** : Tous les mardis à 10h30
- **Cible** : Abonnés actifs (14+ jours après inscription)
- **Contenu** : Analyse de marché, conseils stratégiques (rotation)

## 🔧 Personnalisation

Si tu veux modifier les workflows après création :
- Les workflows sont créés en mode **désactivé**
- Tu peux les modifier librement dans l'interface N8N
- Le script peut être réexécuté pour les mettre à jour depuis les fichiers JSON

## 🐛 Dépannage

**Erreur "Failed to get user"** :
- Vérifie que ta clé API est correcte
- Vérifie que l'URL N8N est correcte (variable `N8N_URL`)

**Erreur "Failed to create workflow"** :
- Vérifie que tu as les permissions admin dans N8N
- Vérifie que l'API est activée dans Settings → API

**Workflows créés mais ne fonctionnent pas** :
- Vérifie que les credentials sont bien configurés
- Vérifie que les variables d'environnement sont définies
- Teste manuellement avec "Execute Workflow"


