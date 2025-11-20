import type { ReactNode } from 'react';
import Home from '../pages/Home';
import Welcome from '../pages/Welcome';
import TradingAccount from '../pages/TradingAccount';
import PropFirmChallenge from '../pages/PropFirmChallenge';
import Login from '../pages/Login';
import ClientApp from '../pages/ClientApp';
import AdminDashboard from '../pages/AdminDashboard';
import DashboardPage from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import LeadsPage from '../pages/admin/LeadsPage';
import FormationsPage from '../pages/admin/FormationsPage';
import PaiementsPage from '../pages/admin/PaiementsPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import ContenuPage from '../pages/admin/ContenuPage';
import ClientPreviewPage from '../pages/admin/ClientPreviewPage';
import ChallengesPage from '../pages/admin/ChallengesPage';
import ModulePage from '../pages/ModulePage';
import LessonPlayerPage from '../pages/LessonPlayerPage';
import MemberDashboard from '../pages/MemberDashboard';
import ProgressPage from '../pages/ProgressPage';
import ChallengesPage from '../pages/ChallengesPage';
import EventsPage from '../pages/EventsPage';
import SettingsPage from '../pages/SettingsPage';
import Testimonials from '../pages/Testimonials';
import PricingPage from '../pages/PricingPage';
import SuccessPage from '../pages/SuccessPage';
import ConfirmationPage from '../pages/ConfirmationPage';
import UpgradeOffer from '../components/UpgradeOffer';
import { LandingForm } from '../components/LandingForm/LandingForm';
import AdminLayout from '../layouts/AdminLayout';
import type { UserRole } from '../types/training';

export type MarketingRouteConfig = {
  path: string;
  element: ReactNode;
  layout?: {
    header?: boolean;
    footer?: boolean;
    leadbooster?: boolean;
  };
};

export type DashboardRouteConfig = {
  path: string;
  element: ReactNode;
  allowedRoles?: UserRole[];
};

export const marketingRoutes: MarketingRouteConfig[] = [
  { path: '/', element: <Home />, layout: { leadbooster: true } },
  { path: '/welcome', element: <Welcome />, layout: { leadbooster: false } },
  {
    path: '/trading-account',
    element: <TradingAccount />,
    layout: { header: false, footer: true, leadbooster: false },
  },
  {
    path: '/propfirm-challenge',
    element: <PropFirmChallenge />,
    layout: { leadbooster: true },
  },
  {
    path: '/start',
    element: <UpgradeOffer />,
    layout: { leadbooster: false },
  },
  {
    path: '/discord',
    element: <LandingForm />,
    layout: { header: false, footer: false, leadbooster: false },
  },
  {
    path: '/login',
    element: <Login />,
    layout: { header: false, footer: false, leadbooster: false },
  },
  {
    path: '/pricing',
    element: <PricingPage />,
    layout: { header: true, footer: true, leadbooster: false },
  },
  {
    path: '/success',
    element: <SuccessPage />,
    layout: { header: false, footer: false, leadbooster: false },
  },
  {
    path: '/confirmation',
    element: <ConfirmationPage />,
    layout: { header: false, footer: true, leadbooster: false },
  },
];

export const dashboardRoutes: DashboardRouteConfig[] = [
  { path: '/app', element: <ClientApp /> },
  { path: '/app/dashboard', element: <MemberDashboard /> },
  { path: '/app/progress', element: <ProgressPage /> },
  { path: '/app/challenges', element: <ChallengesPage /> },
  { path: '/app/events', element: <EventsPage /> },
  { path: '/app/settings', element: <SettingsPage /> },
  { path: '/app/modules/:moduleId', element: <ModulePage /> },
  { path: '/app/modules/:moduleId/lessons/:lessonId', element: <LessonPlayerPage /> },
  { path: '/testimonials', element: <Testimonials /> },
  { path: '/admin', element: <AdminLayout activeSection="dashboard"><DashboardPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/users', element: <AdminLayout activeSection="users"><UsersPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/leads', element: <AdminLayout activeSection="leads"><LeadsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/formations', element: <AdminLayout activeSection="formations"><FormationsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/paiements', element: <AdminLayout activeSection="paiements"><PaiementsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/analytiques', element: <AdminLayout activeSection="analytiques"><AnalyticsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/contenu', element: <AdminLayout activeSection="contenu"><ContenuPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/preview', element: <AdminLayout activeSection="preview"><ClientPreviewPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/challenges', element: <AdminLayout activeSection="challenges"><ChallengesPage /></AdminLayout>, allowedRoles: ['admin'] },
];
