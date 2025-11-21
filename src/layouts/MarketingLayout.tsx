import type { ReactNode } from 'react';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CookieBanner from '../components/CookieBanner';
import RGPDModal from '../components/RGPDModal';
import { LeadboosterLoader } from '../components/LeadboosterLoader';

interface MarketingLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  showLeadbooster?: boolean;
}

export default function MarketingLayout({
  children,
  showHeader = true,
  showFooter = true,
  showLeadbooster = true,
}: MarketingLayoutProps) {
  const [isRGPDModalOpen, setIsRGPDModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showHeader && <Header />}
      {showLeadbooster && <LeadboosterLoader />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer onOpenRGPD={() => setIsRGPDModalOpen(true)} />}
      <CookieBanner onOpenRGPD={() => setIsRGPDModalOpen(true)} />
      <RGPDModal isOpen={isRGPDModalOpen} onClose={() => setIsRGPDModalOpen(false)} />
    </div>
  );
}
