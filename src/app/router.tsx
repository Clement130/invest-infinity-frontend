import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MarketingLayout from '../layouts/MarketingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import PageLoader from '../components/PageLoader';
import { marketingRoutes, clientRoutes, adminRoutes } from './routes';
import { useReducedMotion } from '../hooks/useReducedMotion';

const NotFound = lazy(() => import('../pages/NotFound'));

// Composant pour les transitions de page - optimisé pour mobile
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { shouldReduceMotion } = useReducedMotion();
  
  // Sur mobile ou si l'utilisateur préfère les animations réduites, on simplifie drastiquement
  if (shouldReduceMotion) {
    return <div className="w-full h-full">{children}</div>;
  }

  // Sur desktop, on garde une transition simple sans blur (trop coûteux)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// Layout wrapper persistant pour les routes client /app/*
function ClientLayoutWrapper() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  const location = useLocation();

  // On exclut les routes /app/ du re-render complet pour éviter de remonter le layout Dashboard
  // Le Dashboard gérera ses propres transitions internes si nécessaire
  const isDashboardRoute = location.pathname.startsWith('/app') || location.pathname.startsWith('/admin');

  return (
    <Suspense fallback={<PageLoader />}>
      {/* 
         Si on est sur le dashboard, on ne veut PAS détruire le layout à chaque changement de page.
         Donc on n'utilise pas AnimatePresence global avec key sur ces routes là, 
         ou on accepte que le layout se recharge (moins premium).
         
         Pour l'instant, on applique l'effet global "Wow" sur les pages marketing.
         Pour le dashboard, on appliquera une transition plus douce sans remount du layout.
      */}
      
      {!isDashboardRoute ? (
          <Routes location={location} key={location.pathname}>
            {/* Routes marketing */}
            {marketingRoutes.map(({ path, element, layout }) => {
              const {
                header: showHeader = true,
                footer: showFooter = true,
              } = layout ?? {};

              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PageTransition>
                      <MarketingLayout
                        showHeader={showHeader}
                        showFooter={showFooter}
                      >
                        {element}
                      </MarketingLayout>
                    </PageTransition>
                  }
                />
              );
            })}

            {/* Routes admin et app redirigées vers le bloc suivant si correspondances directes */}
            {/* Mais comme on utilise Routes avec location fixe, il faut inclure TOUTES les routes ici aussi */}
            
            {/* Routes client */}
            <Route path="/app" element={<ClientLayoutWrapper />}>
              {clientRoutes.map(({ path, element }) => (
                <Route
                  key={path || 'index'}
                  index={path === ''}
                  path={path || undefined}
                  element={element}
                />
              ))}
            </Route>

             {/* Routes admin */}
            {adminRoutes.map(({ path, element, allowedRoles }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute allowedRoles={allowedRoles}>
                    {element}
                    </ProtectedRoute>
                  }
                />
            ))}
             <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigate to="/admin" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <PageTransition>
                  <NotFound />
                </PageTransition>
              }
            />
          </Routes>
      ) : (
        /* Mode SANS AnimatePresence globale pour Dashboard/Admin pour éviter le flicker du layout */
        <Routes>
             {/* Routes marketing (nécessaires pour que le router fonctionne si on navigue) */}
             {marketingRoutes.map(({ path, element, layout }) => {
                 const {
                    header: showHeader = true,
                    footer: showFooter = true,
                  } = layout ?? {};
                 return (
                    <Route
                      key={path}
                      path={path}
                      element={
                        <MarketingLayout showHeader={showHeader} showFooter={showFooter}>
                            {element}
                        </MarketingLayout>
                      }
                    />
                 )
             })}

            <Route path="/app" element={<ClientLayoutWrapper />}>
              {clientRoutes.map(({ path, element }) => (
                <Route
                  key={path || 'index'}
                  index={path === ''}
                  path={path || undefined}
                  element={
                    // Transition interne au dashboard
                    <PageTransition>
                        {element}
                    </PageTransition>
                  }
                />
              ))}
            </Route>

            {adminRoutes.map(({ path, element, allowedRoles }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute allowedRoles={allowedRoles}>
                        <PageTransition>
                            {element}
                        </PageTransition>
                    </ProtectedRoute>
                  }
                />
            ))}
             <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigate to="/admin" replace />
                </ProtectedRoute>
              }
            />
             <Route
              path="*"
              element={
                <PageTransition>
                  <NotFound />
                </PageTransition>
              }
            />
        </Routes>
      )}
    </Suspense>
  );
}
