import { Routes, Route } from 'react-router-dom';
import MarketingLayout from '../layouts/MarketingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
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
    </Routes>
  );
}
