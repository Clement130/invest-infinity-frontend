
/**
 * Script pour s'assurer que l'utilisateur investinfinityfr@gmail.com est admin
 * Usage: node scripts/ensure-super-admin.js
 */

// Note: Ce script suppose que vous avez les variables d'environnement configurées
// ou que vous utilisez le client supabase configuré dans le projet.
// Comme nous sommes dans un contexte de dev local sans forcément accès direct à la prod via node ici,
// ceci est un template.

console.log("Pour donner les droits Super Admin, veuillez exécuter la requête SQL suivante dans votre Dashboard Supabase :");
console.log(`
UPDATE profiles
SET role = 'admin'
WHERE email = 'investinfinityfr@gmail.com';
`);

console.log("Vérifiez ensuite que le rôle est bien mis à jour.");

