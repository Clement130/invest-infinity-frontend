-- Mettre à jour le profil pour investinfinityfr@gmail.com
-- S'assurer qu'il a le rôle 'admin' (ou 'developer')
UPDATE profiles
SET role = 'admin'
WHERE email = 'investinfinityfr@gmail.com';

-- Vérification (optionnel, pour voir le résultat)
SELECT id, email, role, license 
FROM profiles 
WHERE email = 'investinfinityfr@gmail.com';

