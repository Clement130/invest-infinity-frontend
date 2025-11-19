import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: ('admin' | 'client')[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Tant que l'on charge la session + le rôle
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Chargement...
      </div>
    );
  }

  // Pas connecté -> redirection vers login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si on a des rôles définis et que le rôle n'est pas encore connu -> on attend
  if (allowedRoles && role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Chargement...
      </div>
    );
  }

  // Si on a des rôles définis et que l'utilisateur n'est pas autorisé
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Cas particulier : un client qui tente d'aller sur /admin -> on le renvoie vers /app
    if (role === 'client') {
      return <Navigate to="/app" replace />;
    }
    // Sinon, retour à la home
    return <Navigate to="/" replace />;
  }

  // Tout est bon
  return <>{children}</>;
}
