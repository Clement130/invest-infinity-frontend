/**
 * Script pour créer automatiquement les workflows N8N via l'API
 * 
 * Prérequis:
 * 1. Avoir une clé API N8N (Settings → API dans N8N)
 * 2. Configurer les variables d'environnement ci-dessous
 * 
 * Usage:
 * node scripts/create-n8n-workflows.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - À modifier selon ton instance
const N8N_URL_ENV = process.env.N8N_URL || 'https://n8n.srv1154679.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || ''; // À obtenir dans Settings → API

// Supprimer le trailing slash si présent
const N8N_URL = N8N_URL_ENV.replace(/\/$/, '');

// Charger les workflows JSON
const welcomeWorkflowPath = path.join(__dirname, '../workflows/n8n-newsletter-welcome.json');
const weeklyWorkflowPath = path.join(__dirname, '../workflows/n8n-newsletter-weekly.json');

async function getCurrentUser() {
  try {
    const response = await fetch(`${N8N_URL}/api/v1/me`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error.message);
    throw error;
  }
}

async function createWorkflow(workflowData, userId) {
  // Préparer les données du workflow
  const workflowPayload = {
    name: workflowData.name,
    nodes: workflowData.nodes,
    connections: workflowData.connections,
    pinData: workflowData.pinData || {},
    settings: workflowData.settings || {},
    staticData: workflowData.staticData || null,
    tags: workflowData.tags || [],
    active: false, // On désactive par défaut pour permettre la configuration
  };

  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create workflow: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const createdWorkflow = await response.json();
    console.log(`✅ Workflow créé: ${createdWorkflow.name} (ID: ${createdWorkflow.id})`);
    return createdWorkflow;
  } catch (error) {
    console.error(`❌ Erreur lors de la création du workflow "${workflowData.name}":`, error.message);
    throw error;
  }
}

async function updateWorkflow(workflowId, workflowData, userId) {
  const workflowPayload = {
    name: workflowData.name,
    nodes: workflowData.nodes,
    connections: workflowData.connections,
    pinData: workflowData.pinData || {},
    settings: workflowData.settings || {},
    staticData: workflowData.staticData || null,
    tags: workflowData.tags || [],
    active: false,
  };

  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update workflow: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const updatedWorkflow = await response.json();
    console.log(`✅ Workflow mis à jour: ${updatedWorkflow.name} (ID: ${updatedWorkflow.id})`);
    return updatedWorkflow;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du workflow "${workflowData.name}":`, error.message);
    throw error;
  }
}

async function findExistingWorkflow(name) {
  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list workflows: ${response.status} ${response.statusText}`);
    }

    const workflows = await response.json();
    return workflows.data?.find(w => w.name === name);
  } catch (error) {
    console.error('❌ Erreur lors de la recherche de workflows existants:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Création des workflows N8N pour newsletters...\n');

  // Vérifier la clé API
  if (!N8N_API_KEY) {
    console.error('❌ Erreur: N8N_API_KEY n\'est pas défini');
    console.log('\n📝 Pour créer les workflows, tu dois:');
    console.log('1. Aller dans N8N → Settings → API');
    console.log('2. Créer une clé API');
    console.log('3. Exporter la variable:');
    console.log('   - Windows PowerShell: $env:N8N_API_KEY="ta-cle-api"');
    console.log('   - Windows CMD: set N8N_API_KEY=ta-cle-api');
    console.log('   - Linux/Mac: export N8N_API_KEY="ta-cle-api"');
    console.log('   Ou créer un fichier .env avec: N8N_API_KEY=ta-cle-api');
    console.log(`\n🌐 Instance N8N: ${N8N_URL}`);
    process.exit(1);
  }

  try {
    // Récupérer l'utilisateur actuel
    console.log('📋 Récupération des informations utilisateur...');
    const userId = await getCurrentUser();
    console.log(`✅ Utilisateur: ${userId}\n`);

    // Charger les workflows
    console.log('📂 Chargement des workflows...');
    const welcomeWorkflow = JSON.parse(fs.readFileSync(welcomeWorkflowPath, 'utf8'));
    const weeklyWorkflow = JSON.parse(fs.readFileSync(weeklyWorkflowPath, 'utf8'));
    console.log(`✅ Workflow 1: ${welcomeWorkflow.name}`);
    console.log(`✅ Workflow 2: ${weeklyWorkflow.name}\n`);

    // Créer ou mettre à jour les workflows
    const workflows = [
      { name: welcomeWorkflow.name, data: welcomeWorkflow },
      { name: weeklyWorkflow.name, data: weeklyWorkflow },
    ];

    for (const workflow of workflows) {
      console.log(`\n📝 Traitement: ${workflow.name}`);
      
      // Vérifier si le workflow existe déjà
      const existing = await findExistingWorkflow(workflow.name);
      
      if (existing) {
        console.log(`⚠️  Workflow existant trouvé (ID: ${existing.id}). Mise à jour...`);
        await updateWorkflow(existing.id, workflow.data, userId);
      } else {
        console.log(`✨ Création du nouveau workflow...`);
        await createWorkflow(workflow.data, userId);
      }
    }

    console.log('\n✅ Tous les workflows ont été créés/mis à jour avec succès!\n');
    console.log('📋 Prochaines étapes:');
    console.log('1. Va dans N8N → Workflows');
    console.log('2. Configure les credentials:');
    console.log('   - Postgres (Supabase)');
    console.log('   - HTTP Header Auth (Resend API)');
    console.log('3. Configure les variables d\'environnement:');
    console.log('   - RESEND_API_KEY');
    console.log('   - FROM_EMAIL');
    console.log('4. Active les workflows avec le toggle "Active"');
    console.log('5. Teste avec "Execute Workflow"\n');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error('\n💡 Vérifie que:');
    console.error(`   - N8N_URL est correct (actuel: ${N8N_URL})`);
    console.error('   - N8N_API_KEY est valide');
    console.error('   - Tu as les permissions nécessaires dans N8N');
    console.error('   - L\'API est activée dans Settings → API');
    console.error('\n🔗 URL de l\'API:', `${N8N_URL}/api/v1/workflows`);
    process.exit(1);
  }
}

main();
