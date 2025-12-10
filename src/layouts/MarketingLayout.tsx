import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CookieBanner from '../components/CookieBanner';
import RGPDModal from '../components/RGPDModal';

interface MarketingLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function MarketingLayout({
  children,
  showHeader = true,
  showFooter = true,
}: MarketingLayoutProps) {
  const [isRGPDModalOpen, setIsRGPDModalOpen] = useState(false);
  const location = useLocation();
  
  // Ne pas afficher le CookieBanner sur les pages critiques où il pourrait bloquer l'interface de connexion
  // Note: /confirmation n'est PAS masqué car le Footer contient "Gérer les cookies",
  // donc le CookieBanner doit être accessible pour la cohérence UX avec le Footer
  const hideCookieBanner = ['/login', '/create-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer onOpenRGPD={() => setIsRGPDModalOpen(true)} />}
      {!hideCookieBanner && <CookieBanner onOpenRGPD={() => setIsRGPDModalOpen(true)} />}
      <RGPDModal isOpen={isRGPDModalOpen} onClose={() => setIsRGPDModalOpen(false)} />
    </div>
  );
}
