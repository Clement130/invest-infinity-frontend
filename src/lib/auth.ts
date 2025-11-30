export function isSuperAdmin(profile: { email?: string; role?: string } | null | undefined) {
  if (!profile?.email) return false;
  const email = profile.email.toLowerCase().trim();
  // Liste des emails super admin
  const superAdmins = ['investinfinityfr@gmail.com'];
  
  return (
    superAdmins.includes(email) &&
    (profile.role === 'admin' || profile.role === 'developer')
  );
}

