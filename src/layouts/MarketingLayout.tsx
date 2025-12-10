import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CookieBanner from '../components/CookieBanner';
import RGPDModal from '../components/RGPDModal';
import ExitIntentModal from '../components/ExitIntentModal';

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer onOpenRGPD={() => setIsRGPDModalOpen(true)} />}
      <CookieBanner onOpenRGPD={() => setIsRGPDModalOpen(true)} />
      <RGPDModal isOpen={isRGPDModalOpen} onClose={() => setIsRGPDModalOpen(false)} />
      
      {/* Exit Intent Modal - Popup intelligent pour capturer les emails */}
      <ExitIntentModal
        strategies={{
          exitIntent: true, // Détection exit-intent (mouseleave vers le haut)
          delaySeconds: 45, // Afficher après 45 secondes si pas de exit-intent
          scrollPercentage: 60, // Afficher après 60% de scroll
          timeMinutes: 2, // Afficher après 2 minutes sur la page
        }}
        cooldownHours={24} // Ne pas réafficher avant 24h
      />
    </div>
  );
}
