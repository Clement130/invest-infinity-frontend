/**
 * AdminLayout – Layout principal de l'espace admin
 * 
 * Architecture responsive multi-plateforme :
 * - Mobile (< 1024px) : Sidebar en drawer overlay, topbar avec hamburger
 * - Desktop (>= 1024px) : Sidebar permanente, topbar complète
 * 
 * Fonctionnalités :
 * - Navigation groupée par sections
 * - Command Palette (Cmd+K / Ctrl+K)
 * - Notifications temps réel
 * - Menu utilisateur
 * - Bouton "Créer" contextuel
 * - Aide rapide
 */

import { useState, useCallback, type ReactNode } from 'react';
import { AdminSidebar, AdminTopbar, AdminContent } from '../components/admin/layout';
import CommandPalette from '../components/admin/CommandPalette';
import { NotificationsProvider } from '../context/NotificationsContext';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection?: string;
  /** Mode pleine largeur pour les pages avec tableaux larges */
  fullWidth?: boolean;
  /** Padding réduit pour les pages denses */
  compact?: boolean;
}

export default function AdminLayout({
  children,
  activeSection = 'dashboard',
  fullWidth = false,
  compact = false,
}: AdminLayoutProps) {
  // État du drawer sidebar (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar - drawer sur mobile, permanente sur desktop */}
        <AdminSidebar
          activeSection={activeSection}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        {/* Zone principale (topbar + contenu) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar responsive */}
          <AdminTopbar onMenuClick={openSidebar} />

          {/* Contenu de la page */}
          <AdminContent fullWidth={fullWidth} compact={compact}>
            {children}
          </AdminContent>
        </div>

        {/* Command Palette (modal globale) */}
        <CommandPalette />
      </div>
    </NotificationsProvider>
  );
}
