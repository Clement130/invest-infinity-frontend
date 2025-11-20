import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/training';

export function useRoleGuard(allowedRoles?: UserRole[]) {
  const { user, role, loading, profile } = useAuth();
  const requiresRole = Boolean(allowedRoles && allowedRoles.length > 0);

  const isAllowed = useMemo(() => {
    if (!user) {
      return false;
    }

    if (!requiresRole) {
      return true;
    }

    if (!role) {
      // Si on attend un rôle mais qu'il n'est pas encore chargé, on attend
      // MAIS on limite le temps d'attente pour éviter les boucles infinies
      return false;
    }

    return allowedRoles?.includes(role) ?? false;
  }, [allowedRoles, requiresRole, role, user]);

  // awaitingRole : on attend le rôle seulement si l'utilisateur existe mais le profil n'est pas encore chargé
  // On limite à 5 secondes max pour éviter les boucles infinies
  const [awaitingRoleStart] = useState(() => Date.now());
  const awaitingRole = useMemo(() => {
    // Si un rôle n'est pas requis, on n'attend pas
    if (!requiresRole) {
      return false;
    }
    
    // Si l'utilisateur n'existe pas, on n'attend pas
    if (!user) {
      return false;
    }
    
    // Si le rôle est déjà chargé (même si c'est null), on n'attend plus
    if (role !== null || (profile === null && !loading)) {
      return false;
    }
    
    // Si on attend depuis plus de 5 secondes, on considère que c'est une erreur
    const waitTime = Date.now() - awaitingRoleStart;
    if (waitTime > 5000) {
      console.warn('[useRoleGuard] Attente du rôle depuis plus de 5 secondes');
      console.warn('[useRoleGuard] État - user:', !!user, 'role:', role, 'profile:', profile ? 'exists' : 'null', 'loading:', loading);
      return false;
    }
    
    return true;
  }, [requiresRole, user, role, profile, loading, awaitingRoleStart]);

  return {
    user,
    role,
    loading,
    awaitingRole,
    isAllowed,
  };
}
