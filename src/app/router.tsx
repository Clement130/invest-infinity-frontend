import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MarketingLayout from '../layouts/MarketingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import PageLoader from '../components/PageLoader';
import { marketingRoutes, clientRoutes, adminRoutes } from './routes';

const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));

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
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Routes marketing */}
        {marketingRoutes.map(({ path, element, layout }) => {
          const {
            header: showHeader = true,
            footer: showFooter = true,
            leadbooster: showLeadbooster = true,
          } = layout ?? {};

          return (
            <Route
              key={path}
              path={path}
              element={
                <MarketingLayout
                  showHeader={showHeader}
                  showFooter={showFooter}
                  showLeadbooster={showLeadbooster}
                >
                  {element}
                </MarketingLayout>
              }
            />
          );
        })}

        {/* Routes client avec layout persistant */}
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
        
        {/* Route catch-all pour /admin/dashboard -> redirige vers /admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout activeSection="dashboard">
                <DashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Route catch-all pour les 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-gray-400 mb-8">Page non trouvée</p>
                <a href="/" className="text-pink-500 hover:text-pink-600">
                  Retour à l'accueil
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
