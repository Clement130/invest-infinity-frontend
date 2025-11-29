import { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/training';

export function useRoleGuard(allowedRoles?: UserRole[]) {
  const { user, role, loading, profile } = useAuth();
  const requiresRole = Boolean(allowedRoles && allowedRoles.length > 0);
  
  // On garde en mémoire le dernier rôle valide pour éviter les redirections
  // pendant les rafraîchissements de session
  const [lastValidRole, setLastValidRole] = useState<UserRole | null>(null);
  
  // Timeout de sécurité pour éviter les blocages infinis
  const [forceComplete, setForceComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mettre à jour le dernier rôle valide quand on en a un
  useEffect(() => {
    if (role && user) {
      setLastValidRole(role);
      setForceComplete(false);
    } else if (!user) {
      // Réinitialiser le rôle quand l'utilisateur se déconnecte
      setLastValidRole(null);
      setForceComplete(false);
    }
  }, [role, user]);

  // Timeout de sécurité - après 5 secondes, forcer la fin du chargement
  useEffect(() => {
    if (loading && !forceComplete) {
      timeoutRef.current = setTimeout(() => {
        setForceComplete(true);
      }, 5000);
    } else if (!loading && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, forceComplete]);

  const isAllowed = useMemo(() => {
    if (!user) {
      return false;
    }

    if (!requiresRole) {
      return true;
    }

    // Utiliser le rôle actuel ou le dernier rôle valide si on est en train de recharger
    const currentRole = role ?? lastValidRole;

    if (!currentRole) {
      // Si on n'a pas de rôle et qu'on attend un rôle, on refuse l'accès
      // MAIS seulement si on n'est pas en train de charger (pour éviter les redirections
      // pendant les rafraîchissements où le profil est temporairement null)
      // Si loading est true, on attend encore (awaitingRole gère ça)
      // Si loading est false et qu'on n'a pas de rôle, alors vraiment pas d'accès
      if (!loading && !lastValidRole) {
        return false;
      }
      // Si on charge encore ou qu'on a un lastValidRole, on attend
      // (awaitingRole gère l'affichage du loader)
      return false;
    }

    // Le rôle 'developer' a les mêmes permissions que 'admin'
    // Si les routes admin sont autorisées, le développeur y a aussi accès
    if (currentRole === 'developer' && allowedRoles?.includes('admin')) {
      return true;
    }

    return allowedRoles?.includes(currentRole) ?? false;
  }, [allowedRoles, requiresRole, role, lastValidRole, user, loading]);

  // awaitingRole : on attend le rôle seulement si l'utilisateur existe mais le profil n'est pas encore chargé
  // On limite à 3 secondes max pour éviter les boucles infinies
  const [awaitingRoleStart, setAwaitingRoleStart] = useState(() => Date.now());
  
  // Réinitialiser le timer quand on commence vraiment à attendre
  useEffect(() => {
    if (user && !role && !lastValidRole && loading) {
      setAwaitingRoleStart(Date.now());
    }
  }, [user, role, lastValidRole, loading]);
  
  const awaitingRole = useMemo(() => {
    // Si un rôle n'est pas requis, on n'attend pas
    if (!requiresRole) {
      return false;
    }
    
    // Si l'utilisateur n'existe pas, on n'attend pas
    if (!user) {
      return false;
    }
    
    // Si on a déjà un rôle valide en mémoire, on n'attend pas (rafraîchissement en cours)
    if (lastValidRole) {
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
      return false;
    }
    
    // On attend seulement si loading est true
    return loading;
  }, [requiresRole, user, role, profile, loading, awaitingRoleStart, lastValidRole]);

  // Si forceComplete est true, on considère que le chargement est terminé
  const effectiveLoading = forceComplete ? false : loading;
  const effectiveAwaitingRole = forceComplete ? false : awaitingRole;

  return {
    user,
    role,
    loading: effectiveLoading,
    awaitingRole: effectiveAwaitingRole,
    isAllowed,
  };
}
