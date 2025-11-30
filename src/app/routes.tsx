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
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const LeadsPage = lazy(() => import('../pages/admin/LeadsPage'));
const FormationsPage = lazy(() => import('../pages/admin/FormationsPage'));
const PaiementsPage = lazy(() => import('../pages/admin/PaiementsPage'));
const AnalyticsPage = lazy(() => import('../pages/admin/AnalyticsPage'));
const ContenuPage = lazy(() => import('../pages/admin/ContenuPage'));
const ClientPreviewPage = lazy(() => import('../pages/admin/ClientPreviewPage'));
const AdminChallengesPage = lazy(() => import('../pages/admin/ChallengesPage'));
const AdminEventsPage = lazy(() => import('../pages/admin/EventsPage'));
const VideosManagement = lazy(() => import('../pages/admin/VideosManagement'));
const AdminSettingsPage = lazy(() => import('../pages/admin/SettingsPage'));
const ManageImmersionSessions = lazy(() => import('../pages/admin/ManageImmersionSessions'));
const AppointmentsPage = lazy(() => import('../pages/admin/AppointmentsPage'));
const HelpPage = lazy(() => import('../pages/admin/HelpPage'));
const ModulePage = lazy(() => import('../pages/ModulePage'));
const LessonPlayerPage = lazy(() => import('../pages/LessonPlayerPage'));
const MemberDashboard = lazy(() => import('../pages/MemberDashboard'));
const ProgressPage = lazy(() => import('../pages/ProgressPage'));
const ClientChallengesPage = lazy(() => import('../pages/ChallengesPage'));
const EventsPage = lazy(() => import('../pages/EventsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const ImmersionElitePage = lazy(() => import('../pages/ImmersionElitePage'));
const SuccessPage = lazy(() => import('../pages/SuccessPage'));
const ConfirmationPage = lazy(() => import('../pages/ConfirmationPage'));
const CreatePasswordPage = lazy(() => import('../pages/CreatePasswordPage'));
const UpgradeOffer = lazy(() => import('../components/UpgradeOffer'));
const LandingForm = lazy(() => import('../components/LandingForm/LandingForm').then(module => ({ default: module.LandingForm })));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const BootcampElitePage = lazy(() => import('../pages/BootcampElitePage'));

export type MarketingRouteConfig = {
  path: string;
  element: ReactNode;
  layout?: {
    header?: boolean;
    footer?: boolean;
  };
};

export type ClientRouteConfig = {
  path: string; // Chemin relatif (ex: "" pour /app, "dashboard" pour /app/dashboard)
  element: ReactNode;
};

export type AdminRouteConfig = {
  path: string;
  element: ReactNode;
  allowedRoles?: UserRole[];
};

export const marketingRoutes: MarketingRouteConfig[] = [
  { path: '/', element: <Home /> },
  { path: '/welcome', element: <Welcome /> },
  {
    path: '/trading-account',
    element: <TradingAccount />,
    layout: { header: false, footer: true },
  },
  {
    path: '/propfirm-challenge',
    element: <PropFirmChallenge />,
  },
  {
    path: '/start',
    element: <UpgradeOffer />,
  },
  {
    path: '/discord',
    element: <LandingForm />,
    layout: { header: false, footer: false },
  },
  {
    path: '/login',
    element: <Login />,
    layout: { header: false, footer: false },
  },
  {
    path: '/pricing',
    element: <PricingPage />,
    layout: { header: true, footer: true },
  },
  {
    path: '/immersion-elite',
    element: <ImmersionElitePage />,
    layout: { header: true, footer: true },
  },
  {
    path: '/success',
    element: <SuccessPage />,
    layout: { header: false, footer: false },
  },
  {
    path: '/confirmation',
    element: <ConfirmationPage />,
    layout: { header: false, footer: true },
  },
  {
    path: '/create-password',
    element: <CreatePasswordPage />,
    layout: { header: false, footer: false },
  },
  {
    path: '/contact',
    element: <ContactPage />,
    layout: { header: true, footer: true },
  },
  {
    path: '/bootcamp-elite',
    element: <BootcampElitePage />,
    layout: { header: true, footer: true },
  },
];

// Routes client avec chemins relatifs pour les nested routes
// Le layout persiste car il est parent de toutes ces routes
export const clientRoutes: ClientRouteConfig[] = [
  { path: '', element: <ClientApp /> }, // /app
  { path: 'dashboard', element: <MemberDashboard /> }, // /app/dashboard
  { path: 'progress', element: <ProgressPage /> }, // /app/progress
  { path: 'challenges', element: <ClientChallengesPage /> }, // /app/challenges
  { path: 'events', element: <EventsPage /> }, // /app/events
  { path: 'settings', element: <SettingsPage /> }, // /app/settings
  { path: 'modules/:moduleId', element: <ModulePage /> }, // /app/modules/:moduleId
  { path: 'modules/:moduleId/lessons/:lessonId', element: <LessonPlayerPage /> }, // /app/modules/:moduleId/lessons/:lessonId
];

// Routes admin
export const adminRoutes: AdminRouteConfig[] = [
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
  { path: '/admin/events', element: <AdminLayout activeSection="events"><AdminEventsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/immersion', element: <AdminLayout activeSection="immersion"><ManageImmersionSessions /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/appointments', element: <AdminLayout activeSection="appointments"><AppointmentsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/settings', element: <AdminLayout activeSection="settings"><AdminSettingsPage /></AdminLayout>, allowedRoles: ['admin'] },
  { path: '/admin/help', element: <AdminLayout activeSection="help"><HelpPage /></AdminLayout>, allowedRoles: ['admin'] },
];
