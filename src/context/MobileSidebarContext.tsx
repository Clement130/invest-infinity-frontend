/**
 * MobileSidebarContext - Gère l'état d'ouverture du sidebar mobile
 * 
 * Permet à la BottomNav d'ouvrir le sidebar qui contient tous les onglets
 * (Événements, Partenariats, etc.) non visibles dans la bottom nav.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface MobileSidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined);

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const value: MobileSidebarContextType = {
    isOpen,
    open,
    close,
    toggle,
  };

  return (
    <MobileSidebarContext.Provider value={value}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar(): MobileSidebarContextType {
  const context = useContext(MobileSidebarContext);
  
  if (context === undefined) {
    throw new Error('useMobileSidebar doit être utilisé dans MobileSidebarProvider');
  }
  
  return context;
}
