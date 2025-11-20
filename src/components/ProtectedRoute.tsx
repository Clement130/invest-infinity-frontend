import { type ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../types/training';
import { useRoleGuard } from '../hooks/useRoleGuard';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, role, loading, awaitingRole, isAllowed } = useRoleGuard(allowedRoles);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (loading || awaitingRole) {
      const timer = setTimeout(() => {
        console.warn('[ProtectedRoute] Chargement depuis plus de 10 secondes');
        console.warn('[ProtectedRoute] État - loading:', loading, 'awaitingRole:', awaitingRole, 'user:', !!user, 'role:', role);
        
        let message = 'Le chargement prend trop de temps.';
        if (awaitingRole && !role) {
          message = 'Le profil utilisateur ne se charge pas. Vérifie que le profil existe dans Supabase.';
        } else if (loading) {
          message = 'La session ne se charge pas. Vérifie ta connexion.';
        }
        
        setErrorMessage(message);
        setShowError(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
      setErrorMessage('');
    }
  }, [loading, awaitingRole, user, role]);

  if (loading || awaitingRole) {
    if (showError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center space-y-4 max-w-md px-4">
            <p className="text-red-400 text-lg font-semibold">Erreur de chargement</p>
            <p className="text-gray-400 text-sm">{errorMessage}</p>
            <p className="text-gray-500 text-xs">Vérifie la console du navigateur (F12) pour plus de détails.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
              >
                Recharger la page
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAllowed) {
    if (role === 'client') {
      return <Navigate to="/app" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
