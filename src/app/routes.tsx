import { lazy, ReactNode } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import type { UserRole } from '../types/training';

// Lazy load pages
const Home = lazy(() => import('../pages/Home'));
const Welcome = lazy(() => import('../pages/Welcome'));
const TradingAccount = lazy(() => import('../pages/TradingAccount'));
const PropFirmChallenge = lazy(() => import('../pages/PropFirmChallenge'));
const Login = lazy(() => import('../pages/Login'));
const ClientApp = lazy(() => import('../pages/ClientApp'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard')); // Semble inutilisé ou doublon avec DashboardPage ?
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const LeadsPage = lazy(() => import('../pages/admin/LeadsPage'));
const FormationsPage = lazy(() => import('../pages/admin/FormationsPage'));
const PaiementsPage = lazy(() => import('../pages/admin/PaiementsPage'));
const AnalyticsPage = lazy(() => import('../pages/admin/AnalyticsPage'));
const ContenuPage = lazy(() => import('../pages/admin/ContenuPage'));
const ClientPreviewPage = lazy(() => import('../pages/admin/ClientPreviewPage'));
const AdminChallengesPage = lazy(() => import('../pages/admin/ChallengesPage'));
const VideosManagerPage = lazy(() => import('../pages/admin/VideosManagerPage'));
const VideosManagement = lazy(() => import('../pages/admin/VideosManagement'));
const AdminSettingsPage = lazy(() => import('../pages/admin/SettingsPage'));
const ModulePage = lazy(() => import('../pages/ModulePage'));
const LessonPlayerPage = lazy(() => import('../pages/LessonPlayerPage'));
const MemberDashboard = lazy(() => import('../pages/MemberDashboard'));
const ProgressPage = lazy(() => import('../pages/ProgressPage'));
const ClientChallengesPage = lazy(() => import('../pages/ChallengesPage'));
const EventsPage = lazy(() => import('../pages/EventsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const SuccessPage = lazy(() => import('../pages/SuccessPage'));
const ConfirmationPage = lazy(() => import('../pages/ConfirmationPage'));
const CreatePasswordPage = lazy(() => import('../pages/CreatePasswordPage'));
const UpgradeOffer = lazy(() => import('../components/UpgradeOffer'));
const LandingForm = lazy(() => import('../components/LandingForm/LandingForm').then(module => ({ default: module.LandingForm }))); // Named export handling

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
  {
    path: '/create-password',
    element: <CreatePasswordPage />,
    layout: { header: false, footer: false, leadbooster: false },
  },
];

export const dashboardRoutes: DashboardRouteConfig[] = [
  { path: '/app', element: <ClientApp /> },
  { path: '/app/dashboard', element: <MemberDashboard /> },
  { path: '/app/progress', element: <ProgressPage /> },
  { path: '/app/challenges', element: <ClientChallengesPage /> },
  { path: '/app/events', element: <EventsPage /> },
  { path: '/app/settings', element: <SettingsPage /> },
  { path: '/app/modules/:moduleId', element: <ModulePage /> },
  { path: '/app/modules/:moduleId/lessons/:lessonId', element: <LessonPlayerPage /> },
  { path: '/admin', element: <AdminLayout activeSection="dashboard"><DashboardPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/users', element: <AdminLayout activeSection="users"><UsersPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/leads', element: <AdminLayout activeSection="leads"><LeadsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/formations', element: <AdminLayout activeSection="formations"><FormationsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/paiements', element: <AdminLayout activeSection="paiements"><PaiementsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/analytiques', element: <AdminLayout activeSection="analytiques"><AnalyticsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/contenu', element: <AdminLayout activeSection="contenu"><ContenuPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/preview', element: <AdminLayout activeSection="preview"><ClientPreviewPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/videos', element: <AdminLayout activeSection="videos"><VideosManagement /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/challenges', element: <AdminLayout activeSection="challenges"><AdminChallengesPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/settings', element: <AdminLayout activeSection="settings"><AdminSettingsPage /></AdminLayout>, allowedRoles: ['admin'] },
];
