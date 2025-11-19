import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import MarketingLayout from '../layouts/MarketingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/Home';
import Welcome from '../pages/Welcome';
import TradingAccount from '../pages/TradingAccount';
import PropFirmChallenge from '../pages/PropFirmChallenge';
import Login from '../pages/Login';
import ClientApp from '../pages/ClientApp';
import AdminDashboard from '../pages/AdminDashboard';
import ModulePage from '../pages/ModulePage';
import LessonPlayerPage from '../pages/LessonPlayerPage';
import UpgradeOffer from '../components/UpgradeOffer';
import { LandingForm } from '../components/LandingForm/LandingForm';
import ProtectedRoute from '../components/ProtectedRoute';

interface MarketingRouteConfig {
  path: string;
  element: ReactNode;
  showHeader?: boolean;
  showLeadbooster?: boolean;
  showFooter?: boolean;
}

const marketingRoutes: MarketingRouteConfig[] = [
  { path: '/', element: <Home />, showLeadbooster: true },
  { path: '/welcome', element: <Welcome />, showLeadbooster: false },
  { path: '/trading-account', element: <TradingAccount />, showHeader: false, showLeadbooster: false },
  { path: '/propfirm-challenge', element: <PropFirmChallenge />, showLeadbooster: true },
  { path: '/start', element: <UpgradeOffer />, showLeadbooster: false },
  { path: '/discord', element: <LandingForm />, showHeader: false, showLeadbooster: false },
  { path: '/login', element: <Login />, showHeader: false, showLeadbooster: false },
];

export default function AppRouter() {
  return (
    <Routes>
      {marketingRoutes.map(
        ({ path, element, showHeader = true, showLeadbooster = true, showFooter = true }) => (
          <Route
            key={path}
            path={path}
            element={
              <MarketingLayout
                showHeader={showHeader}
                showLeadbooster={showLeadbooster}
                showFooter={showFooter}
              >
                {element}
              </MarketingLayout>
            }
          />
        )
      )}

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ClientApp />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/modules/:moduleId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ModulePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/modules/:moduleId/lessons/:lessonId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LessonPlayerPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
