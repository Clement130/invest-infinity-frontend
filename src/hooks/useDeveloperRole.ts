import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';

export function useDeveloperRole() {
  const { user, profile } = useAuth();

  const isDeveloper = useMemo(() => {
    if (!user || !profile) {
      return false;
    }

    // Vérifier UNIQUEMENT l'email - seul butcher13550@gmail.com peut voir le widget
    // investinfinityfr@gmail.com ne doit pas voir ce système, même s'il est admin
    const isDeveloperEmail = user.email === DEVELOPER_EMAIL || profile.email === DEVELOPER_EMAIL;

    return isDeveloperEmail;
  }, [user, profile]);

  return {
    isDeveloper,
    user,
    profile,
  };
}

