/**
 * MobileSidebarContext - Gère l'état d'ouverture du sidebar mobile
 * 
 * Permet à la BottomNav d'ouvrir le sidebar qui contient tous les onglets
 * (Événements, Partenariats, etc.) non visibles dans la bottom nav.
 */

import * as React from 'react';

interface MobileSidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSidebarContext = React.createContext<MobileSidebarContextType | undefined>(undefined);

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev: boolean) => !prev), []);

  return (
    <MobileSidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  const context = React.useContext(MobileSidebarContext);
  
  if (!context) {
    throw new Error('useMobileSidebar doit être utilisé dans MobileSidebarProvider');
  }
  
  return context;
}

