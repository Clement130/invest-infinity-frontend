import { Routes, Route } from 'react-router-dom';
import MarketingLayout from '../layouts/MarketingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardPage from '../pages/admin/DashboardPage';
import { marketingRoutes, dashboardRoutes } from './routes';

export default function AppRouter() {
  return (
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
        // Les routes admin utilisent déjà AdminLayout dans l'élément
        // Les autres routes utilisent DashboardLayout
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
        element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout activeSection="dashboard"><DashboardPage /></AdminLayout></ProtectedRoute>}
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
  );
}
