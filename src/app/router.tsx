import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import MarketingLayout from '../layouts/MarketingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import PageLoader from '../components/PageLoader';
// On importe les routes qui contiennent maintenant des composants Lazy
import { marketingRoutes, dashboardRoutes } from './routes';

// Pour la route catch-all /admin/dashboard, on a besoin de DashboardPage
// Mais on doit l'importer lazy aussi ou le récupérer de routes.tsx s'il est exporté
// Simplifions en évitant d'importer directement DashboardPage ici si possible
// Mais pour le fallback * et admin/dashboard, on va devoir faire attention.
import { lazy } from 'react';

const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
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

        {dashboardRoutes.map(({ path, element, allowedRoles }) => {
          const isAdminRoute = path.startsWith('/admin');
          
          return (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={allowedRoles}>
                  {isAdminRoute ? element : <DashboardLayout>{element}</DashboardLayout>}
                </ProtectedRoute>
              }
            />
          );
        })}
        
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
