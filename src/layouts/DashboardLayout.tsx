import type { ReactNode } from 'react';
import Footer from '../components/Footer';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
