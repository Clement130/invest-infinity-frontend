# 🔐 Configuration du Compte Admin - investinfinityfr@gmail.com

## 📋 Informations du Compte

- **Email** : `investinfinityfr@gmail.com`
- **Mot de passe** : `Investinfinity13013.`
- **Rôle requis** : `admin` ou `developer`

## ✅ Vérifications Effectuées

### 1. Configuration du Code
- ✅ L'email est dans la liste des super admins dans `src/lib/auth.ts`
- ✅ La fonction `isSuperAdmin()` vérifie correctement l'email et le rôle

### 2. Configuration de la Base de Données

**À exécuter dans Supabase Dashboard > SQL Editor :**

```sql
-- Vérifier si le compte existe et est admin
SELECT 
  p.id,
  p.email,
  p.role,
  p.license,
  u.email_confirmed_at,
  CASE 
    WHEN p.role IN ('admin', 'developer') THEN '✅ Admin configuré'
    ELSE '⚠️  Rôle non admin'
  END as status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'investinfinityfr@gmail.com';
```

## 🔧 Actions à Effectuer

### Si le compte n'existe pas :

1. **Créer l'utilisateur dans Supabase** :
   - Aller dans **Authentication > Users > Add User**
   - Email : `investinfinityfr@gmail.com`
   - Password : `Investinfinity13013.`
   - Auto Confirm : ✅ Oui

2. **Créer le profil** :
   ```sql
   INSERT INTO profiles (id, email, role, license)
   SELECT 
     id,
     email,
     'admin',
     'immersion'
   FROM auth.users
   WHERE email = 'investinfinityfr@gmail.com';
   ```

### Si le compte existe mais n'est pas admin :

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'investinfinityfr@gmail.com'
  AND role != 'admin'
  AND role != 'developer';
```

### Si le mot de passe doit être réinitialisé :

1. **Via l'interface Supabase** :
   - Aller dans **Authentication > Users**
   - Trouver `investinfinityfr@gmail.com`
   - Cliquer sur **Reset Password**

2. **Ou via SQL** (nécessite des privilèges admin) :
   ```sql
   -- Note: Cette requête nécessite des privilèges spéciaux
   -- Il est préférable d'utiliser l'interface Supabase
   ```

## 🧪 Test de Connexion

Après configuration, tester la connexion :

```bash
npm run test:admin:investinfinity
```

Ou manuellement :
1. Aller sur `/login`
2. Entrer `investinfinityfr@gmail.com` / `Investinfinity13013.`
3. Vérifier la redirection vers `/admin`

## 📝 Script SQL Complet

Voir le fichier : `supabase/sql/ensure-investinfinity-admin.sql`

## ⚠️ Notes Importantes

1. **Sécurité** : Le mot de passe est stocké en clair dans ce document pour référence. En production, utiliser un gestionnaire de mots de passe.

2. **Super Admin** : L'email est déjà configuré dans `src/lib/auth.ts` comme super admin, donc une fois le rôle `admin` ou `developer` configuré en base, l'accès admin complet sera disponible.

3. **Vérification** : Après chaque modification, vérifier que :
   - Le compte existe dans `auth.users`
   - Le profil existe dans `profiles` avec `role = 'admin'`
   - La connexion fonctionne avec les identifiants

