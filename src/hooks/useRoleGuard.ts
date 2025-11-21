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

    // Le rôle 'developer' a les mêmes permissions que 'admin'
    // Si les routes admin sont autorisées, le développeur y a aussi accès
    if (role === 'developer' && allowedRoles?.includes('admin')) {
      return true;
    }

    return allowedRoles?.includes(role) ?? false;
  }, [allowedRoles, requiresRole, role, user]);

  // awaitingRole : on attend le rôle seulement si l'utilisateur existe mais le profil n'est pas encore chargé
  // On limite à 3 secondes max pour éviter les boucles infinies
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
    if (role !== null) {
      return false;
    }
    
    // Si loading est false et profile est null, on n'attend plus (profil n'existe pas ou erreur)
    if (!loading && profile === null) {
      return false;
    }
    
    // Si on attend depuis plus de 3 secondes, on considère que c'est une erreur
    const waitTime = Date.now() - awaitingRoleStart;
    if (waitTime > 3000) {
      console.warn('[useRoleGuard] Attente du rôle depuis plus de 3 secondes - arrêt de l\'attente');
      console.warn('[useRoleGuard] État - user:', !!user, 'role:', role, 'profile:', profile ? 'exists' : 'null', 'loading:', loading);
      return false;
    }
    
    // On attend seulement si loading est true
    return loading;
  }, [requiresRole, user, role, profile, loading, awaitingRoleStart]);

  return {
    user,
    role,
    loading,
    awaitingRole,
    isAllowed,
  };
}
