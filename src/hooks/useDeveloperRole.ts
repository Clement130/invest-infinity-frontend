import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';

export function useDeveloperRole() {
  const { user, profile } = useAuth();

  const isDeveloper = useMemo(() => {
    if (!user || !profile) {
      return false;
    }

    // Vérifier l'email ET le rôle
    const isDeveloperEmail = user.email === DEVELOPER_EMAIL || profile.email === DEVELOPER_EMAIL;
    const isDeveloperRole = profile.role === 'developer' || profile.role === 'admin';

    return isDeveloperEmail && isDeveloperRole;
  }, [user, profile]);

  return {
    isDeveloper,
    user,
    profile,
  };
}

