import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement depuis .env.local
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return process.env;
  }
}

const env = loadEnv();

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini dans .env.local');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini dans .env.local');
  process.exit(1);
}

// Créer le client Supabase avec service_role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixAdminUser() {
  const adminEmail = 'butcher13550@gmail.com';
  
  console.log(`🔍 Recherche de l'utilisateur admin: ${adminEmail}\n`);

  try {
    // 1. Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', adminEmail)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Erreur lors de la recherche du profil: ${profileError.message}`);
    }

    if (!profile) {
      console.log('⚠️  Profil non trouvé dans la table profiles');
      console.log('💡 Le profil sera créé automatiquement après la synchronisation\n');
    }

    if (profile) {
      console.log(`✅ Profil trouvé:`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}\n`);
    }

    // 2. Vérifier si l'utilisateur existe dans auth.users (par email d'abord)
    console.log('🔍 Vérification dans auth.users...');
    
    try {
      // Chercher par email (plus fiable)
      const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(adminEmail)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
        },
      });

      let authUser = null;
      
      if (listResponse.ok) {
        const users = await listResponse.json();
        if (users.users && users.users.length > 0) {
          authUser = users.users[0];
        }
      }

      if (authUser) {
        console.log(`✅ Utilisateur trouvé dans auth.users:`);
        console.log(`   ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log(`   Créé le: ${authUser.created_at}`);
        
        // Vérifier si le profil existe et si l'ID correspond
        if (!profile || authUser.id !== profile.id) {
          if (profile) {
            console.log(`\n⚠️  ATTENTION: L'ID dans auth.users (${authUser.id}) ne correspond pas à l'ID du profil (${profile.id})`);
            console.log(`\n🔧 SOLUTION: Mettre à jour le profil avec le bon ID\n`);
            
            // Supprimer l'ancien profil
            const { error: deleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', profile.id);
            
            if (deleteError) {
              console.log(`⚠️  Erreur lors de la suppression: ${deleteError.message}`);
            } else {
              console.log(`✅ Ancien profil supprimé`);
            }
          } else {
            console.log(`\n🔧 Création du profil avec le bon ID...\n`);
          }
          
          // Créer le nouveau profil avec le bon ID
          // Note: profiles.id = auth.users.id (clé primaire qui référence auth.users)
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id, // L'ID est la clé primaire qui référence auth.users(id)
              email: authUser.email,
              role: profile?.role || 'admin',
            })
            .select()
            .single();
          
          if (createError) {
            console.log(`❌ Erreur lors de la création du profil: ${createError.message}`);
            console.log(`\n💡 Solution manuelle:`);
            console.log(`   1. Va dans Supabase Dashboard > Table Editor > profiles`);
            if (profile) {
              console.log(`   2. Supprime la ligne avec l'ID: ${profile.id}`);
              console.log(`   3. Crée une nouvelle ligne avec l'ID: ${authUser.id}`);
            } else {
              console.log(`   2. Crée une nouvelle ligne avec:`);
              console.log(`      - id: ${authUser.id}`);
              console.log(`      - email: ${authUser.email}`);
              console.log(`      - role: admin`);
            }
          } else {
            console.log(`✅ Profil créé/mis à jour avec le bon ID: ${authUser.id}`);
            console.log(`\n✅ Synchronisation terminée !`);
            console.log('💡 Tu peux maintenant relancer: npm run grant-access');
            process.exit(0);
          }
        } else {
          console.log(`\n✅ Les IDs correspondent parfaitement !`);
          console.log('💡 Tu peux maintenant relancer: npm run grant-access');
          process.exit(0);
        }
      } else {
        // Si pas trouvé par email, essayer par ID
        const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${profile.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey,
          },
        });

        if (response.ok) {
          const authUserById = await response.json();
          console.log(`✅ Utilisateur trouvé dans auth.users par ID:`);
          console.log(`   ID: ${authUserById.id}`);
          console.log(`   Email: ${authUserById.email}`);
          console.log(`   Créé le: ${authUserById.created_at}`);
          console.log('\n✅ L\'utilisateur existe dans auth.users. Le problème vient peut-être d\'ailleurs.');
          console.log('💡 Essaie de relancer: npm run grant-access');
          process.exit(0);
        } else if (response.status === 404) {
          console.log(`❌ Utilisateur non trouvé dans auth.users (404)`);
          console.log(`\n🔧 SOLUTION: L'utilisateur existe déjà avec un autre ID`);
          console.log(`💡 Le script va synchroniser le profil avec le bon ID\n`);
          
          // L'utilisateur existe déjà, on a juste besoin de synchroniser
          // On va chercher l'utilisateur par email dans la liste complète
          const allUsersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseServiceRoleKey}`,
              'apikey': supabaseServiceRoleKey,
            },
          });
          
          if (allUsersResponse.ok) {
            const allUsers = await allUsersResponse.json();
            const foundUser = allUsers.users?.find(u => u.email === adminEmail);
            
            if (foundUser) {
              console.log(`✅ Utilisateur trouvé avec l'ID: ${foundUser.id}`);
              
              if (foundUser.id !== profile.id) {
                console.log(`\n🔧 Synchronisation du profil...`);
                
                // Supprimer l'ancien profil
                const { error: deleteError } = await supabase
                  .from('profiles')
                  .delete()
                  .eq('id', profile.id);
                
                if (deleteError) {
                  console.log(`⚠️  Erreur lors de la suppression: ${deleteError.message}`);
                } else {
                  console.log(`✅ Ancien profil supprimé`);
                }
                
                // Créer le nouveau profil avec le bon ID
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    id: foundUser.id,
                    email: foundUser.email,
                    role: profile.role || 'admin',
                  });
                
                if (createError) {
                  console.log(`❌ Erreur lors de la création: ${createError.message}`);
                } else {
                  console.log(`✅ Profil synchronisé avec l'ID: ${foundUser.id}`);
                  console.log(`\n✅ Synchronisation terminée !`);
                  console.log('💡 Tu peux maintenant relancer: npm run grant-access');
                  process.exit(0);
                }
              }
            }
          }
          
          console.log('\n💡 Solution manuelle:');
          console.log('   1. Va sur https://supabase.com/dashboard');
          console.log('   2. Sélectionne ton projet');
          console.log('   3. Va dans Authentication > Users');
          console.log('   4. Trouve l\'utilisateur butcher13550@gmail.com');
          console.log('   5. Note son ID');
          console.log('   6. Va dans Table Editor > profiles');
          console.log('   7. Supprime la ligne avec l\'ancien ID');
          console.log('   8. Crée une nouvelle ligne avec le bon ID');
        } else {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }
      }
    } catch (fetchError) {
      console.error(`❌ Erreur lors de la vérification: ${fetchError.message}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixAdminUser();

